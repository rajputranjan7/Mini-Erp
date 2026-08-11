import { z } from "zod";

const customerTypeEnum = z.enum(["RETAIL", "WHOLESALE", "DISTRIBUTOR"]);
const customerStatusEnum = z.enum(["LEAD", "ACTIVE", "INACTIVE"]);

export const createCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z.string().min(7, "A valid mobile number is required").max(20),
  email: z.string().email().optional().or(z.literal("")),
  businessName: z.string().optional(),
  gstNumber: z.string().optional(),
  customerType: customerTypeEnum,
  status: customerStatusEnum.optional().default("LEAD"),
  address: z.string().optional(),
  followUpDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  status: customerStatusEnum.optional(),
  customerType: customerTypeEnum.optional(),
});

export const addFollowUpSchema = z.object({
  note: z.string().min(1, "Note is required"),
  followUpDate: z.coerce.date().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid id format"),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
