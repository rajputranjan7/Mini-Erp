import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

// Verifies the Bearer token and attaches the decoded user to req.user.
// Every route below /api (except /auth/login) goes through this.
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Missing or malformed Authorization header");
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch (err) {
    throw ApiError.unauthorized("Invalid or expired token");
  }
}

// Usage: router.post('/', requireAuth, requireRole('ADMIN', 'SALES'), handler)
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden(`This action requires one of the following roles: ${roles.join(", ")}`);
    }
    next();
  };
}
