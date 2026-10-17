import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { createAuditLog } from "../services/audit.service";

export const getDomains = async (req: AuthRequest, res: Response) => {
  try {
    const domains = await prisma.domain.findMany({
      orderBy: { createdAt: 'asc' },
      include: { subdomains: true }
    });
    res.status(200).json({ success: true, domains });
  } catch (error) {
    console.error("Get domains error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch domains" });
  }
};

export const createDomain = async (req: AuthRequest, res: Response) => {
  try {
    const { name, isFaculty } = req.body;

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

    const facultyFlag = Boolean(isFaculty);

    const newDomain = await prisma.domain.create({
      data: {
        name: sanitizedName,
        isFaculty: facultyFlag
      }
    });

    if (req.user) {
      createAuditLog(req.user.id, "CREATE_DOMAIN", sanitizedName).catch(console.error);
    }

    return res.status(201).json({ success: true, domain: newDomain });
  } catch (error) {
    console.error("Create domain error:", error);
    res.status(500).json({ success: false, message: "Failed to create domain" });
  }
};

export const updateDomain = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, isFaculty } = req.body;

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

    const updateData: { name: string; isFaculty?: boolean } = { name: sanitizedName };
    if (typeof isFaculty === 'boolean') {
      updateData.isFaculty = isFaculty;
    }

    const updatedDomain = await prisma.domain.update({
      where: { id },
      data: updateData
    });

    if (req.user) {
      createAuditLog(req.user.id, "UPDATE_DOMAIN", sanitizedName).catch(console.error);
    }

    return res.status(200).json({ success: true, domain: updatedDomain });
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

    // Find all document IDs belonging to this domain
    const docs = await prisma.document.findMany({
      where: { domainId: id },
      select: { id: true }
    });
    const docIds = docs.map(d => d.id);

    if (docIds.length > 0) {
      await prisma.starredDocument.deleteMany({
        where: { documentId: { in: docIds } }
      });
      await prisma.documentFacultyAccess.deleteMany({
        where: { documentId: { in: docIds } }
      });
      await prisma.document.deleteMany({
        where: { id: { in: docIds } }
      });
    }

    // Unlink any documents referencing subdomains of this domain and delete subdomains
    const subdomains = await prisma.subdomain.findMany({
      where: { domainId: id },
      select: { id: true }
    });
    const subIds = subdomains.map(s => s.id);
    if (subIds.length > 0) {
      await prisma.document.updateMany({
        where: { subdomainId: { in: subIds } },
        data: { subdomainId: null }
      });
      await prisma.subdomain.deleteMany({
        where: { id: { in: subIds } }
      });
    }

    // Delete the domain
    await prisma.domain.delete({ where: { id } });

    if (req.user) {
      createAuditLog(req.user.id, "DELETE_DOMAIN", domain.name).catch(console.error);
    }

    return res.status(200).json({ success: true, message: "Domain deleted successfully" });
  } catch (error) {
    console.error("Delete domain error:", error);
    res.status(500).json({ success: false, message: "Failed to delete domain" });
  }
};

export const createSubdomain = async (req: AuthRequest, res: Response) => {
  try {
    const { domainId } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== 'string') return res.status(400).json({ success: false, message: "Subdomain name is required" });
    const sanitizedName = name.trim();
    if (!sanitizedName) return res.status(400).json({ success: false, message: "Subdomain name cannot be empty" });

    const newSubdomain = await prisma.subdomain.create({
      data: { name: sanitizedName, domainId }
    });
    res.status(201).json({ success: true, subdomain: newSubdomain });
  } catch (error) {
    console.error("Create subdomain error:", error);
    res.status(500).json({ success: false, message: "Failed to create subdomain" });
  }
};

export const updateSubdomain = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== 'string') return res.status(400).json({ success: false, message: "Subdomain name is required" });
    const sanitizedName = name.trim();
    if (!sanitizedName) return res.status(400).json({ success: false, message: "Subdomain name cannot be empty" });

    const updatedSubdomain = await prisma.subdomain.update({
      where: { id },
      data: { name: sanitizedName }
    });
    res.status(200).json({ success: true, subdomain: updatedSubdomain });
  } catch (error) {
    console.error("Update subdomain error:", error);
    res.status(500).json({ success: false, message: "Failed to update subdomain" });
  }
};

export const deleteSubdomain = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const subdomain = await prisma.subdomain.findUnique({ where: { id } });
    if (!subdomain) {
      return res.status(404).json({ success: false, message: "Subdomain not found" });
    }

    // Unlink any documents referencing this subdomain
    await prisma.document.updateMany({
      where: { subdomainId: id },
      data: { subdomainId: null }
    });

    await prisma.subdomain.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Subdomain deleted successfully" });
  } catch (error) {
    console.error("Delete subdomain error:", error);
    res.status(500).json({ success: false, message: "Failed to delete subdomain" });
  }
};
