import { z } from "zod";

export const challanItemSchema = z.object({
  productId: z.string().uuid("Invalid product id"),
  quantity: z.coerce.number().int().positive("Quantity must be greater than 0"),
});

export const createChallanSchema = z.object({
  customerId: z.string().uuid("Invalid customer id"),
  items: z.array(challanItemSchema).min(1, "At least one product line is required"),
  status: z.enum(["DRAFT", "CONFIRMED"]).optional().default("DRAFT"),
});

// Draft challans can have their customer/items replaced wholesale before confirmation.
export const updateChallanSchema = z.object({
  customerId: z.string().uuid().optional(),
  items: z.array(challanItemSchema).min(1).optional(),
});

export const listChallansQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  status: z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]).optional(),
  customerId: z.string().uuid().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid id format"),
});

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;
