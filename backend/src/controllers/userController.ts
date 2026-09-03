import { Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";
import { Role } from "@prisma/client";
import { createAuditLog } from "../services/audit.service";

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: Role.FACULTY,
        adminId: req.user?.id
      },
      include: {
        department: true
      }
    });

    // Map to frontend expectation, extracting department string
    const mappedUsers = users.map((u) => ({
      id: u.id,
      facultyId: u.facultyId,
      name: u.name,
      email: u.email,
      role: u.role.toLowerCase(),
      phone: u.phone,
      department: u.department?.name,
      dateOfJoin: u.dateOfJoin ? u.dateOfJoin.toISOString().split("T")[0] : null,
      status: u.status,
      lastLogin: u.lastLogin ? u.lastLogin.toISOString() : null,
      adminId: u.adminId
    }));

    res.status(200).json({ users: mappedUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, department, designation, dateOfJoin, facultyId, initialPassword, status } = req.body;

    if (!name || !email || !initialPassword) {
      return res.status(400).json({ message: "Name, email, and initial password are required" });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    // Find or create Department
    let dbDepartment = null;
    if (department) {
      if (department !== "CSD" && department !== "CSIT") {
        return res.status(400).json({ message: "Invalid department. Must be CSD or CSIT." });
      }
      dbDepartment = await prisma.department.findUnique({
        where: { name: department }
      });
      if (!dbDepartment) {
        dbDepartment = await prisma.department.create({
          data: { name: department }
        });
      }
    }

    const passwordHash = await bcrypt.hash(initialPassword, 12);

    const newUser = await prisma.user.create({
      data: {
        facultyId: facultyId || null,
        name,
        email,
        phone: phone || null,
        departmentId: dbDepartment?.id || null,
        dateOfJoin: dateOfJoin ? new Date(dateOfJoin) : null,
        status: status || "Active",
        passwordHash,
        role: Role.FACULTY,
        adminId: req.user?.id
      },
      include: {
        department: true
      }
    });

    const safeUser = {
      id: newUser.id,
      facultyId: newUser.facultyId,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role.toLowerCase(),
      phone: newUser.phone,
      department: newUser.department?.name,
      dateOfJoin: newUser.dateOfJoin ? newUser.dateOfJoin.toISOString().split("T")[0] : null,
      status: newUser.status,
      adminId: newUser.adminId
    };

    res.status(201).json({ user: safeUser });

    // Create Audit Log
    if (req.user) {
      await createAuditLog(req.user.id, "CREATE_USER", newUser.id, "System");
    }
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, department, dateOfJoin, status } = req.body;

    let dbDepartment = null;
    if (department) {
      if (department !== "CSD" && department !== "CSIT") {
        return res.status(400).json({ message: "Invalid department. Must be CSD or CSIT." });
      }
      dbDepartment = await prisma.department.findUnique({
        where: { name: department }
      });
      if (!dbDepartment) {
        dbDepartment = await prisma.department.create({
          data: { name: department }
        });
      }
    }

    const userToUpdate = await prisma.user.findUnique({ where: { id } });
    if (!userToUpdate) {
      return res.status(404).json({ message: "User not found" });
    }
    if (userToUpdate.adminId !== req.user?.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        departmentId: dbDepartment?.id,
        dateOfJoin: dateOfJoin ? new Date(dateOfJoin) : undefined,
        status
      },
      include: {
        department: true
      }
    });

    const safeUser = {
      id: updatedUser.id,
      facultyId: updatedUser.facultyId,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role.toLowerCase(),
      phone: updatedUser.phone,
      department: updatedUser.department?.name,
      dateOfJoin: updatedUser.dateOfJoin ? updatedUser.dateOfJoin.toISOString().split("T")[0] : null,
      status: updatedUser.status
    };

    res.status(200).json({ user: safeUser });

    // Create Audit Log
    if (req.user) {
      await createAuditLog(req.user.id, "UPDATE_USER", updatedUser.id, "System");
    }
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

import { uploadFile } from "../services/cloudinary.service";

export const updateUserAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const userToUpdate = await prisma.user.findUnique({ where: { id } });
    if (!userToUpdate) {
      return res.status(404).json({ message: "User not found" });
    }
    if (userToUpdate.adminId !== req.user?.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const uploadResult = await uploadFile(req.file.buffer, req.file.originalname);
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { avatar: uploadResult.secure_url },
      include: { department: true }
    });

    const safeUser = {
      id: updatedUser.id,
      facultyId: updatedUser.facultyId,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role.toLowerCase(),
      phone: updatedUser.phone,
      department: updatedUser.department?.name,
      avatar: updatedUser.avatar,
      dateOfJoin: updatedUser.dateOfJoin ? updatedUser.dateOfJoin.toISOString().split("T")[0] : null,
      status: updatedUser.status
    };

    res.status(200).json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Error updating user avatar:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }
    if (userToDelete.adminId !== req.user?.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await prisma.user.delete({ where: { id } });
    res.status(200).json({ message: "User deleted successfully" });

    // Create Audit Log
    if (req.user) {
      await createAuditLog(req.user.id, "DELETE_USER", id, "System");
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
