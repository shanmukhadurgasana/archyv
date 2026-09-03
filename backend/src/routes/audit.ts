import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { getAuditLogs } from "../controllers/auditController";
import { Role } from "@prisma/client";

const router = Router();

// Protect all audit routes to ensure only ADMIN can access
router.use(requireAuth);
router.use(requireRole(Role.ADMIN));

router.get("/", getAuditLogs as any);

export default router;
