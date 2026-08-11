import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { getPagination, paginatedResponse } from "../../utils/pagination";
import {
  addFollowUpSchema,
  createCustomerSchema,
  idParamSchema,
  listCustomersQuerySchema,
  updateCustomerSchema,
} from "./customer.schema";
import * as customerService from "./customer.service";

const router = Router();

router.use(requireAuth);

// GET /api/customers?search=&status=&customerType=&page=&pageSize=
// Sales, Admin and Accounts can view the CRM; Warehouse has no need for it.
router.get(
  "/",
  requireRole("ADMIN", "SALES", "ACCOUNTS"),
  validate({ query: listCustomersQuerySchema }),
  async (req, res) => {
    const pagination = getPagination(req);
    const { search, status, customerType } = req.query as any;
    const { data, total } = await customerService.listCustomers({ search, status, customerType }, pagination);
    res.json(paginatedResponse(data, total, pagination));
  }
);

router.get("/:id", requireRole("ADMIN", "SALES", "ACCOUNTS"), validate({ params: idParamSchema }), async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  res.json(customer);
});

router.post(
  "/",
  requireRole("ADMIN", "SALES"),
  validate({ body: createCustomerSchema }),
  async (req, res) => {
    const customer = await customerService.createCustomer(req.body, req.user!.id);
    res.status(201).json(customer);
  }
);

router.patch(
  "/:id",
  requireRole("ADMIN", "SALES"),
  validate({ params: idParamSchema, body: updateCustomerSchema }),
  async (req, res) => {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    res.json(customer);
  }
);

router.post(
  "/:id/follow-ups",
  requireRole("ADMIN", "SALES"),
  validate({ params: idParamSchema, body: addFollowUpSchema }),
  async (req, res) => {
    const followUp = await customerService.addFollowUp(
      req.params.id,
      req.body.note,
      req.body.followUpDate,
      req.user!.id
    );
    res.status(201).json(followUp);
  }
);

export default router;
