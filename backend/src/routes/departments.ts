import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { Role } from "@prisma/client";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createSection,
  updateSection,
  deleteSection
} from "../controllers/departmentController";

const router = Router();

router.use(requireAuth);

router.get("/", getDepartments as any);
router.post("/", requireRole(Role.ADMIN, Role.FACULTY) as any, createDepartment as any);
router.patch("/:id", requireRole(Role.ADMIN, Role.FACULTY) as any, updateDepartment as any);
router.delete("/:id", requireRole(Role.ADMIN, Role.FACULTY) as any, deleteDepartment as any);

// Section routes nested under department
router.post("/:deptId/sections", requireRole(Role.ADMIN, Role.FACULTY) as any, createSection as any);
router.patch("/:deptId/sections/:sectionId", requireRole(Role.ADMIN, Role.FACULTY) as any, updateSection as any);
router.delete("/:deptId/sections/:sectionId", requireRole(Role.ADMIN, Role.FACULTY) as any, deleteSection as any);

// Alternative direct section routes
router.patch("/sections/:id", requireRole(Role.ADMIN, Role.FACULTY) as any, updateSection as any);
router.delete("/sections/:id", requireRole(Role.ADMIN, Role.FACULTY) as any, deleteSection as any);

export default router;
