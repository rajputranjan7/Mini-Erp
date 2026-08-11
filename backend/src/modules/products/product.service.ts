import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { PaginationParams } from "../../utils/pagination";
import { CreateProductInput, StockMovementInput, UpdateProductInput } from "./product.schema";

interface ListFilters {
  search?: string;
  category?: string;
  lowStockOnly?: boolean;
}

export async function listProducts(filters: ListFilters, pagination: PaginationParams) {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { sku: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.product.findMany({ where, skip: pagination.skip, take: pagination.take, orderBy: { name: "asc" } }),
    prisma.product.count({ where }),
  ]);

  // lowStockOnly is applied post-query since it depends on comparing two
  // columns (currentStock <= minStockQty), which Prisma can't express
  // directly in a `where` filter without a raw query.
  const filtered = filters.lowStockOnly ? data.filter((p) => p.currentStock <= p.minStockQty) : data;

  return { data: filtered, total: filters.lowStockOnly ? filtered.length : total };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || !product.isActive) throw ApiError.notFound("Product not found");
  return product;
}

export async function createProduct(input: CreateProductInput) {
  return prisma.product.create({ data: input });
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  await getProductById(id);
  return prisma.product.update({ where: { id }, data: input });
}

// Records a manual stock adjustment (e.g. warehouse receiving new stock, or
// correcting a count) and updates the running total atomically.
export async function recordStockMovement(productId: string, input: StockMovementInput, createdById: string) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) throw ApiError.notFound("Product not found");

    const delta = input.movementType === "IN" ? input.quantity : -input.quantity;
    const newStock = product.currentStock + delta;

    if (newStock < 0) {
      throw ApiError.badRequest(
        `Insufficient stock: current stock is ${product.currentStock}, cannot remove ${input.quantity}`
      );
    }

    await tx.product.update({ where: { id: productId }, data: { currentStock: newStock } });

    return tx.stockMovement.create({
      data: {
        productId,
        quantity: input.quantity,
        movementType: input.movementType,
        reason: input.reason,
        createdById,
      },
    });
  });
}

export async function getStockMovements(productId: string, pagination: PaginationParams) {
  await getProductById(productId);
  const [data, total] = await prisma.$transaction([
    prisma.stockMovement.findMany({
      where: { productId },
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { id: true, name: true } } },
    }),
    prisma.stockMovement.count({ where: { productId } }),
  ]);
  return { data, total };
}
