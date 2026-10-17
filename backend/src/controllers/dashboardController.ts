import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (!userId || !userRole) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // RBAC Base Query for Documents
    let baseWhere: any = {};
    if ((userRole as string) === 'ADMIN' || (userRole as string) === 'admin') {
      // Global organization access for Admin
    } else {
      baseWhere.OR = [
        { uploadedById: userId },
        { status: 'APPROVED' }
      ];
    }

    // Fetch documents, domains, admins, departments, academic years concurrently
    const domainsPromise = prisma.domain.findMany();
    const totalAdminPromise = prisma.user.count({ where: { role: 'ADMIN' } });
    const totalDepartmentsPromise = prisma.department.count();
    const totalAcademicYearsPromise = prisma.academicYear.count();
    
    const allowedDocsPromise = prisma.document.findMany({
      where: baseWhere,
      select: { 
        sizeBytes: true, 
        isDeleted: true, 
        domainId: true, 
        status: true,
        uploadedBy: { select: { role: true } }
      }
    });
    
    let facultyWhere: any = { role: 'FACULTY' };
    const totalFacultyPromise = prisma.user.count({ where: facultyWhere });
    
    let auditWhere: any = {};
    if ((userRole as string) === 'ADMIN' || (userRole as string) === 'admin' || (userRole as string) === 'SUPER_ADMIN') {
      // Global organization access
    } else {
      auditWhere.userId = userId;
    }
    const rawAuditLogsPromise = prisma.auditLog.findMany({
      where: auditWhere,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } }
      }
    });

    // Await all parallel promises
    const [domains, allowedDocs, totalFaculty, totalAdmin, totalDepartments, totalAcademicYears, rawAuditLogs] = await Promise.all([
      domainsPromise,
      allowedDocsPromise,
      totalFacultyPromise,
      totalAdminPromise,
      totalDepartmentsPromise,
      totalAcademicYearsPromise,
      rawAuditLogsPromise
    ]);

    let totalBytes = 0;
    let totalDocuments = 0; // Approved documents
    let pendingDocuments = 0;
    let rejectedDocuments = 0;
    let trashDocuments = 0;
    let facultyFilesCount = 0;
    let adminFilesCount = 0;
    const domainCountsMap = new Map<string, number>();

    allowedDocs.forEach(doc => {
      totalBytes += Number(doc.sizeBytes || 0);
      if (doc.isDeleted) {
        trashDocuments++;
      } else {
        if (doc.status === 'APPROVED') {
          totalDocuments++;
          if (doc.domainId) {
            domainCountsMap.set(doc.domainId, (domainCountsMap.get(doc.domainId) || 0) + 1);
          }
          if (doc.uploadedBy?.role === 'FACULTY') {
            facultyFilesCount++;
          } else if (doc.uploadedBy?.role === 'ADMIN' || doc.uploadedBy?.role === 'SUPER_ADMIN') {
            adminFilesCount++;
          }
        } else if (doc.status === 'PENDING') {
          pendingDocuments++;
        } else if (doc.status === 'REJECTED') {
          rejectedDocuments++;
        }
      }
    });

    // Construct Domain Stats
    const domainStats = domains.map((domain) => {
      return { id: domain.id, name: domain.name, count: domainCountsMap.get(domain.id) || 0 };
    });

    const recentActivity = rawAuditLogs.map(log => ({
      id: log.id,
      action: log.action,
      target: log.target,
      domain: log.domain || "System",
      time: log.createdAt.toISOString(),
      user: log.user?.name || "Unknown"
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalDocuments,
        totalFiles: totalDocuments,
        pendingDocuments,
        rejectedDocuments,
        trashDocuments,
        totalFaculty,
        totalAdmin,
        totalDepartments,
        totalDomains: domains.length,
        totalAcademicYears,
        facultyFilesCount,
        adminFilesCount,
        totalBytes,
        domainStats,
        recentActivity
      }
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
