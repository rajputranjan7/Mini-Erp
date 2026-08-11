import { PrismaClient } from "@prisma/client";
import { env } from "./env";

// Reuse a single PrismaClient instance across the app (and across hot reloads
// in dev) instead of opening a new connection pool per import.
export const prisma = new PrismaClient({
  log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"],
});
