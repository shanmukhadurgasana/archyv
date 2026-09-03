import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("🔥 Error:", err.message || err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // In production, do not leak internal stack traces or DB details
  res.status(statusCode).json({
    status: "error",
    statusCode,
    message: env.NODE_ENV === "production" && statusCode === 500 ? "Internal Server Error" : message,
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    status: "error",
    statusCode: 404,
    message: `Route Not Found - ${req.originalUrl}`,
  });
};
