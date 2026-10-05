import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { Role } from "@prisma/client";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from "../controllers/departmentController";

const router = Router();

router.use(requireAuth);

router.get("/", getDepartments as any);
router.post("/", requireRole(Role.ADMIN) as any, createDepartment as any);
router.patch("/:id", requireRole(Role.ADMIN) as any, updateDepartment as any);
router.delete("/:id", requireRole(Role.ADMIN) as any, deleteDepartment as any);

export default router;
