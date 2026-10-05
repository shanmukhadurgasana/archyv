import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { createAuditLog } from "../services/audit.service";

export const getDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ success: true, departments });
  } catch (error) {
    console.error("Get departments error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch departments" });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, message: "Department name is required" });
    }

    const sanitizedName = name.trim();
    if (!sanitizedName) {
      return res.status(400).json({ success: false, message: "Department name cannot be empty" });
    }

    const existing = await prisma.department.findUnique({
      where: { name: sanitizedName }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "Department already exists." });
    }

    const newDepartment = await prisma.department.create({
      data: { name: sanitizedName }
    });

    if (req.user) {
      await createAuditLog(req.user.id, "CREATE_DEPARTMENT", sanitizedName);
    }

    res.status(201).json({ success: true, department: newDepartment });
  } catch (error) {
    console.error("Create department error:", error);
    res.status(500).json({ success: false, message: "Failed to create department" });
  }
};

export const updateDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, message: "Department name is required" });
    }

    const sanitizedName = name.trim();
    if (!sanitizedName) {
      return res.status(400).json({ success: false, message: "Department name cannot be empty" });
    }

    const existing = await prisma.department.findUnique({
      where: { name: sanitizedName }
    });

    if (existing && existing.id !== id) {
      return res.status(400).json({ success: false, message: "Department already exists." });
    }

    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: { name: sanitizedName }
    });

    if (req.user) {
      await createAuditLog(req.user.id, "UPDATE_DEPARTMENT", sanitizedName);
    }

    res.status(200).json({ success: true, department: updatedDepartment });
  } catch (error) {
    console.error("Update department error:", error);
    res.status(500).json({ success: false, message: "Failed to update department" });
  }
};

export const deleteDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    const docsCount = await prisma.document.count({ where: { departmentId: id } });
    const usersCount = await prisma.user.count({ where: { departmentId: id } });
    if (docsCount > 0 || usersCount > 0) {
      return res.status(400).json({ success: false, message: "Cannot delete department with associated documents or users" });
    }

    await prisma.department.delete({ where: { id } });

    if (req.user) {
      await createAuditLog(req.user.id, "DELETE_DEPARTMENT", department.name);
    }

    res.status(200).json({ success: true, message: "Department deleted successfully" });
  } catch (error) {
    console.error("Delete department error:", error);
    res.status(500).json({ success: false, message: "Failed to delete department" });
  }
};
