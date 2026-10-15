import { Response } from "express";
import { DocumentType, DocumentAccess } from "@prisma/client";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthRequest } from "../middleware/auth";
import { uploadFileToDrive, updateFileInDrive, deleteFileFromDrive, getFileStreamFromDrive } from "../services/googleDrive.service";
import { createAuditLog } from "../services/audit.service";
import { prisma } from "../lib/prisma";

export const createDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!req.file) {
      require('fs').appendFileSync('debug.log', 'No file provided\n');
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    const { name: originalTitle, domain, subdomain, department, academicYear, accessType, selectedFacultyIds, branch, semester, section, yearOfStudy } = req.body;

    if (!domain) {
      return res.status(400).json({ success: false, message: "Domain is required" });
    }

    // Lookup Domain Record first to know if this is a faculty domain
    const domainRecord = await prisma.domain.findUnique({ where: { name: domain } });
    if (!domainRecord) {
      return res.status(400).json({ success: false, message: `Domain '${domain}' not found` });
    }

    const isFacultyDomain = Boolean(domainRecord.isFaculty);

    const effectiveBranch = branch || department;
    const cleanSection = (section && section !== "Overall Section" && section !== "N/A") ? section.trim() : "";

    if (isFacultyDomain) {
      if (!effectiveBranch) {
        return res.status(400).json({ success: false, message: "Branch is required for faculty domain uploads" });
      }
    } else {
      if (!academicYear || !effectiveBranch || !yearOfStudy) {
        require('fs').appendFileSync('debug.log', 'Missing fields: ' + JSON.stringify(req.body) + '\n');
        return res.status(400).json({ success: false, message: "Missing required fields (Academic Year, Branch, Year of Study) for document naming" });
      }
    }

    const originalExt = req.file.originalname.split(".").pop() || "";
    let generatedName = "";
    if (isFacultyDomain) {
      const parts = [domain, subdomain, effectiveBranch, cleanSection].filter(Boolean);
      generatedName = `${parts.join(".")}${originalExt ? "." + originalExt : ""}`;
    } else {
      const formattedYear = academicYear ? academicYear.split('-').map((p: string) => p.slice(-2)).join('-') : "";
      const formatYearOfStudy = (val: string) => {
        if (!val) return "";
        const s = val.trim().toLowerCase();
        if (s.startsWith("1") || s.includes("1st") || s.includes("1 st") || s === "first" || s === "i") return "1st";
        if (s.startsWith("2") || s.includes("2nd") || s.includes("2 nd") || s === "second" || s === "ii") return "2nd";
        if (s.startsWith("3") || s.includes("3rd") || s.includes("3 rd") || s === "third" || s === "iii") return "3rd";
        if (s.startsWith("4") || s.includes("4th") || s.includes("4 th") || s === "fourth" || s === "iv") return "4th";
        return val.replace(/\s*(yr|year)s?/i, '').replace(/[/\\]\d+/g, '').trim();
      };
      const formattedYos = formatYearOfStudy(yearOfStudy);
      const cleanSemester = (semester && semester !== "No Semester" && semester !== "None") ? String(semester).trim() : "";
      // domain.academicyear.yearofstuding.branch.section.sem.subdomain
      const parts = [domain, formattedYear, formattedYos, effectiveBranch, cleanSection, cleanSemester, subdomain].filter(Boolean);
      generatedName = `${parts.join(".")}${originalExt ? "." + originalExt : ""}`;
    }
    const finalDocumentName = (originalTitle ? `${originalTitle}${originalExt && !originalTitle.endsWith(`.${originalExt}`) ? "." + originalExt : ""}` : generatedName).replace(/[/\\]/g, "");

    // Lookup Foreign Keys Concurrently
    const [deptRecord, yearRecord, subdomainRecord] = await Promise.all([
      effectiveBranch ? prisma.department.findUnique({ where: { name: effectiveBranch } }) : Promise.resolve(null),
      academicYear ? prisma.academicYear.findUnique({ where: { year: academicYear } }) : Promise.resolve(null),
      subdomain ? prisma.subdomain.findFirst({ where: { name: subdomain, domain: { name: domain } } }) : Promise.resolve(null)
    ]);

    if (effectiveBranch && !deptRecord) {
      return res.status(400).json({ success: false, message: `Branch '${effectiveBranch}' not found` });
    }

    if (!isFacultyDomain && academicYear && !yearRecord) {
      return res.status(400).json({ success: false, message: `Academic Year '${academicYear}' not found` });
    }

    const departmentId = deptRecord?.id || null;
    let sectionRecord = null;
    if (cleanSection && departmentId) {
      sectionRecord = await prisma.section.findFirst({
        where: { name: cleanSection, departmentId }
      });
    }

    const academicYearId = isFacultyDomain ? null : (yearRecord?.id || null);

    // Determine type
    let type: DocumentType = "OTHER";
    const ext = req.file.originalname.split(".").pop()?.toLowerCase();
    if (ext === "pdf") type = "PDF";
    else if (ext === "docx") type = "DOCX";
    else if (ext === "xlsx") type = "XLSX";

    // 1. Upload to Google Drive
    const uploadResult = await uploadFileToDrive(req.file.buffer, finalDocumentName, req.file.mimetype);

    if (req.user.role?.toUpperCase() !== 'ADMIN') {
      if ((accessType && accessType !== 'NONE') || selectedFacultyIds) {
        return res.status(403).json({ success: false, message: "Forbidden: Faculty cannot configure document access permissions" });
      }
    }

    let parsedAccessType: DocumentAccess = "NONE";
    let facultyAccessData: { facultyId: string }[] = [];

    if (req.user.role?.toUpperCase() === 'ADMIN') {
      if (accessType === "ALL_FACULTY") parsedAccessType = "ALL_FACULTY";
      else if (accessType === "SELECT_FACULTY") parsedAccessType = "SELECT_FACULTY";

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
    }

    // 2. Create Prisma Document
    try {
      const document = await prisma.document.create({
        data: {
          name: finalDocumentName,
          type,
          sizeBytes: BigInt(req.file.size),
          googleDriveFileId: uploadResult.fileId,
          mimeType: uploadResult.mimeType,
          uploadedById: req.user.id,
          domainId: domainRecord.id,
          subdomainId: subdomainRecord?.id || null,
          departmentId,
          sectionId: sectionRecord?.id || null,
          academicYearId: isFacultyDomain ? null : academicYearId,
          yearOfStudy: isFacultyDomain ? null : yearOfStudy,
          branch: effectiveBranch || null,
          semester: isFacultyDomain ? null : ((semester && semester !== "No Semester" && semester !== "None") ? String(semester).trim() : null),
          section: cleanSection || null,
          status: req.user.role?.toUpperCase() === 'ADMIN' ? 'APPROVED' : 'PENDING',
          accessType: parsedAccessType,
          facultyAccess: facultyAccessData.length > 0 ? {
            create: facultyAccessData
          } : undefined
        },
        include: {
          domain: { select: { name: true } },
          department: { select: { name: true } },
          sectionRel: { select: { name: true } },
          academicYear: { select: { year: true } },
          subdomain: { select: { name: true } },
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
        subdomain: document.subdomain?.name || null,
        yearOfStudy: document.yearOfStudy,
        semester: document.semester,
        branch: document.branch,
        section: document.section,
        uploadedBy: document.uploadedBy?.name || "Unknown User",
        uploaderRole: req.user.role,
        uploadedById: document.uploadedById,
        isStarred: false,
        status: document.status,
        filename: document.name,
        // cloudinaryUrl is no longer returned; removing it or leaving it omitted is fine.
        accessType: document.accessType,
        facultyAccess: document.facultyAccess,
        canEdit: req.user.role?.toUpperCase() === 'ADMIN'
      };

      res.status(201).json({ success: true, document: serializedDoc });

      // Create Audit Log non-blocking
      if (req.user) {
        createAuditLog(req.user.id, "UPLOAD_DOCUMENT", finalDocumentName, domain).catch(console.error);
      }
    } catch (dbError) {
      // Rollback Google Drive if DB fails
      console.error("Database creation failed, rolling back Google Drive upload...");
      if (uploadResult.fileId) {
        await deleteFileFromDrive(uploadResult.fileId).catch(e => console.error("Rollback failed:", e));
      }
      throw dbError;
    }

  } catch (error: any) {
    console.error("Create document error:", error);
    require('fs').appendFileSync('debug.log', 'Create doc error: ' + (error.stack || error.message || error) + '\n');
    res.status(500).json({ success: false, message: "Failed to upload document" });
  }
};


export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const {
      search,
      domain,
      subdomain,
      department,
      branch,
      section,
      academicYear,
      yearOfStudy,
      faculty,
      status,
      isDeleted,
      isStarred,
      page = "1",
      limit = "1000",
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
    if (subdomain && subdomain !== "All Sub Domains") {
      where.subdomain = { name: subdomain as string };
    }

    const effectiveBranchQuery = (branch as string) || (department && department !== "All Branch & Sections" && department !== "All Branches" ? (department as string) : undefined);
    if (effectiveBranchQuery && effectiveBranchQuery !== "All Branches" && effectiveBranchQuery !== "All Branch & Sections") {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { department: { name: effectiveBranchQuery } },
          { branch: effectiveBranchQuery }
        ]
      });
    }

    if (section && section !== "All Sections") {
      where.AND = where.AND || [];
      if (section === "Overall Section" || section === "None") {
        where.AND.push({
          OR: [
            { section: null },
            { section: "" },
            { section: "Overall Section" },
            { section: "N/A" }
          ]
        });
      } else {
        where.AND.push({
          section: section as string
        });
      }
    }

    if (academicYear && academicYear !== "All Academic Years") {
      where.academicYear = { year: academicYear as string };
    }
    if (yearOfStudy && yearOfStudy !== "All Years of Study") {
      where.yearOfStudy = yearOfStudy as string;
    }

    if ((userRole as string) === 'ADMIN' || (userRole as string) === 'admin') {
      if (faculty && faculty !== "All Faculty") {
        where.uploadedBy = { name: faculty as string };
      }
    } else {
      if (where.isDeleted) {
        where.uploadedById = userId;
      } else {
        if (queryStatus === 'APPROVED') {
          // All faculty see all approved documents
        } else if (!queryStatus || !queryStatus.includes('APPROVED')) {
          // For pending or rejected queue, faculty only see their own uploads
          where.uploadedById = userId;
        } else {
          where.AND = where.AND || [];
          where.AND.push({
            OR: [
              { status: 'APPROVED' },
              { uploadedById: userId }
            ]
          });
        }
      }

      if (faculty && faculty !== "All Faculty") {
        where.AND = where.AND || [];
        where.AND.push({ uploadedBy: { name: faculty as string } });
      }
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = limit === "all" || limit === "-1" ? 10000 : Math.max(1, Math.min(10000, parseInt(limit as string, 10) || 1000));
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
          subdomain: { select: { name: true } },
          yearOfStudy: true,
          semester: true,
          branch: true,
          section: true,
          uploadedBy: { select: { name: true, role: true } },
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
    const isAdmin = (userRole as string)?.toUpperCase() === 'ADMIN';
    const mappedDocs = documents.map(doc => {
      const isOwner = Boolean(userId && doc.uploadedById === userId);
      const isFacultyGranted = doc.accessType === 'ALL_FACULTY' || 
        (doc.accessType === 'SELECT_FACULTY' && doc.facultyAccess.some((fa: any) => fa.facultyId === userId));
      const canEdit = isAdmin || isOwner || isFacultyGranted;

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
        subdomain: doc.subdomain?.name || null,
        yearOfStudy: doc.yearOfStudy,
        semester: doc.semester,
        branch: doc.branch,
        section: doc.section,
        uploadedBy: doc.uploadedBy?.name || "Unknown User",
        uploaderRole: doc.uploadedBy?.role || null,
        uploadedById: doc.uploadedById,
        isStarred: doc.starredByUsers.length > 0,
        status: doc.status,
        filename: doc.name,
        accessType: doc.accessType,
        facultyAccess: doc.facultyAccess,
        canEdit
      };
    });

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
      const isApproved = document.status === 'APPROVED';

      if (!isApproved && !isOwner) {
        return res.status(403).json({ success: false, message: "Forbidden: Document not approved" });
      }
    }
    // Admins have global access

    const isAdmin = req.user?.role?.toUpperCase() === 'ADMIN';
    const isOwner = Boolean(req.user?.id && document.uploadedById === req.user.id);
    const isFacultyGranted = document.accessType === 'ALL_FACULTY' || 
      (document.accessType === 'SELECT_FACULTY' && document.facultyAccess.length > 0);
    const canEdit = isAdmin || isOwner || isFacultyGranted;

    res.status(200).json({
      success: true, document: {
        ...document,
        sizeBytes: document.sizeBytes?.toString(),
        canEdit
      }
    });
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
      const isApproved = doc.status === 'APPROVED';
      const hasAccess = (
        doc.accessType === 'ALL_FACULTY' ||
        (doc.accessType === 'SELECT_FACULTY' && doc.facultyAccess.length > 0)
      );

      if (!isOwner && !isApproved && !hasAccess) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }
    }
    // Admins have global access, so no else block needed

    const domainName = doc.domain?.name || "General";

    if (req.method === 'POST') {
      try {
        await prisma.starredDocument.create({
          data: { userId, documentId }
        });
        createAuditLog(userId, "STAR_DOCUMENT", doc.name, domainName).catch(console.error);
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
        createAuditLog(userId, "UNSTAR_DOCUMENT", doc.name, domainName).catch(console.error);
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
      const isApproved = document.status === 'APPROVED';

      if (!isApproved && !isOwner) {
        return res.status(403).json({ success: false, message: "Forbidden: Document not approved" });
      }
    }
    // Admins have global access, so no else block needed

    const fileId = document.googleDriveFileId;

    if (!fileId) {
      return res.status(404).json({ success: false, message: "File ID not found" });
    }

    const stream = await getFileStreamFromDrive(fileId);

    // Set appropriate headers based on document type
    const ext = document.name.split('.').pop()?.toLowerCase();
    let mimeType = document.mimeType || 'application/octet-stream';
    if (ext === 'csv') mimeType = 'text/csv; charset=utf-8';
    else if (ext === 'xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (ext === 'xls') mimeType = 'application/vnd.ms-excel';
    else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === 'doc') mimeType = 'application/msword';
    else if (ext === 'pptx') mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    else if (ext === 'ppt') mimeType = 'application/vnd.ms-powerpoint';
    else if (ext === 'pdf') mimeType = 'application/pdf';
    else if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'webp') mimeType = 'image/webp';
    else if (ext === 'gif') mimeType = 'image/gif';
    else if (ext === 'svg') mimeType = 'image/svg+xml';
    else if (ext === 'txt') mimeType = 'text/plain; charset=utf-8';

    res.setHeader('Content-Type', mimeType);

    // Clean filename for Content-Disposition (RFC 6266)
    const cleanFilename = document.name.replace(/["\r\n\\]/g, '_');
    const isInline = req.query.inline === 'true' || document.type === 'PDF' || mimeType.startsWith('image/') || mimeType.startsWith('text/');
    if (isInline) {
      res.setHeader('Content-Disposition', `inline; filename="${cleanFilename}"; filename*=UTF-8''${encodeURIComponent(cleanFilename)}`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"; filename*=UTF-8''${encodeURIComponent(cleanFilename)}`);
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
      if (!document.uploadedBy || (document.uploadedBy.id !== req.user.id && document.uploadedBy.adminId !== req.user.id)) {
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

    // Create Audit Log non-blocking
    if (req.user) {
      createAuditLog(req.user.id, "DELETE_DOCUMENT", document.name, document.domain.name).catch(console.error);
    }
    return res.status(200).json({ success: true, document: { ...updatedDocument, sizeBytes: updatedDocument.sizeBytes?.toString() } });
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
        subdomain: { select: { name: true } },
        yearOfStudy: true,
        semester: true,
        branch: true,
        section: true,
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
        subdomain: doc.subdomain?.name || null,
        yearOfStudy: doc.yearOfStudy,
        semester: doc.semester,
        branch: doc.branch,
        section: doc.section,
        uploadedBy: doc.uploadedBy?.name || "Unknown User",
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
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const documentId = req.params.id;
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        name: true,
        isDeleted: true,
        uploadedById: true,
        domain: { select: { name: true } },
        uploadedBy: { select: { id: true, adminId: true } }
      }
    });

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    let isAuthorized = true;
    if (req.user.role?.toUpperCase() !== 'ADMIN') {
      if (!document.uploadedBy || (document.uploadedBy.id !== req.user.id && document.uploadedBy.adminId !== req.user.id)) {
        isAuthorized = false;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: "Forbidden: You can only restore your own documents" });
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

    if (req.user) {
      createAuditLog(req.user.id, "RESTORE_DOCUMENT", document.name, document.domain.name).catch(console.error);
    }

    return res.status(200).json({ success: true, document: { ...updatedDocument, sizeBytes: updatedDocument.sizeBytes?.toString() } });
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
      if (!document.uploadedBy || (document.uploadedBy.id !== req.user.id && document.uploadedBy.adminId !== req.user.id)) {
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

    // Create Audit Log non-blocking
    if (req.user) {
      createAuditLog(req.user.id, "PERMANENT_DELETE_DOCUMENT", document.name, document.domain.name).catch(console.error);
    }
    return res.status(200).json({ success: true, message: "Document permanently deleted" });
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

    // When admin approves a document uploaded by faculty, ensure that faculty automatically has edit access
    if (document.uploadedById) {
      if (document.accessType === 'NONE') {
        await prisma.document.update({
          where: { id: document.id },
          data: { accessType: 'SELECT_FACULTY' }
        });
      }
      await prisma.documentFacultyAccess.upsert({
        where: {
          documentId_facultyId: {
            documentId: document.id,
            facultyId: document.uploadedById
          }
        },
        create: {
          documentId: document.id,
          facultyId: document.uploadedById
        },
        update: {}
      });
    }

    if (req.user) {
      createAuditLog(req.user.id, "APPROVE_DOCUMENT", document.name, document.domain.name).catch(console.error);
    }
    const serialized = { ...updated, sizeBytes: updated.sizeBytes ? updated.sizeBytes.toString() : null };
    return res.status(200).json({ success: true, document: serialized });
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
    if (req.user) {
      createAuditLog(req.user.id, "REJECT_DOCUMENT", document.name, document.domain.name).catch(console.error);
    }
    const serialized = { ...updated, sizeBytes: updated.sizeBytes ? updated.sizeBytes.toString() : null };
    return res.status(200).json({ success: true, document: serialized });
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

    if (req.user) {
      createAuditLog(req.user.id, "UPDATE_DOCUMENT_ACCESS", document.name, document.domain.name).catch(console.error);
    }

    // Fetch updated document to return
    const updatedDocument = await prisma.document.findUnique({
      where: { id },
      include: {
        domain: true,
        academicYear: true,
        department: true,
        subdomain: true,
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
        subdomain: updatedDocument.subdomain?.name || null,
        yearOfStudy: updatedDocument.yearOfStudy,
        semester: updatedDocument.semester,
        branch: updatedDocument.branch,
        section: updatedDocument.section,
        uploadedBy: updatedDocument.uploadedBy?.name,
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

export const updateDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    const {
      name,
      title,
      domain,
      subdomain,
      academicYear,
      branch,
      department,
      section,
      yearOfStudy,
      semester
    } = req.body;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        domain: true,
        academicYear: true,
        department: true,
        subdomain: true
      }
    });

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const isAdmin = req.user.role?.toUpperCase() === 'ADMIN';
    const isOwner = Boolean(req.user.id && document.uploadedById === req.user.id);
    let canEdit = isAdmin || isOwner;
    if (!canEdit) {
      if (document.accessType === 'ALL_FACULTY') {
        canEdit = true;
      } else if (document.accessType === 'SELECT_FACULTY') {
        const hasAccess = await prisma.documentFacultyAccess.findFirst({
          where: { documentId: id, facultyId: req.user.id }
        });
        if (hasAccess) canEdit = true;
      }
    }

    if (!canEdit) {
      return res.status(403).json({ success: false, message: "Forbidden: You have read-only access to this document" });
    }

    const updateData: any = {};

    // 1. Title / Name
    const newTitle = (name || title || "").trim();
    if (newTitle) {
      const originalExt = document.name.includes('.') ? document.name.split('.').pop() : '';
      let finalName = newTitle.replace(/[/\\]/g, "");
      if (originalExt && !finalName.toLowerCase().endsWith(`.${originalExt.toLowerCase()}`)) {
        finalName = `${finalName}.${originalExt}`;
      }
      updateData.name = finalName;
    }

    // 2. Parallel lookups for primary entities (Domain, AcademicYear, Department)
    const effectiveBranch = branch !== undefined ? branch : department;
    const shouldFetchDomain = domain !== undefined && domain !== null && domain !== "" && domain !== "All Domains";
    const shouldFetchYear = academicYear !== undefined && academicYear && academicYear !== "None" && academicYear !== "All Academic Years" && academicYear !== "N/A";
    const shouldFetchDept = effectiveBranch !== undefined && effectiveBranch && effectiveBranch !== "None" && effectiveBranch !== "All Branches" && effectiveBranch !== "All Branch & Sections";

    const [domainRecord, yearRecord, deptRecord] = await Promise.all([
      shouldFetchDomain ? prisma.domain.findUnique({ where: { name: domain } }) : null,
      shouldFetchYear ? prisma.academicYear.findUnique({ where: { year: academicYear } }) : null,
      shouldFetchDept ? prisma.department.findUnique({ where: { name: effectiveBranch } }) : null
    ]);

    let targetDomainId = document.domainId;
    let targetDomainName = document.domain.name;
    if (shouldFetchDomain) {
      if (!domainRecord) {
        return res.status(400).json({ success: false, message: `Domain '${domain}' not found` });
      }
      targetDomainId = domainRecord.id;
      targetDomainName = domainRecord.name;
      updateData.domainId = domainRecord.id;
    }

    if (academicYear !== undefined) {
      if (!academicYear || academicYear === "None" || academicYear === "All Academic Years" || academicYear === "N/A") {
        updateData.academicYearId = null;
      } else {
        updateData.academicYearId = yearRecord ? yearRecord.id : null;
      }
    }

    let targetDeptId = document.departmentId;
    if (effectiveBranch !== undefined) {
      if (!effectiveBranch || effectiveBranch === "None" || effectiveBranch === "All Branches" || effectiveBranch === "All Branch & Sections") {
        updateData.departmentId = null;
        updateData.branch = null;
        targetDeptId = null;
      } else {
        if (deptRecord) {
          updateData.departmentId = deptRecord.id;
          updateData.branch = effectiveBranch;
          targetDeptId = deptRecord.id;
        } else {
          updateData.branch = effectiveBranch;
        }
      }
    }

    // 3. Parallel lookups for dependent entities (Subdomain, Section)
    const shouldFetchSubdomain = subdomain !== undefined && subdomain && subdomain !== "None" && subdomain !== "All Sub Domains" && subdomain !== "N/A";
    const cleanSection = (section && section !== "Overall Section" && section !== "All Sections" && section !== "N/A" && section !== "None") ? section.trim() : "";
    const shouldFetchSection = Boolean(cleanSection && targetDeptId);

    const [subdomainRecord, sectionRecord] = await Promise.all([
      shouldFetchSubdomain ? prisma.subdomain.findFirst({ where: { name: subdomain, domainId: targetDomainId } }) : null,
      shouldFetchSection ? prisma.section.findFirst({ where: { name: cleanSection, departmentId: targetDeptId! } }) : null
    ]);

    if (subdomain !== undefined) {
      if (!subdomain || subdomain === "None" || subdomain === "All Sub Domains" || subdomain === "N/A") {
        updateData.subdomainId = null;
      } else {
        updateData.subdomainId = subdomainRecord ? subdomainRecord.id : null;
      }
    }

    if (section !== undefined) {
      if (cleanSection && targetDeptId) {
        updateData.sectionId = sectionRecord?.id || null;
        updateData.section = cleanSection;
      } else {
        updateData.sectionId = null;
        updateData.section = cleanSection || (section === "Overall Section" ? "Overall Section" : null);
      }
    }

    // 4. Year of Study
    if (yearOfStudy !== undefined) {
      if (!yearOfStudy || yearOfStudy === "All Years of Study" || yearOfStudy === "None") {
        updateData.yearOfStudy = null;
      } else {
        updateData.yearOfStudy = yearOfStudy.trim();
      }
    }

    // 5. Semester
    if (semester !== undefined) {
      if (!semester || semester === "No Semester" || semester === "None" || semester === "All Semesters") {
        updateData.semester = null;
      } else {
        updateData.semester = semester.trim();
      }
    }

    // 6. Update and fetch in a single combined query
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        domain: true,
        academicYear: true,
        department: true,
        subdomain: true,
        uploadedBy: { select: { name: true, email: true, avatar: true, role: true } },
        facultyAccess: true
      }
    });

    if (req.user) {
      createAuditLog(req.user.id, "UPDATE_DOCUMENT", updateData.name || document.name, targetDomainName).catch(console.error);
    }

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
      subdomain: updatedDocument.subdomain?.name || null,
      yearOfStudy: updatedDocument.yearOfStudy,
      semester: updatedDocument.semester,
      branch: updatedDocument.branch,
      section: updatedDocument.section,
      uploadedBy: updatedDocument.uploadedBy?.name,
      uploaderRole: updatedDocument.uploadedBy?.role || null,
      uploadedById: updatedDocument.uploadedById,
      isStarred: false,
      status: updatedDocument.status,
      filename: updatedDocument.name,
      accessType: updatedDocument.accessType,
      facultyAccess: updatedDocument.facultyAccess,
      canEdit: true
    };

    return res.status(200).json({ success: true, message: "Document updated successfully", document: serializedDoc });
  } catch (error) {
    console.error("Update Document Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update document" });
  }
};

export const getOfficeLink = async (req: AuthRequest, res: Response) => {
  try {
    const documentId = req.params.id;
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        facultyAccess: { where: { facultyId: req.user?.id } }
      }
    });

    if (!document || document.isDeleted) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const isAdmin = req.user?.role?.toUpperCase() === 'ADMIN';
    const isFacultyGranted = document.accessType === 'ALL_FACULTY' || 
      (document.accessType === 'SELECT_FACULTY' && document.facultyAccess.length > 0);
    const canEdit = isAdmin || isFacultyGranted;

    // Issue a signed 4-hour ticket for Office desktop
    const ticket = jwt.sign(
      {
        id: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
        docId: document.id,
        canEdit
      },
      env.JWT_SECRET,
      { expiresIn: "4h" }
    );

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}/api/documents/${document.id}`;
    const syncUrl = `${baseUrl}/office-sync?ticket=${ticket}`;
    
    // Determine scheme
    const ext = document.name.split('.').pop()?.toLowerCase();
    const isExcel = ext === 'xlsx' || ext === 'xls' || ext === 'csv';
    const isWord = ext === 'docx' || ext === 'doc';
    const scheme = isExcel ? 'ms-excel' : (isWord ? 'ms-word' : null);
    
    const uriAction = canEdit ? 'ofe' : 'ofv'; // ofe = Open for Edit, ofv = Open for View
    const officeUri = scheme ? `${scheme}:${uriAction}|u|${syncUrl}` : null;

    res.status(200).json({
      success: true,
      canEdit,
      isExcel,
      isWord,
      officeUri,
      syncUrl,
      downloadUrl: `${baseUrl}/view?token=${ticket}`
    });
  } catch (error) {
    console.error("Get office link error:", error);
    res.status(500).json({ success: false, message: "Failed to generate office link" });
  }
};

export const handleOfficeOptions = async (req: AuthRequest, res: Response) => {
  res.setHeader('MS-Author-Via', 'DAV');
  res.setHeader('DAV', '1, 2');
  res.setHeader('Allow', 'OPTIONS, GET, HEAD, POST, PUT, LOCK, UNLOCK');
  res.setHeader('Accept-Ranges', 'bytes');
  res.status(200).end();
};

export const handleOfficeLock = async (req: AuthRequest, res: Response) => {
  const lockToken = `urn:uuid:${req.params.id}-${Date.now()}`;
  res.setHeader('Lock-Token', `<${lockToken}>`);
  res.setHeader('Content-Type', 'text/xml; charset="utf-8"');
  res.status(200).send(`<?xml version="1.0" encoding="utf-8" ?>
<D:prop xmlns:D="DAV:">
  <D:lockdiscovery>
    <D:activelock>
      <D:locktype><D:write/></D:locktype>
      <D:lockscope><D:exclusive/></D:lockscope>
      <D:depth>0</D:depth>
      <D:owner><D:href>${req.user?.email || "user"}</D:href></D:owner>
      <D:timeout>Second-3600</D:timeout>
      <D:locktoken><D:href>${lockToken}</D:href></D:locktoken>
    </D:activelock>
  </D:lockdiscovery>
</D:prop>`);
};

export const handleOfficeUnlock = async (req: AuthRequest, res: Response) => {
  res.status(204).end();
};

export const handleOfficeGet = async (req: AuthRequest, res: Response) => {
  return viewDocument(req, res);
};

export const handleOfficePut = async (req: AuthRequest, res: Response) => {
  try {
    const documentId = req.params.id;
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        facultyAccess: { where: { facultyId: req.user?.id } },
        domain: true
      }
    });

    if (!document || document.isDeleted) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const isAdmin = req.user?.role?.toUpperCase() === 'ADMIN';
    const isOwner = Boolean(req.user?.id && document.uploadedById === req.user.id);
    const isFacultyGranted = document.accessType === 'ALL_FACULTY' || 
      (document.accessType === 'SELECT_FACULTY' && document.facultyAccess.length > 0);
    const canEdit = isAdmin || isOwner || isFacultyGranted;

    if (!canEdit) {
      return res.status(403).json({ success: false, message: "Forbidden: You have read-only access to this document" });
    }

    // Read raw stream body
    const chunks: Buffer[] = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const fileBuffer = Buffer.concat(chunks);
        if (fileBuffer.length === 0) {
          return res.status(400).json({ success: false, message: "Empty file body" });
        }

        const mimeType = document.mimeType || 'application/octet-stream';
        if (document.googleDriveFileId) {
          try {
            await updateFileInDrive(document.googleDriveFileId, fileBuffer, mimeType);
          } catch (e) {
            console.warn("Failed to update in Drive, uploading fresh copy:", e);
            const fresh = await uploadFileToDrive(fileBuffer, document.name, mimeType);
            await prisma.document.update({
              where: { id: documentId },
              data: { googleDriveFileId: fresh.fileId }
            });
          }
        } else {
          const fresh = await uploadFileToDrive(fileBuffer, document.name, mimeType);
          await prisma.document.update({
            where: { id: documentId },
            data: { googleDriveFileId: fresh.fileId }
          });
        }

        const updated = await prisma.document.update({
          where: { id: documentId },
          data: {
            sizeBytes: BigInt(fileBuffer.length),
            updatedAt: new Date()
          }
        });

        if (req.user) {
          createAuditLog(req.user.id, "EDIT_DOCUMENT_CONTENT", document.name, document.domain.name).catch(console.error);
        }

        res.setHeader('ETag', `"${updated.updatedAt.getTime()}"`);
        return res.status(200).json({ success: true, message: "Document saved successfully" });
      } catch (err: any) {
        console.error("Office PUT processing error:", err);
        res.status(500).json({ success: false, message: "Failed to process saved file" });
      }
    });
  } catch (error) {
    console.error("Office PUT save error:", error);
    res.status(500).json({ success: false, message: "Failed to save document" });
  }
};

export const updateDocumentContent = async (req: AuthRequest, res: Response) => {
  try {
    const documentId = req.params.id;
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        facultyAccess: { where: { facultyId: req.user?.id } },
        domain: true
      }
    });

    if (!document || document.isDeleted) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const isAdmin = req.user?.role?.toUpperCase() === 'ADMIN';
    const isOwner = Boolean(req.user?.id && document.uploadedById === req.user.id);
    const isFacultyGranted = document.accessType === 'ALL_FACULTY' || 
      (document.accessType === 'SELECT_FACULTY' && document.facultyAccess.length > 0);
    const canEdit = isAdmin || isOwner || isFacultyGranted;

    if (!canEdit) {
      return res.status(403).json({ success: false, message: "Forbidden: You have read-only access to this document" });
    }

    let fileBuffer: Buffer | null = null;
    let mimeType = document.mimeType || 'application/octet-stream';

    if (req.file) {
      fileBuffer = req.file.buffer;
      if (req.file.mimetype) mimeType = req.file.mimetype;
    } else if (req.body?.content) {
      fileBuffer = Buffer.from(req.body.content, 'utf-8');
      if (req.body.mimeType) mimeType = req.body.mimeType;
    } else if (req.body?.csvData) {
      fileBuffer = Buffer.from(req.body.csvData, 'utf-8');
      mimeType = 'text/csv';
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ success: false, message: "No content or file provided" });
    }

    // Save to Google Drive
    if (document.googleDriveFileId) {
      try {
        await updateFileInDrive(document.googleDriveFileId, fileBuffer, mimeType);
      } catch (e) {
        console.warn("Drive update failed, uploading new copy:", e);
        const fresh = await uploadFileToDrive(fileBuffer, document.name, mimeType);
        await prisma.document.update({
          where: { id: documentId },
          data: { googleDriveFileId: fresh.fileId }
        });
      }
    } else {
      const fresh = await uploadFileToDrive(fileBuffer, document.name, mimeType);
      await prisma.document.update({
        where: { id: documentId },
        data: { googleDriveFileId: fresh.fileId }
      });
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        sizeBytes: BigInt(fileBuffer.length),
        mimeType,
        updatedAt: new Date()
      }
    });

    if (req.user) {
      createAuditLog(req.user.id, "EDIT_DOCUMENT_CONTENT", document.name, document.domain.name).catch(console.error);
    }

    return res.status(200).json({
      success: true,
      message: "Document updated successfully",
      size: `${(Number(fileBuffer.length) / (1024 * 1024)).toFixed(2)} MB`,
      updatedAt: updated.updatedAt
    });
  } catch (error) {
    console.error("Update document content error:", error);
    res.status(500).json({ success: false, message: "Failed to update document content" });
  }
};

export const getDocumentContent = async (req: AuthRequest, res: Response) => {
  try {
    const documentId = req.params.id;
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        facultyAccess: { where: { facultyId: req.user?.id } }
      }
    });

    if (!document || document.isDeleted) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const isAdmin = req.user?.role?.toUpperCase() === 'ADMIN';
    const isFacultyGranted = document.accessType === 'ALL_FACULTY' || 
      (document.accessType === 'SELECT_FACULTY' && document.facultyAccess.length > 0);
    const canEdit = isAdmin || isFacultyGranted;

    const fileId = document.googleDriveFileId;
    if (!fileId) {
      return res.status(200).json({
        success: true,
        canEdit,
        name: document.name,
        type: document.type,
        content: "",
        isTextOrCsv: false
      });
    }

    try {
      const stream = await getFileStreamFromDrive(fileId);
      const chunks: Buffer[] = [];
      stream.on('data', (c: any) => chunks.push(c));
      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const ext = document.name.split('.').pop()?.toLowerCase();
        const isTextOrCsv = ext === 'csv' || ext === 'txt' || ext === 'json' || ext === 'md';
        
        let content = "";
        if (isTextOrCsv) {
          content = buffer.toString('utf-8');
        }

        res.status(200).json({
          success: true,
          canEdit,
          name: document.name,
          type: document.type,
          sizeBytes: document.sizeBytes ? document.sizeBytes.toString() : buffer.length.toString(),
          content,
          isTextOrCsv,
          ext
        });
      });
      stream.on('error', (err: any) => {
        console.error("Error reading stream:", err);
        res.status(200).json({
          success: true,
          canEdit,
          name: document.name,
          type: document.type,
          content: "",
          isTextOrCsv: false
        });
      });
    } catch (e) {
      res.status(200).json({
        success: true,
        canEdit,
        name: document.name,
        type: document.type,
        content: "",
        isTextOrCsv: false
      });
    }
  } catch (error) {
    console.error("Get document content error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch document content" });
  }
};


