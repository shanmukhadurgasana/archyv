import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { Role } from "@prisma/client";
import { getDomains, createDomain, updateDomain, deleteDomain, createSubdomain, updateSubdomain, deleteSubdomain } from "../controllers/domainController";

const router = Router();

router.use(requireAuth);

router.get("/", getDomains as any);
router.post("/", requireRole(Role.ADMIN) as any, createDomain as any);
router.patch("/:id", requireRole(Role.ADMIN) as any, updateDomain as any);
router.delete("/:id", requireRole(Role.ADMIN) as any, deleteDomain as any);

router.post("/:domainId/subdomains", requireRole(Role.ADMIN) as any, createSubdomain as any);
router.patch("/:domainId/subdomains/:id", requireRole(Role.ADMIN) as any, updateSubdomain as any);
router.delete("/:domainId/subdomains/:id", requireRole(Role.ADMIN) as any, deleteSubdomain as any);

export default router;
