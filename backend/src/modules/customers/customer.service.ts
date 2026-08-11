import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { PaginationParams } from "../../utils/pagination";
import { CreateCustomerInput, UpdateCustomerInput } from "./customer.schema";

interface ListFilters {
  search?: string;
  status?: string;
  customerType?: string;
}

export async function listCustomers(filters: ListFilters, pagination: PaginationParams) {
  const where: Prisma.CustomerWhereInput = {
    ...(filters.status ? { status: filters.status as any } : {}),
    ...(filters.customerType ? { customerType: filters.customerType as any } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { mobile: { contains: filters.search, mode: "insensitive" } },
            { businessName: { contains: filters.search, mode: "insensitive" } },
            { email: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.customer.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { id: true, name: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  return { data, total };
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      followUps: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { id: true, name: true } } } },
      challans: { orderBy: { createdAt: "desc" }, select: { id: true, challanNumber: true, status: true, totalQuantity: true, createdAt: true } },
    },
  });
  if (!customer) throw ApiError.notFound("Customer not found");
  return customer;
}

export async function createCustomer(input: CreateCustomerInput, createdById: string) {
  return prisma.customer.create({
    data: {
      ...input,
      email: input.email || null,
      createdById,
    },
  });
}

export async function updateCustomer(id: string, input: UpdateCustomerInput) {
  await getCustomerById(id); // 404s if missing
  return prisma.customer.update({
    where: { id },
    data: { ...input, email: input.email === "" ? null : input.email },
  });
}

export async function addFollowUp(customerId: string, note: string, followUpDate: Date | undefined, createdById: string) {
  await getCustomerById(customerId); // 404s if missing

  return prisma.$transaction(async (tx) => {
    const followUp = await tx.followUp.create({
      data: { customerId, note, followUpDate, createdById },
    });

    // Keep the customer's own followUpDate in sync with the latest note,
    // so the customer list can surface "next follow-up" without a join.
    if (followUpDate) {
      await tx.customer.update({ where: { id: customerId }, data: { followUpDate } });
    }

    return followUp;
  });
}
