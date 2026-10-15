import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { Role } from "@prisma/client";
import { getAcademicYears, createAcademicYear, updateAcademicYear, deleteAcademicYear } from "../controllers/academicYearController";

const router = Router();

router.use(requireAuth);

router.get("/", getAcademicYears as any);
router.post("/", requireRole(Role.ADMIN, Role.FACULTY) as any, createAcademicYear as any);
router.patch("/:id", requireRole(Role.ADMIN, Role.FACULTY) as any, updateAcademicYear as any);
router.delete("/:id", requireRole(Role.ADMIN, Role.FACULTY) as any, deleteAcademicYear as any);

export default router;
