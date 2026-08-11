import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`[server] Mini ERP API listening on port ${env.port} (${env.nodeEnv})`);
});

// Graceful shutdown so in-flight DB queries finish and connections close cleanly.
async function shutdown(signal: string) {
  console.log(`[server] Received ${signal}, shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
