import { Router } from "express";
import { validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import { loginSchema } from "./auth.schema";
import * as authService from "./auth.service";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";

const router = Router();

// POST /api/auth/login
router.post("/login", validate({ body: loginSchema }), async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

// GET /api/auth/me - returns the currently authenticated user (used by the
// frontend on page load to restore the session from a stored token).
router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw ApiError.notFound("User no longer exists");
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

export default router;
