import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

// Keep this as the LAST middleware registered in server.ts.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        error: `Duplicate value for unique field: ${(err.meta?.target as string[])?.join(", ")}`,
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Record not found" });
    }
  }

  console.error("[Unhandled Error]", err);

  return res.status(500).json({
    error: "Internal server error",
    ...(env.nodeEnv === "development" && err instanceof Error ? { stack: err.stack } : {}),
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}
