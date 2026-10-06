import { Router } from "express";
import { getAuthUrl, handleCallback } from "../controllers/oauthController";
import { requireAuth, requireRole } from "../middleware/auth";
import { Role } from "@prisma/client";

const router = Router();

// Only admin should generate auth URL
router.get("/google/auth-url", requireAuth as any, requireRole(Role.ADMIN) as any, getAuthUrl as any);

// The callback is accessed by Google redirect, so no auth middleware
router.get("/google/callback", handleCallback as any);

export default router;
