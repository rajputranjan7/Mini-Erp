import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { PaginationParams } from "../../utils/pagination";
import { CreateChallanInput, UpdateChallanInput } from "./challan.schema";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

// Generates a human-readable, sequential challan number scoped by year, e.g. CH-2026-00042.
// Runs inside the caller's transaction so the count-then-insert is consistent.
async function generateChallanNumber(tx: Tx): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CH-${year}-`;

  const countThisYear = await tx.salesChallan.count({
    where: { challanNumber: { startsWith: prefix } },
  });

  return `${prefix}${String(countThisYear + 1).padStart(5, "0")}`;
}

// Builds challan line items with a PRODUCT SNAPSHOT (name/sku/price at the
// time of sale) so the challan stays historically accurate even if the
// product is edited or removed later. Also validates every product exists.
async function buildSnapshotItems(tx: Tx, items: { productId: string; quantity: number }[]) {
  const productIds = items.map((i) => i.productId);
  const products = await tx.product.findMany({ where: { id: { in: productIds } } });

  const productMap = new Map(products.map((p) => [p.id, p]));
  const missing = productIds.filter((id) => !productMap.has(id));
  if (missing.length > 0) {
    throw ApiError.badRequest("One or more products were not found", { missingProductIds: missing });
  }

  return items.map((item) => {
    const product = productMap.get(item.productId)!;
    const unitPrice = product.unitPrice;
    return {
      productId: product.id,
      productNameSnap: product.name,
      productSkuSnap: product.sku,
      unitPriceSnap: unitPrice,
      quantity: item.quantity,
      lineTotal: unitPrice.mul(item.quantity),
    };
  });
}

// Deducts stock for every item, throwing (and rolling back the transaction)
// if ANY product doesn't have enough stock. Nothing is partially applied.
async function deductStockForItems(
  tx: Tx,
  items: { productId: string; quantity: number }[],
  challanId: string,
  createdById: string
) {
  for (const item of items) {
    const product = await tx.product.findUnique({ where: { id: item.productId } });
    if (!product) throw ApiError.badRequest(`Product ${item.productId} not found`);

    if (product.currentStock < item.quantity) {
      throw ApiError.badRequest(
        `Insufficient stock for "${product.name}" (SKU ${product.sku}): available ${product.currentStock}, requested ${item.quantity}`
      );
    }

    await tx.product.update({
      where: { id: item.productId },
      data: { currentStock: { decrement: item.quantity } },
    });

    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        quantity: item.quantity,
        movementType: "OUT",
        reason: "Sales challan confirmed",
        createdById,
        challanId,
      },
    });
  }
}

// Reverses stock deductions when a CONFIRMED challan is cancelled.
async function restockForItems(
  tx: Tx,
  items: { productId: string; quantity: number }[],
  challanId: string,
  createdById: string
) {
  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { currentStock: { increment: item.quantity } },
    });
    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        quantity: item.quantity,
        movementType: "IN",
        reason: "Sales challan cancelled - stock reversed",
        createdById,
        challanId,
      },
    });
  }
}

export async function createChallan(input: CreateChallanInput, createdById: string) {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) throw ApiError.badRequest("Customer not found");

    const snapshotItems = await buildSnapshotItems(tx, input.items);
    const totalQuantity = snapshotItems.reduce((sum, i) => sum + i.quantity, 0);
    const challanNumber = await generateChallanNumber(tx);

    const challan = await tx.salesChallan.create({
      data: {
        challanNumber,
        customerId: input.customerId,
        status: "DRAFT",
        totalQuantity,
        createdById,
        items: { create: snapshotItems },
      },
      include: { items: true, customer: true },
    });

    // If the caller wants it confirmed immediately, apply stock deduction now.
    if (input.status === "CONFIRMED") {
      await deductStockForItems(
        tx,
        snapshotItems.map((i) => ({ productId: i.productId!, quantity: i.quantity })),
        challan.id,
        createdById
      );
      return tx.salesChallan.update({
        where: { id: challan.id },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
        include: { items: true, customer: true },
      });
    }

    return challan;
  });
}

export async function listChallans(
  filters: { status?: string; customerId?: string },
  pagination: PaginationParams
) {
  const where: Prisma.SalesChallanWhereInput = {
    ...(filters.status ? { status: filters.status as any } : {}),
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.salesChallan.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, businessName: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.salesChallan.count({ where }),
  ]);

  return { data, total };
}

export async function getChallanById(id: string) {
  const challan = await prisma.salesChallan.findUnique({
    where: { id },
    include: {
      customer: true,
      createdBy: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
  });
  if (!challan) throw ApiError.notFound("Sales challan not found");
  return challan;
}

// A DRAFT challan can have its customer/items replaced. Since no stock has
// moved yet for a draft, this is a simple replace-and-recalculate.
export async function updateChallan(id: string, input: UpdateChallanInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.salesChallan.findUnique({ where: { id }, include: { items: true } });
    if (!existing) throw ApiError.notFound("Sales challan not found");
    if (existing.status !== "DRAFT") {
      throw ApiError.badRequest(`Only DRAFT challans can be edited (current status: ${existing.status})`);
    }

    if (input.customerId) {
      const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
      if (!customer) throw ApiError.badRequest("Customer not found");
    }

    if (input.items) {
      const snapshotItems = await buildSnapshotItems(tx, input.items);
      await tx.salesChallanItem.deleteMany({ where: { challanId: id } });
      await tx.salesChallan.update({
        where: { id },
        data: {
          items: { create: snapshotItems },
          totalQuantity: snapshotItems.reduce((sum, i) => sum + i.quantity, 0),
          ...(input.customerId ? { customerId: input.customerId } : {}),
        },
      });
    } else if (input.customerId) {
      await tx.salesChallan.update({ where: { id }, data: { customerId: input.customerId } });
    }

    return tx.salesChallan.findUnique({
      where: { id },
      include: { items: true, customer: true },
    });
  });
}

// Confirms a DRAFT challan: deducts stock for every line item, atomically.
// If ANY item has insufficient stock, the entire confirmation is rolled back
// and a clear error is returned - no partial stock deduction ever happens.
export async function confirmChallan(id: string, confirmedById: string) {
  return prisma.$transaction(async (tx) => {
    const challan = await tx.salesChallan.findUnique({ where: { id }, include: { items: true } });
    if (!challan) throw ApiError.notFound("Sales challan not found");
    if (challan.status !== "DRAFT") {
      throw ApiError.badRequest(`Only DRAFT challans can be confirmed (current status: ${challan.status})`);
    }

    await deductStockForItems(
      tx,
      challan.items.map((i) => ({ productId: i.productId!, quantity: i.quantity })),
      challan.id,
      confirmedById
    );

    return tx.salesChallan.update({
      where: { id },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
      include: { items: true, customer: true },
    });
  });
}

// Cancels a challan. If it was already CONFIRMED (stock already deducted),
// the deducted stock is restored so inventory stays accurate.
export async function cancelChallan(id: string, cancelledById: string) {
  return prisma.$transaction(async (tx) => {
    const challan = await tx.salesChallan.findUnique({ where: { id }, include: { items: true } });
    if (!challan) throw ApiError.notFound("Sales challan not found");
    if (challan.status === "CANCELLED") {
      throw ApiError.badRequest("Challan is already cancelled");
    }

    if (challan.status === "CONFIRMED") {
      await restockForItems(
        tx,
        challan.items.map((i) => ({ productId: i.productId!, quantity: i.quantity })),
        challan.id,
        cancelledById
      );
    }

    return tx.salesChallan.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
      include: { items: true, customer: true },
    });
  });
}
