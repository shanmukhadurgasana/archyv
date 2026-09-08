import app from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";
import cron from "node-cron";
import { runCleanupJobCore } from "./controllers/documentController";

const startServer = async () => {
  try {
    // Attempt to connect to the database securely
    await prisma.$connect();
    console.log("✅ Successfully connected to Neon Database via Prisma");

    app.listen(env.PORT, () => {
      console.log(`🚀 Server is running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    // Schedule the 90-day retention cleanup job to run every day at midnight
    cron.schedule("0 0 * * *", async () => {
      console.log("⏰ Running scheduled 90-day retention cleanup job...");
      await runCleanupJobCore();
    });
  } catch (error) {
    console.error("❌ Failed to connect to the database or start server:", error);
    process.exit(1);
  }
};

startServer();


