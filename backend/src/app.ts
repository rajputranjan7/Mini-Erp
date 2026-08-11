import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

import authRoutes from "./modules/auth/auth.routes";
import customerRoutes from "./modules/customers/customer.routes";
import productRoutes from "./modules/products/product.routes";
import challanRoutes from "./modules/challans/challan.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", env: env.nodeEnv, timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/customers", customerRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/challans", challanRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
