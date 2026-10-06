import { Router } from "express";
import { checkHealth } from "../controllers/healthController";

const router = Router();

import authRoutes from "./auth";
import userRoutes from "./user";
import storageRoutes from "./storage";
import documentRoutes from "./documents";
import oauthRoutes from "./oauth";
import { getUserAvatar } from "../controllers/avatarController";
import { requireAuth } from "../middleware/auth";

// Health Check
router.get("/health", checkHealth);

import auditRoutes from "./audit";

import domainRoutes from "./domains";
import academicYearRoutes from "./academicYears";

// Future API Mounts (Phase 3+)
router.use("/oauth", oauthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.get("/users/:id/avatar", requireAuth as any, getUserAvatar as any);
router.use("/storage", storageRoutes);
router.use("/documents", documentRoutes);
router.use("/audit-logs", auditRoutes);
import dashboardRoutes from "./dashboard";
import departmentRoutes from "./departments";
router.use("/dashboard", dashboardRoutes);
router.use("/departments", departmentRoutes);
router.use("/domains", domainRoutes);
router.use("/academic-years", academicYearRoutes);

export default router;
