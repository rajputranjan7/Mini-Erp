import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { getPagination, paginatedResponse } from "../../utils/pagination";
import {
  createProductSchema,
  idParamSchema,
  listProductsQuerySchema,
  stockMovementSchema,
  updateProductSchema,
} from "./product.schema";
import * as productService from "./product.service";

const router = Router();

router.use(requireAuth);

// All authenticated roles can VIEW products (sales needs it for challans,
// warehouse manages stock, accounts checks pricing). Only Admin/Warehouse can mutate.
router.get("/", validate({ query: listProductsQuerySchema }), async (req, res) => {
  const pagination = getPagination(req);
  const { search, category, lowStockOnly } = req.query as any;
  const { data, total } = await productService.listProducts({ search, category, lowStockOnly }, pagination);
  res.json(paginatedResponse(data, total, pagination));
});

router.get("/:id", validate({ params: idParamSchema }), async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.json(product);
});

router.post("/", requireRole("ADMIN", "WAREHOUSE"), validate({ body: createProductSchema }), async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json(product);
});

router.patch(
  "/:id",
  requireRole("ADMIN", "WAREHOUSE"),
  validate({ params: idParamSchema, body: updateProductSchema }),
  async (req, res) => {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.json(product);
  }
);

// GET /api/products/:id/stock-movements
router.get("/:id/stock-movements", validate({ params: idParamSchema }), async (req, res) => {
  const pagination = getPagination(req);
  const { data, total } = await productService.getStockMovements(req.params.id, pagination);
  res.json(paginatedResponse(data, total, pagination));
});

// POST /api/products/:id/stock-movements - manual IN/OUT adjustment
router.post(
  "/:id/stock-movements",
  requireRole("ADMIN", "WAREHOUSE"),
  validate({ params: idParamSchema, body: stockMovementSchema }),
  async (req, res) => {
    const movement = await productService.recordStockMovement(req.params.id, req.body, req.user!.id);
    res.status(201).json(movement);
  }
);

export default router;
