import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { getPagination, paginatedResponse } from "../../utils/pagination";
import {
  createChallanSchema,
  idParamSchema,
  listChallansQuerySchema,
  updateChallanSchema,
} from "./challan.schema";
import * as challanService from "./challan.service";

const router = Router();

router.use(requireAuth);

router.get("/", validate({ query: listChallansQuerySchema }), async (req, res) => {
  const pagination = getPagination(req);
  const { status, customerId } = req.query as any;
  const { data, total } = await challanService.listChallans({ status, customerId }, pagination);
  res.json(paginatedResponse(data, total, pagination));
});

router.get("/:id", validate({ params: idParamSchema }), async (req, res) => {
  const challan = await challanService.getChallanById(req.params.id);
  res.json(challan);
});

// Sales creates challans (as draft or directly confirmed).
router.post("/", requireRole("ADMIN", "SALES"), validate({ body: createChallanSchema }), async (req, res) => {
  const challan = await challanService.createChallan(req.body, req.user!.id);
  res.status(201).json(challan);
});

router.patch(
  "/:id",
  requireRole("ADMIN", "SALES"),
  validate({ params: idParamSchema, body: updateChallanSchema }),
  async (req, res) => {
    const challan = await challanService.updateChallan(req.params.id, req.body);
    res.json(challan);
  }
);

// POST /api/challans/:id/confirm - transitions DRAFT -> CONFIRMED, deducts stock
router.post(
  "/:id/confirm",
  requireRole("ADMIN", "SALES", "WAREHOUSE"),
  validate({ params: idParamSchema }),
  async (req, res) => {
    const challan = await challanService.confirmChallan(req.params.id, req.user!.id);
    res.json(challan);
  }
);

// POST /api/challans/:id/cancel - cancels a draft or confirmed challan (restocks if needed)
router.post(
  "/:id/cancel",
  requireRole("ADMIN", "SALES"),
  validate({ params: idParamSchema }),
  async (req, res) => {
    const challan = await challanService.cancelChallan(req.params.id, req.user!.id);
    res.json(challan);
  }
);

export default router;
