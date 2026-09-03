import { Router } from "express";
import { checkHealth } from "../controllers/healthController";

const router = Router();

import authRoutes from "./auth";
import userRoutes from "./user";
import storageRoutes from "./storage";
import documentRoutes from "./documents";

// Health Check
router.get("/health", checkHealth);

import auditRoutes from "./audit";

// Future API Mounts (Phase 3+)
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/storage", storageRoutes);
router.use("/documents", documentRoutes);
router.use("/audit-logs", auditRoutes);
import dashboardRoutes from "./dashboard";
router.use("/dashboard", dashboardRoutes);
// router.use("/departments", departmentRoutes);
// router.use("/domains", domainRoutes);
// router.use("/academic-years", academicYearRoutes);

export default router;
