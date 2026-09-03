import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export const checkHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Perform a safe, lightweight query to verify Prisma/Neon connection
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Pass the error to the global error handler
    next(error);
  }
};
