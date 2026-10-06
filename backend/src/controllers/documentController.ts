import { Response } from "express";
import { DocumentType, DocumentAccess } from "@prisma/client";
import { env } from "../config/env";
import { AuthRequest } from "../middleware/auth";
import { uploadFileToDrive, deleteFileFromDrive, getFileStreamFromDrive } from "../services/googleDrive.service";
import { createAuditLog } from "../services/audit.service";
import { prisma } from "../lib/prisma";

export const createDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    const { name: originalTitle, domain, subdomain, department, academicYear, accessType, selectedFacultyIds, branch, semester, section } = req.body;

    if (!domain || !academicYear || !branch || !semester || !section) {
      return res.status(400).json({ success: false, message: "Missing required fields for document naming" });
    }

    const originalExt = req.file.originalname.split(".").pop() || "";
    const parts = [domain, subdomain, academicYear, branch, semester, section].filter(Boolean);
    const canonicalName = `${parts.join(".")}${originalExt ? "." + originalExt : ""}`;
    const sanitizedFileName = canonicalName.replace(/[/\\]/g, "");


    // Lookup Foreign Keys Concurrently
    const [domainRecord, deptRecord, yearRecord, subdomainRecord] = await Promise.all([
      prisma.domain.findUnique({ where: { name: domain } }),
      department ? prisma.department.findUnique({ where: { name: department } }) : Promise.resolve(null),
      academicYear ? prisma.academicYear.findUnique({ where: { year: academicYear } }) : Promise.resolve(null),
      subdomain ? prisma.subdomain.findFirst({ where: { name: subdomain, domain: { name: domain } } }) : Promise.resolve(null)
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

    // 1. Upload to Google Drive
    const uploadResult = await uploadFileToDrive(req.file.buffer, sanitizedFileName, req.file.mimetype);
    
    let parsedAccessType: DocumentAccess = "NONE";
    if (accessType === "ALL_FACULTY") parsedAccessType = "ALL_FACULTY";
    else if (accessType === "SELECT_FACULTY") parsedAccessType = "SELECT_FACULTY";

    let facultyAccessData: { facultyId: string }[] = [];
    if (parsedAccessType === "SELECT_FACULTY" && selectedFacultyIds) {
      try {
        const ids: string[] = JSON.parse(selectedFacultyIds);
        if (Array.isArray(ids) && ids.length > 0) {
          const validFaculties = await prisma.user.findMany({
            where: { id: { in: ids }, role: 'FACULTY' }
          });
          if (validFaculties.length !== ids.length) {
            return res.status(403).json({ success: false, message: "Unauthorized faculty selection" });
          }
          facultyAccessData = ids.map(id => ({ facultyId: id }));
        } else {
          return res.status(400).json({ success: false, message: "No faculty selected" });
        }
      } catch (e) {
        return res.status(400).json({ success: false, message: "Invalid selectedFacultyIds format" });
      }
    }

    // 2. Create Prisma Document
    try {
      const document = await prisma.document.create({
        data: {
          name: sanitizedFileName,
          type,
          sizeBytes: BigInt(req.file.size),
          googleDriveFileId: uploadResult.fileId,
          mimeType: uploadResult.mimeType,
          uploadedById: req.user.id,
          domainId: domainRecord.id,
          subdomainId: subdomainRecord?.id || null,
          departmentId,
          academicYearId,
          branch,
          semester,
          section,
          status: req.user.role?.toUpperCase() === 'ADMIN' ? 'APPROVED' : 'PENDING',
          accessType: parsedAccessType,
          facultyAccess: facultyAccessData.length > 0 ? {
            create: facultyAccessData
          } : undefined
        },
        include: {
          domain: { select: { name: true } },
          department: { select: { name: true } },
          academicYear: { select: { year: true } },
          uploadedBy: { select: { name: true } },
          facultyAccess: { select: { facultyId: true } }
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
        // cloudinaryUrl is no longer returned; removing it or leaving it omitted is fine.
        accessType: document.accessType,
        facultyAccess: document.facultyAccess
      };

      res.status(201).json({ success: true, document: serializedDoc });

      // Create Audit Log
      if (req.user) {
        await createAuditLog(req.user.id, "UPLOAD_DOCUMENT", sanitizedFileName, domain);
      }
    } catch (dbError) {
      // Rollback Google Drive if DB fails
      console.error("Database creation failed, rolling back Google Drive upload...");
      if (uploadResult.fileId) {
        await deleteFileFromDrive(uploadResult.fileId).catch(e => console.error("Rollback failed:", e));
      }
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

    // 1.2 Status
    let queryStatus = status as string;
    if (!queryStatus && isDeleted !== 'true') {
      queryStatus = 'APPROVED';
    }
    if (queryStatus) {
      if (queryStatus.includes(',')) {
        where.status = { in: queryStatus.split(',') };
      } else {
        where.status = queryStatus;
      }
    }

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
    
    if ((userRole as string) === 'ADMIN' || (userRole as string) === 'admin') {
      if (faculty && faculty !== "All Faculty") {
        where.uploadedBy = { name: faculty as string };
      }
    } else {
      const facultyAuthConditions: any[] = [
        { uploadedById: userId },
        { accessType: 'ALL_FACULTY' },
        { facultyAccess: { some: { facultyId: userId } } }
      ];

      where.AND = [
        { OR: facultyAuthConditions }
      ];

      if (faculty && faculty !== "All Faculty") {
        where.AND.push({ uploadedBy: { name: faculty as string } });
      }
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
          status: true,
          domain: { select: { name: true } },
          department: { select: { name: true } },
          academicYear: { select: { year: true } },
          uploadedBy: { select: { name: true } },
          uploadedById: true,
          starredByUsers: { select: { userId: true }, where: { userId } },
          accessType: true,
          facultyAccess: { select: { facultyId: true } }
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
      uploadedById: doc.uploadedById,
      isStarred: doc.starredByUsers.length > 0,
      status: doc.status,
      filename: doc.name,
      accessType: doc.accessType,
      facultyAccess: doc.facultyAccess
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
        uploadedBy: { select: { id: true, name: true, adminId: true, role: true } },
        facultyAccess: { where: { facultyId: req.user?.id } }
      }
    });

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    if (req.user?.role?.toUpperCase() !== 'ADMIN') {
      const isOwner = document.uploadedById === req.user?.id;
      const hasAccess = (
        document.accessType === 'ALL_FACULTY' || 
        (document.accessType === 'SELECT_FACULTY' && document.facultyAccess.length > 0)
      );

      if (!isOwner && !hasAccess) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
    }
    // Admins have global access, so no else block needed

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
      include: { 
        domain: true, 
        uploadedBy: { select: { id: true, adminId: true, role: true } },
        facultyAccess: { where: { facultyId: userId } }
      } 
    });
    if (!doc || doc.isDeleted) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    if (req.user.role?.toUpperCase() !== 'ADMIN') {
      const isOwner = doc.uploadedById === userId;
      const hasAccess = (
        doc.accessType === 'ALL_FACULTY' || 
        (doc.accessType === 'SELECT_FACULTY' && doc.facultyAccess.length > 0)
      );

      if (!isOwner && !hasAccess) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
    }
    // Admins have global access, so no else block needed

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

export const viewDocument = async (req: AuthRequest, res: Response) => {
  try {
    const documentId = req.params.id;
    const document = await prisma.document.findUnique({ 
      where: { id: documentId },
      include: { 
        uploadedBy: { select: { id: true, adminId: true, role: true } },
        facultyAccess: { where: { facultyId: req.user?.id } }
      }
    });
    
    if (!document || document.isDeleted) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    if (req.user?.role?.toUpperCase() !== 'ADMIN') {
      const isOwner = document.uploadedById === req.user?.id;
      const hasAccess = (
        document.accessType === 'ALL_FACULTY' || 
        (document.accessType === 'SELECT_FACULTY' && document.facultyAccess.length > 0)
      );

      if (!isOwner && !hasAccess) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
    }
    // Admins have global access, so no else block needed

    const fileId = document.googleDriveFileId;

    if (!fileId) {
      return res.status(404).json({ success: false, message: "File ID not found" });
    }

    const stream = await getFileStreamFromDrive(fileId);
    
    // Set appropriate headers based on document type
    const mimeType = document.mimeType || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    
    // For PDFs and images we want inline viewing, otherwise attachment
    if (document.type === 'PDF' || mimeType.startsWith('image/')) {
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.name)}"`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.name)}"`);
    }
    
    // Pipe the stream to the response
    stream.pipe(res);
    
    stream.on('error', (err: any) => {
      console.error("Error piping Google Drive stream:", err);
      if (!res.headersSent) {
        res.status(500).send('Error retrieving document');
      }
    });
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

    let isAuthorized = true;
    if (req.user.role !== 'ADMIN') {
      if (document.uploadedBy.id !== req.user.id && document.uploadedBy.adminId !== req.user.id) {
        isAuthorized = false;
      }
    }
    
    if (!isAuthorized) {
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
    if ((userRole as string) !== 'ADMIN' && (userRole as string) !== 'admin') {
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

    let isAuthorized = true;
    if (req.user.role !== 'ADMIN') {
      if (document.uploadedBy.id !== req.user.id && document.uploadedBy.adminId !== req.user.id) {
        isAuthorized = false;
      }
    }

    if (!isAuthorized) {
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

    let isAuthorized = true;
    if (req.user.role !== 'ADMIN') {
      if (document.uploadedBy.id !== req.user.id && document.uploadedBy.adminId !== req.user.id) {
        isAuthorized = false;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (document.googleDriveFileId) {
      try {
        const { success } = await deleteFileFromDrive(document.googleDriveFileId);
        if (!success) {
          console.error("Google Drive deletion returned false, aborting DB deletion for:", document.id);
          return res.status(500).json({ success: false, message: "Failed to delete from Google Drive" });
        }
      } catch (cldError) {
        console.error("Google Drive deletion failed with error, aborting DB deletion:", cldError);
        return res.status(500).json({ success: false, message: "Failed to delete from Google Drive" });
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

export const runCleanupJobCore = async () => {
  console.log("Starting automatic 90-day retention cleanup...");
  try {
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
        let canDeleteDb = true;
        if (doc.googleDriveFileId) {
          const { success } = await deleteFileFromDrive(doc.googleDriveFileId);
          if (!success) {
            canDeleteDb = false;
            console.error(`Google Drive deletion returned false, skipping DB deletion for ${doc.id}`);
          }
        }
        if (canDeleteDb) {
          await prisma.document.delete({ where: { id: doc.id } });
          successCount++;
          
          // Add Audit Log
          // Since it's an automated system action, we might not have a req.user
          // But we can insert a system audit log if the function createAuditLog allows it.
          // The current createAuditLog expects a userId. We'll skip it if no user is available, 
          // or we could create a "SYSTEM" user if the architecture has one. 
          // For now, we rely on the server logs for cleanup monitoring as requested:
          // "The backend should log useful cleanup information in development/server logs"
        } else {
          failureCount++;
        }
      } catch (e) {
        console.error(`Failed to cleanup document ${doc.id}:`, e);
        failureCount++;
      }
    }

    console.log(`Cleanup finished. Deleted: ${successCount}, Failed: ${failureCount}`);
    return { success: true, successCount, failureCount };
  } catch (error) {
    console.error("Cleanup error:", error);
    return { success: false, error };
  }
};

export const cleanupExpiredDocuments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role?.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const result = await runCleanupJobCore();
    
    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: `Cleanup finished. Deleted: ${result.successCount}, Failed: ${result.failureCount}` 
      });
    } else {
      res.status(500).json({ success: false, message: "Failed to run cleanup" });
    }
  } catch (error) {
    console.error("Cleanup error:", error);
    res.status(500).json({ success: false, message: "Failed to run cleanup" });
  }
};

export const approveDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role?.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const document = await prisma.document.findUnique({ where: { id: req.params.id }, include: { domain: true } });
    if (!document || document.isDeleted) return res.status(404).json({ success: false, message: "Not found" });
    if (document.status !== 'PENDING') return res.status(400).json({ success: false, message: "Document is not pending" });

    const updated = await prisma.document.update({
      where: { id: document.id },
      data: {
        status: 'APPROVED',
        approvedById: req.user.id,
        approvedAt: new Date(),
        rejectedById: null,
        rejectedAt: null,
        rejectionReason: null
      }
    });
    await createAuditLog(req.user.id, "APPROVE_DOCUMENT", document.name, document.domain.name);
    const serialized = { ...updated, sizeBytes: updated.sizeBytes ? updated.sizeBytes.toString() : null };
    res.status(200).json({ success: true, document: serialized });
  } catch (error) {
    console.error("Approve error:", error);
    res.status(500).json({ success: false, message: "Failed to approve document" });
  }
};

export const declineDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role?.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const { reason } = req.body || {};
    const document = await prisma.document.findUnique({ where: { id: req.params.id }, include: { domain: true } });
    if (!document || document.isDeleted) return res.status(404).json({ success: false, message: "Not found" });
    if (document.status !== 'PENDING') return res.status(400).json({ success: false, message: "Document is not pending" });

    const updated = await prisma.document.update({
      where: { id: document.id },
      data: {
        status: 'REJECTED',
        rejectedById: req.user.id,
        rejectedAt: new Date(),
        rejectionReason: reason || null,
        approvedById: null,
        approvedAt: null
      }
    });
    await createAuditLog(req.user.id, "REJECT_DOCUMENT", document.name, document.domain.name);
    const serialized = { ...updated, sizeBytes: updated.sizeBytes ? updated.sizeBytes.toString() : null };
    res.status(200).json({ success: true, document: serialized });
  } catch (error) {
    console.error("Decline error:", error);
    res.status(500).json({ success: false, message: "Failed to decline document" });
  }
};

export const updateDocumentAccess = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role?.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ success: false, message: "Forbidden: Only Admin can change access" });
    }

    const { id } = req.params;
    const { accessType, selectedFacultyIds } = req.body;

    if (!['NONE', 'ALL_FACULTY', 'SELECT_FACULTY'].includes(accessType)) {
      return res.status(400).json({ success: false, message: "Invalid accessType" });
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: { domain: true, facultyAccess: true }
    });

    if (!document || document.isDeleted) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.documentFacultyAccess.deleteMany({
        where: { documentId: id }
      });

      let facultyAccessData: { facultyId: string }[] = [];
      if (accessType === 'SELECT_FACULTY' && Array.isArray(selectedFacultyIds) && selectedFacultyIds.length > 0) {
        const validFaculties = await tx.user.findMany({
          where: {
            id: { in: selectedFacultyIds },
            role: 'FACULTY',
            status: 'Active'
          },
          select: { id: true }
        });
        facultyAccessData = validFaculties.map(f => ({ facultyId: f.id }));
      }

      await tx.document.update({
        where: { id },
        data: {
          accessType,
          facultyAccess: facultyAccessData.length > 0 ? {
            create: facultyAccessData
          } : undefined
        }
      });
    });

    await createAuditLog(req.user.id, "UPDATE_DOCUMENT_ACCESS", document.name, document.domain.name);
    
    // Fetch updated document to return
    const updatedDocument = await prisma.document.findUnique({
      where: { id },
      include: {
        domain: true,
        academicYear: true,
        department: true,
        uploadedBy: { select: { name: true, email: true, avatar: true } },
        facultyAccess: true
      }
    });

    if (updatedDocument) {
      const serializedDoc = {
        id: updatedDocument.id,
        name: updatedDocument.name,
        type: updatedDocument.type,
        size: updatedDocument.sizeBytes ? `${(Number(updatedDocument.sizeBytes) / (1024 * 1024)).toFixed(2)} MB` : "Unknown",
        date: updatedDocument.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: updatedDocument.createdAt.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }),
        domain: updatedDocument.domain.name,
        department: updatedDocument.department?.name,
        year: updatedDocument.academicYear?.year,
        uploadedBy: updatedDocument.uploadedBy.name,
        isStarred: false, // The frontend handles starring separately
        filename: updatedDocument.name,
        accessType: updatedDocument.accessType,
        facultyAccess: updatedDocument.facultyAccess
      };
      res.status(200).json({ success: true, message: "Document access updated successfully", document: serializedDoc });
    } else {
      res.status(200).json({ success: true, message: "Document access updated successfully" });
    }
  } catch (error) {
    console.error("Update Document Access Error:", error);
    res.status(500).json({ success: false, message: "Failed to update document access" });
  }
};
