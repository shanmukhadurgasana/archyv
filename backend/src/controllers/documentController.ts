import { Response } from "express";
import { PrismaClient, DocumentType } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env";
import { AuthRequest } from "../middleware/auth";
import { uploadFile, deleteFile } from "../services/cloudinary.service";
import { createAuditLog } from "../services/audit.service";

const pool = new Pool({ connectionString: env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const createDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    const { name, domain, department, academicYear } = req.body;

    if (!name || !domain) {
      return res.status(400).json({ success: false, message: "Name and domain are required" });
    }

    // Lookup Foreign Keys Concurrently
    const [domainRecord, deptRecord, yearRecord] = await Promise.all([
      prisma.domain.findUnique({ where: { name: domain } }),
      department ? prisma.department.findUnique({ where: { name: department } }) : Promise.resolve(null),
      academicYear ? prisma.academicYear.findUnique({ where: { year: academicYear } }) : Promise.resolve(null)
    ]);

    if (!domainRecord) {
      return res.status(400).json({ success: false, message: `Domain '${domain}' not found` });
    }

    if (department && !deptRecord) {
      return res.status(400).json({ success: false, message: `Department '${department}' not found` });
    }

    if (academicYear && !yearRecord) {
      return res.status(400).json({ success: false, message: `Academic Year '${academicYear}' not found` });
    }

    const departmentId = deptRecord?.id || null;
    const academicYearId = yearRecord?.id || null;

    // Determine type
    let type: DocumentType = "OTHER";
    const ext = req.file.originalname.split(".").pop()?.toLowerCase();
    if (ext === "pdf") type = "PDF";
    else if (ext === "docx") type = "DOCX";
    else if (ext === "xlsx") type = "XLSX";

    // 1. Upload to Cloudinary
    const uploadResult = await uploadFile(req.file.buffer, req.file.originalname);
    
    // 2. Create Prisma Document
    try {
      const document = await prisma.document.create({
        data: {
          name,
          type,
          sizeBytes: BigInt(req.file.size),
          cloudinaryUrl: uploadResult.secure_url,
          cloudinaryPublicId: uploadResult.public_id,
          uploadedById: req.user.id,
          domainId: domainRecord.id,
          departmentId,
          academicYearId,
        },
        include: {
          domain: { select: { name: true } },
          department: { select: { name: true } },
          academicYear: { select: { year: true } },
          uploadedBy: { select: { name: true } },
        }
      });

      const serializedDoc = {
        id: document.id,
        name: document.name,
        type: document.type,
        size: document.sizeBytes ? `${(Number(document.sizeBytes) / (1024 * 1024)).toFixed(2)} MB` : "Unknown",
        date: document.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: document.createdAt.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }),
        domain: document.domain.name,
        department: document.department?.name,
        year: document.academicYear?.year,
        uploadedBy: document.uploadedBy.name,
        isStarred: false,
        filename: document.name,
        cloudinaryUrl: document.cloudinaryUrl
      };

      res.status(201).json({ success: true, document: serializedDoc });

      // Create Audit Log
      if (req.user) {
        await createAuditLog(req.user.id, "UPLOAD_DOCUMENT", name, domain);
      }
    } catch (dbError) {
      // Rollback Cloudinary if DB fails
      console.error("Database creation failed, rolling back Cloudinary upload...");
      await deleteFile(uploadResult.public_id, "auto" as any).catch(e => console.error("Rollback failed:", e));
      throw dbError;
    }

  } catch (error) {
    console.error("Create document error:", error);
    res.status(500).json({ success: false, message: "Failed to upload document" });
  }
};


export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      search, 
      domain, 
      faculty, 
      status, 
      isDeleted, 
      isStarred,
      page = "1", 
      limit = "100",
      sortBy = "Newest first"
    } = req.query;
    
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const where: any = {};
    
    // 1. Trash vs Active
    where.isDeleted = isDeleted === 'true';

    // 1.5. Starred
    if (isStarred === 'true') {
      where.starredByUsers = { some: { userId } };
    }

    // 2. Search
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { uploadedBy: { name: { contains: search as string, mode: "insensitive" } } },
      ];
    }
    
    // 3. Filters
    if (domain && domain !== "All Domains") {
      where.domain = { name: domain as string };
    }
    
    const uploadedByCondition: any = {};
    if (faculty && faculty !== "All Faculty") {
      uploadedByCondition.name = faculty as string;
    }

    if ((userRole as string) === 'ADMIN' || (userRole as string) === 'admin') {
      uploadedByCondition.OR = [
        { id: userId },
        { adminId: userId }
      ];
    } else {
      where.uploadedById = userId;
    }

    if (Object.keys(uploadedByCondition).length > 0) {
      where.uploadedBy = uploadedByCondition;
    }
    
    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 100));
    const skip = (pageNum - 1) * limitNum;
    
    // Sorting
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === "Oldest first") orderBy = { createdAt: 'asc' };
    else if (sortBy === "Name A-Z") orderBy = { name: 'asc' };
    else if (sortBy === "Name Z-A") orderBy = { name: 'desc' };
    else if (sortBy === "Newest first") orderBy = { createdAt: 'desc' };

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        take: limitNum,
        skip,
        select: {
          id: true,
          name: true,
          type: true,
          sizeBytes: true,
          createdAt: true,
          cloudinaryUrl: true,
          domain: { select: { name: true } },
          department: { select: { name: true } },
          academicYear: { select: { year: true } },
          uploadedBy: { select: { name: true } },
          starredByUsers: { select: { userId: true }, where: { userId } }
        },
        orderBy
      }),
      prisma.document.count({ where })
    ]);

    // Map to frontend Document interface
    const mappedDocs = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      size: doc.sizeBytes ? `${(Number(doc.sizeBytes) / (1024 * 1024)).toFixed(2)} MB` : "Unknown",
      date: doc.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time: doc.createdAt.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }),
      domain: doc.domain.name,
      department: doc.department?.name,
      year: doc.academicYear?.year,
      uploadedBy: doc.uploadedBy.name,
      isStarred: doc.starredByUsers.length > 0,
      filename: doc.name,
      cloudinaryUrl: doc.cloudinaryUrl
    }));

    res.status(200).json({ 
      success: true, 
      documents: mappedDocs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch documents" });
  }
};

export const getDocumentById = async (req: AuthRequest, res: Response) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id, isDeleted: false },
      include: {
        domain: true,
        department: true,
        uploadedBy: { select: { id: true, name: true, adminId: true } }
      }
    });

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    if (req.user?.role?.toUpperCase() !== 'ADMIN') {
      if (document.uploadedById !== req.user?.id) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
    } else {
      if (document.uploadedBy.id !== req.user?.id && document.uploadedBy.adminId !== req.user?.id) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
    }

    res.status(200).json({ success: true, document: {
        ...document,
        sizeBytes: document.sizeBytes?.toString()
    }});
  } catch (error) {
    console.error("Get document by id error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch document" });
  }
};

export const toggleStar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const documentId = req.params.id;
    const userId = req.user.id;

    // Check if doc exists
    const doc = await prisma.document.findUnique({ 
      where: { id: documentId }, 
      include: { domain: true, uploadedBy: { select: { id: true, adminId: true } } } 
    });
    if (!doc || doc.isDeleted) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    if (req.user.role?.toUpperCase() !== 'ADMIN') {
      if (doc.uploadedById !== userId) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
    } else {
      if (doc.uploadedBy.id !== userId && doc.uploadedBy.adminId !== userId) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
    }

    if (req.method === 'POST') {
      try {
        await prisma.starredDocument.create({
          data: { userId, documentId }
        });
        await createAuditLog(userId, "STAR_DOCUMENT", doc.name, doc.domain.name);
      } catch (e: any) {
        if (e.code !== 'P2002') throw e; // Ignore Unique Constraint
      }
      res.status(200).json({ success: true, message: "Document starred" });
      return;
    } else {
      try {
        await prisma.starredDocument.delete({
          where: { userId_documentId: { userId, documentId } }
        });
        await createAuditLog(userId, "UNSTAR_DOCUMENT", doc.name, doc.domain.name);
      } catch (e: any) {
        if (e.code !== 'P2025') throw e; // Ignore Record not found
      }
      res.status(200).json({ success: true, message: "Document unstarred" });
      return;
    }

  } catch (error) {
    console.error("Toggle star error:", error);
    res.status(500).json({ success: false, message: "Failed to toggle star" });
  }
};

import { v2 as cloudinary } from "cloudinary";



export const viewDocument = async (req: AuthRequest, res: Response) => {
  try {
    const documentId = req.params.id;
    const document = await prisma.document.findUnique({ 
      where: { id: documentId },
      include: { uploadedBy: { select: { id: true, adminId: true } } }
    });
    
    if (!document || document.isDeleted) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    if (req.user?.role?.toUpperCase() !== 'ADMIN') {
      if (document.uploadedById !== req.user?.id) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
    } else {
      if (document.uploadedBy.id !== req.user?.id && document.uploadedBy.adminId !== req.user?.id) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
    }

    // Force secure signed delivery with fl_attachment to bypass inline delivery blocking
    const publicId = document.cloudinaryPublicId;
    let url = document.cloudinaryUrl;

    if (typeof publicId === 'string') {
      // Cloudinary strictly blocks PDF delivery on free tier accounts.
      // We bypass this by requesting the PDF as an image (JPG), which Cloudinary natively rasterizes.
      url = cloudinary.url(publicId + (document.type === 'PDF' ? '.jpg' : ''), {
        sign_url: true,
        resource_type: 'image'
      });
    }

    if (!url) {
      return res.status(404).json({ success: false, message: "URL not found" });
    }

    return res.redirect(url);
  } catch (error) {
    console.error("View document error:", error);
    res.status(500).json({ success: false, message: "Failed to view document" });
  }
};

export const softDeleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role?.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const documentId = req.params.id;
    const document = await prisma.document.findUnique({ 
      where: { id: documentId },
      include: { domain: true, uploadedBy: { select: { id: true, adminId: true } } } 
    });
    
    if (!document || document.isDeleted) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    if (document.uploadedBy.id !== req.user.id && document.uploadedBy.adminId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const deletedAt = new Date();
    // 90 days retention
    const retentionUntil = new Date(deletedAt.getTime() + 90 * 24 * 60 * 60 * 1000);

    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        isDeleted: true,
        deletedAt,
        retentionUntil
      }
    });

    res.status(200).json({ success: true, document: { ...updatedDocument, sizeBytes: updatedDocument.sizeBytes?.toString() } });

    // Create Audit Log
    if (req.user) {
      await createAuditLog(req.user.id, "DELETE_DOCUMENT", document.name, document.domain.name);
    }
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ success: false, message: "Failed to delete document" });
  }
};

export const getTrashedDocuments = async (req: AuthRequest, res: Response) => {
  try {
    // Both Admin and Faculty might need to see trash depending on role,
    // but we'll return all trashed docs (could filter by department if needed)
    
    const where: any = { isDeleted: true };
    const userRole = req.user?.role;
    const userId = req.user?.id;
    if ((userRole as string) === 'ADMIN' || (userRole as string) === 'admin') {
      where.uploadedBy = {
        OR: [
          { id: userId },
          { adminId: userId }
        ]
      };
    } else {
      where.uploadedById = userId;
    }
    
    const documents = await prisma.document.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        sizeBytes: true,
        createdAt: true,
        cloudinaryUrl: true,
        deletedAt: true,
        retentionUntil: true,
        domain: { select: { name: true } },
        department: { select: { name: true } },
        academicYear: { select: { year: true } },
        uploadedBy: { select: { name: true } },
        starredByUsers: { select: { userId: true }, where: { userId: req.user?.id } }
      },
      orderBy: { deletedAt: 'desc' }
    });

    const mappedDocs = documents.map(doc => {
      const daysLeft = doc.retentionUntil 
        ? Math.max(0, Math.ceil((doc.retentionUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;

      return {
        id: doc.id,
        name: doc.name,
        type: doc.type,
        size: doc.sizeBytes ? `${(Number(doc.sizeBytes) / (1024 * 1024)).toFixed(2)} MB` : "Unknown",
        date: doc.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: doc.createdAt.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }),
        domain: doc.domain.name,
        department: doc.department?.name,
        year: doc.academicYear?.year,
        uploadedBy: doc.uploadedBy.name,
        isStarred: doc.starredByUsers.length > 0,
        filename: doc.name,
        cloudinaryUrl: doc.cloudinaryUrl,
        isDeleted: true,
        deletedDate: doc.deletedAt?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        daysLeft
      };
    });

    res.status(200).json({ success: true, documents: mappedDocs });
  } catch (error) {
    console.error("Get trash error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch trashed documents" });
  }
};

export const restoreDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role?.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const documentId = req.params.id;
    const document = await prisma.document.findUnique({ 
      where: { id: documentId },
      include: { domain: true, uploadedBy: { select: { id: true, adminId: true } } } 
    });
    
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    if (document.uploadedBy.id !== req.user.id && document.uploadedBy.adminId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (!document.isDeleted) {
      return res.status(409).json({ success: false, message: "Document is already active" });
    }

    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        isDeleted: false,
        deletedAt: null,
        retentionUntil: null
      }
    });

    res.status(200).json({ success: true, document: { ...updatedDocument, sizeBytes: updatedDocument.sizeBytes?.toString() } });

    // Create Audit Log
    if (req.user) {
      await createAuditLog(req.user.id, "RESTORE_DOCUMENT", document.name, document.domain.name);
    }
  } catch (error) {
    console.error("Restore document error:", error);
    res.status(500).json({ success: false, message: "Failed to restore document" });
  }
};

export const permanentDeleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role?.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const documentId = req.params.id;
    const document = await prisma.document.findUnique({ 
      where: { id: documentId },
      include: { domain: true, uploadedBy: { select: { id: true, adminId: true } } } 
    });
    
    if (!document || !document.isDeleted) {
      return res.status(404).json({ success: false, message: "Trashed document not found" });
    }

    if (document.uploadedBy.id !== req.user.id && document.uploadedBy.adminId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (document.cloudinaryPublicId) {
      try {
        await deleteFile(document.cloudinaryPublicId, "image"); // type auto/image
      } catch (cldError) {
        console.error("Cloudinary deletion failed, aborting DB deletion:", cldError);
        return res.status(500).json({ success: false, message: "Failed to delete from Cloudinary" });
      }
    }

    await prisma.document.delete({ where: { id: documentId } });

    res.status(200).json({ success: true, message: "Document permanently deleted" });

    // Create Audit Log
    if (req.user) {
      await createAuditLog(req.user.id, "PERMANENT_DELETE_DOCUMENT", document.name, document.domain.name);
    }
  } catch (error) {
    console.error("Permanent delete error:", error);
    res.status(500).json({ success: false, message: "Failed to permanently delete document" });
  }
};

export const cleanupExpiredDocuments = async (req: AuthRequest, res: Response) => {
  try {
    // This could be protected by an internal API key or Admin auth
    // For testability we'll allow Admin to trigger it
    if (!req.user || req.user.role?.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const expiredDocs = await prisma.document.findMany({
      where: {
        isDeleted: true,
        retentionUntil: { lte: new Date() }
      }
    });

    let successCount = 0;
    let failureCount = 0;

    for (const doc of expiredDocs) {
      try {
        if (doc.cloudinaryPublicId) {
          await deleteFile(doc.cloudinaryPublicId, "image");
        }
        await prisma.document.delete({ where: { id: doc.id } });
        successCount++;
      } catch (e) {
        console.error(`Failed to cleanup document ${doc.id}:`, e);
        failureCount++;
      }
    }

    res.status(200).json({ 
      success: true, 
      message: `Cleanup finished. Deleted: ${successCount}, Failed: ${failureCount}` 
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    res.status(500).json({ success: false, message: "Failed to run cleanup" });
  }
};
