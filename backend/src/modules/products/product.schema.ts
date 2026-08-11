import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().optional(),
  unitPrice: z.coerce.number().nonnegative("Unit price cannot be negative"),
  currentStock: z.coerce.number().int().nonnegative().optional().default(0),
  minStockQty: z.coerce.number().int().nonnegative().optional().default(0),
  location: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial().omit({ currentStock: true });

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  lowStockOnly: z.coerce.boolean().optional(),
});

export const stockMovementSchema = z.object({
  quantity: z.coerce.number().int().positive("Quantity must be a positive number"),
  movementType: z.enum(["IN", "OUT"]),
  reason: z.string().min(1, "Reason is required"),
});

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid id format"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
