import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { createAuditLog } from "../services/audit.service";

export const getDomains = async (req: AuthRequest, res: Response) => {
  try {
    const domains = await prisma.domain.findMany({
      orderBy: { createdAt: 'asc' }
    });
    res.status(200).json({ success: true, domains });
  } catch (error) {
    console.error("Get domains error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch domains" });
  }
};

export const createDomain = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, message: "Domain name is required" });
    }

    const sanitizedName = name.trim();
    if (!sanitizedName) {
      return res.status(400).json({ success: false, message: "Domain name cannot be empty" });
    }

    const existing = await prisma.domain.findUnique({
      where: { name: sanitizedName }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "Domain already exists." });
    }

    const newDomain = await prisma.domain.create({
      data: { name: sanitizedName }
    });

    if (req.user) {
      await createAuditLog(req.user.id, "CREATE_DOMAIN", sanitizedName);
    }

    res.status(201).json({ success: true, domain: newDomain });
  } catch (error) {
    console.error("Create domain error:", error);
    res.status(500).json({ success: false, message: "Failed to create domain" });
  }
};

export const updateDomain = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, message: "Domain name is required" });
    }

    const sanitizedName = name.trim();
    if (!sanitizedName) {
      return res.status(400).json({ success: false, message: "Domain name cannot be empty" });
    }

    const existing = await prisma.domain.findUnique({
      where: { name: sanitizedName }
    });

    if (existing && existing.id !== id) {
      return res.status(400).json({ success: false, message: "Domain already exists." });
    }

    const updatedDomain = await prisma.domain.update({
      where: { id },
      data: { name: sanitizedName }
    });

    if (req.user) {
      await createAuditLog(req.user.id, "UPDATE_DOMAIN", sanitizedName);
    }

    res.status(200).json({ success: true, domain: updatedDomain });
  } catch (error) {
    console.error("Update domain error:", error);
    res.status(500).json({ success: false, message: "Failed to update domain" });
  }
};

export const deleteDomain = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const domain = await prisma.domain.findUnique({ where: { id } });
    if (!domain) {
      return res.status(404).json({ success: false, message: "Domain not found" });
    }

    const docsCount = await prisma.document.count({ where: { domainId: id } });
    if (docsCount > 0) {
      return res.status(400).json({ success: false, message: "Cannot delete domain with associated documents" });
    }

    await prisma.domain.delete({ where: { id } });

    if (req.user) {
      await createAuditLog(req.user.id, "DELETE_DOMAIN", domain.name);
    }

    res.status(200).json({ success: true, message: "Domain deleted successfully" });
  } catch (error) {
    console.error("Delete domain error:", error);
    res.status(500).json({ success: false, message: "Failed to delete domain" });
  }
};
