import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { Role } from "@prisma/client";
import { getDomains, createDomain, updateDomain, deleteDomain } from "../controllers/domainController";

const router = Router();

router.use(requireAuth);

router.get("/", getDomains as any);
router.post("/", requireRole(Role.ADMIN) as any, createDomain as any);
router.patch("/:id", requireRole(Role.ADMIN) as any, updateDomain as any);
router.delete("/:id", requireRole(Role.ADMIN) as any, deleteDomain as any);

export default router;
