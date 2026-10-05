import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { createAuditLog } from "../services/audit.service";

export const getAcademicYears = async (req: AuthRequest, res: Response) => {
  try {
    const academicYears = await prisma.academicYear.findMany({
      orderBy: { year: 'asc' }
    });
    res.status(200).json({ success: true, academicYears });
  } catch (error) {
    console.error("Get academic years error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch academic years" });
  }
};

export const createAcademicYear = async (req: AuthRequest, res: Response) => {
  try {
    const { year } = req.body;
    
    if (!year || typeof year !== 'string') {
      return res.status(400).json({ success: false, message: "Academic year is required" });
    }

    const sanitizedYear = year.trim();
    if (!sanitizedYear) {
      return res.status(400).json({ success: false, message: "Academic year cannot be empty" });
    }

    const existing = await prisma.academicYear.findUnique({
      where: { year: sanitizedYear }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "Academic year already exists." });
    }

    const newYear = await prisma.academicYear.create({
      data: { year: sanitizedYear }
    });

    if (req.user) {
      await createAuditLog(req.user.id, "CREATE_ACADEMIC_YEAR", sanitizedYear);
    }

    res.status(201).json({ success: true, academicYear: newYear });
  } catch (error) {
    console.error("Create academic year error:", error);
    res.status(500).json({ success: false, message: "Failed to create academic year" });
  }
};

export const updateAcademicYear = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { year } = req.body;
    
    if (!year || typeof year !== 'string') {
      return res.status(400).json({ success: false, message: "Academic year is required" });
    }

    const sanitizedYear = year.trim();
    if (!sanitizedYear) {
      return res.status(400).json({ success: false, message: "Academic year cannot be empty" });
    }

    const existing = await prisma.academicYear.findUnique({
      where: { year: sanitizedYear }
    });

    if (existing && existing.id !== id) {
      return res.status(400).json({ success: false, message: "Academic year already exists." });
    }

    const updatedYear = await prisma.academicYear.update({
      where: { id },
      data: { year: sanitizedYear }
    });

    if (req.user) {
      await createAuditLog(req.user.id, "UPDATE_ACADEMIC_YEAR", sanitizedYear);
    }

    res.status(200).json({ success: true, academicYear: updatedYear });
  } catch (error) {
    console.error("Update academic year error:", error);
    res.status(500).json({ success: false, message: "Failed to update academic year" });
  }
};

export const deleteAcademicYear = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const academicYear = await prisma.academicYear.findUnique({ where: { id } });
    if (!academicYear) {
      return res.status(404).json({ success: false, message: "Academic year not found" });
    }

    const docsCount = await prisma.document.count({ where: { academicYearId: id } });
    if (docsCount > 0) {
      return res.status(400).json({ success: false, message: "Cannot delete academic year with associated documents" });
    }

    await prisma.academicYear.delete({ where: { id } });

    if (req.user) {
      await createAuditLog(req.user.id, "DELETE_ACADEMIC_YEAR", academicYear.year);
    }

    res.status(200).json({ success: true, message: "Academic year deleted successfully" });
  } catch (error) {
    console.error("Delete academic year error:", error);
    res.status(500).json({ success: false, message: "Failed to delete academic year" });
  }
};
