import app from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

const startServer = async () => {
  try {
    // Attempt to connect to the database securely
    await prisma.$connect();
    console.log("✅ Successfully connected to Neon Database via Prisma");

    app.listen(env.PORT, () => {
      console.log(`🚀 Server is running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to the database or start server:", error);
    process.exit(1);
  }
};

startServer();


