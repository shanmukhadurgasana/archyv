import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { createAuditLog } from "../services/audit.service";

export const getDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        sections: {
          orderBy: { name: 'asc' }
        }
      },
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
      data: { name: sanitizedName },
      include: {
        sections: true
      }
    });

    if (req.user) {
      createAuditLog(req.user.id, "CREATE_DEPARTMENT", sanitizedName).catch(console.error);
    }

    return res.status(201).json({ success: true, department: newDepartment });
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
      data: { name: sanitizedName },
      include: {
        sections: {
          orderBy: { name: 'asc' }
        }
      }
    });

    if (req.user) {
      createAuditLog(req.user.id, "UPDATE_DEPARTMENT", sanitizedName).catch(console.error);
    }

    return res.status(200).json({ success: true, department: updatedDepartment });
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
      createAuditLog(req.user.id, "DELETE_DEPARTMENT", department.name).catch(console.error);
    }

    return res.status(200).json({ success: true, message: "Department deleted successfully" });
  } catch (error) {
    console.error("Delete department error:", error);
    res.status(500).json({ success: false, message: "Failed to delete department" });
  }
};

export const createSection = async (req: AuthRequest, res: Response) => {
  try {
    const { deptId, id } = req.params;
    const departmentId = deptId || id;
    const { name } = req.body;

    if (!departmentId) {
      return res.status(400).json({ success: false, message: "Branch ID is required" });
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: "Section name is required" });
    }

    const sanitizedName = name.trim();
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) {
      return res.status(404).json({ success: false, message: "Branch not found" });
    }

    const existing = await prisma.section.findUnique({
      where: {
        name_departmentId: {
          name: sanitizedName,
          departmentId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "Section already exists in this branch" });
    }

    const section = await prisma.section.create({
      data: {
        name: sanitizedName,
        departmentId
      }
    });

    if (req.user) {
      createAuditLog(req.user.id, "CREATE_SECTION", `${department.name} - ${sanitizedName}`).catch(console.error);
    }

    return res.status(201).json({ success: true, section });
  } catch (error) {
    console.error("Create section error:", error);
    res.status(500).json({ success: false, message: "Failed to create section" });
  }
};

export const updateSection = async (req: AuthRequest, res: Response) => {
  try {
    const { sectionId, id } = req.params;
    const targetId = sectionId || id;
    const { name } = req.body;

    if (!targetId) {
      return res.status(400).json({ success: false, message: "Section ID is required" });
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: "Section name is required" });
    }

    const sanitizedName = name.trim();
    const currentSection = await prisma.section.findUnique({ where: { id: targetId } });
    if (!currentSection) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    const existing = await prisma.section.findUnique({
      where: {
        name_departmentId: {
          name: sanitizedName,
          departmentId: currentSection.departmentId
        }
      }
    });

    if (existing && existing.id !== targetId) {
      return res.status(400).json({ success: false, message: "Section name already in use for this branch" });
    }

    const updatedSection = await prisma.section.update({
      where: { id: targetId },
      data: { name: sanitizedName }
    });

    if (req.user) {
      createAuditLog(req.user.id, "UPDATE_SECTION", sanitizedName).catch(console.error);
    }

    return res.status(200).json({ success: true, section: updatedSection });
  } catch (error) {
    console.error("Update section error:", error);
    res.status(500).json({ success: false, message: "Failed to update section" });
  }
};

export const deleteSection = async (req: AuthRequest, res: Response) => {
  try {
    const { sectionId, id } = req.params;
    const targetId = sectionId || id;

    if (!targetId) {
      return res.status(400).json({ success: false, message: "Section ID is required" });
    }

    const section = await prisma.section.findUnique({ where: { id: targetId } });
    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    await prisma.section.delete({ where: { id: targetId } });

    if (req.user) {
      createAuditLog(req.user.id, "DELETE_SECTION", section.name).catch(console.error);
    }

    return res.status(200).json({ success: true, message: "Section deleted successfully" });
  } catch (error) {
    console.error("Delete section error:", error);
    res.status(500).json({ success: false, message: "Failed to delete section" });
  }
};
