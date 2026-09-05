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
      baseWhere.uploadedBy = {
        OR: [
          { id: userId },
          { adminId: userId }
        ]
      };
    } else {
      const userAdminId = (req.user as any)?.adminId;
      if (userAdminId) {
        baseWhere.OR = [
          { uploadedById: userId },
          {
            uploadedById: userAdminId,
            OR: [
              { accessType: 'ALL_FACULTY' },
              { facultyAccess: { some: { facultyId: userId } } }
            ]
          }
        ];
      } else {
        baseWhere.uploadedById = userId;
      }
    }

    // Fetch documents and domains concurrently
    const domainsPromise = prisma.domain.findMany();
    
    // Instead of Prisma groupBy which doesn't support relation filters,
    // we fetch the required scalar fields and aggregate in memory.
    const allowedDocsPromise = prisma.document.findMany({
      where: baseWhere,
      select: { sizeBytes: true, isDeleted: true, domainId: true }
    });
    
    let facultyWhere: any = { role: 'FACULTY' };
    if ((userRole as string) === 'ADMIN' || (userRole as string) === 'admin') {
      facultyWhere.adminId = userId;
    }
    const totalFacultyPromise = prisma.user.count({ where: facultyWhere });
    
    let auditWhere: any = {};
    if ((userRole as string) === 'ADMIN' || (userRole as string) === 'admin') {
      auditWhere.user = {
        OR: [
          { id: userId },
          { adminId: userId }
        ]
      };
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
    const [domains, allowedDocs, totalFaculty, rawAuditLogs] = await Promise.all([
      domainsPromise,
      allowedDocsPromise,
      totalFacultyPromise,
      rawAuditLogsPromise
    ]);

    let totalBytes = 0;
    let totalDocuments = 0;
    let trashDocuments = 0;
    const domainCountsMap = new Map<string, number>();

    allowedDocs.forEach(doc => {
      totalBytes += Number(doc.sizeBytes || 0);
      if (doc.isDeleted) {
        trashDocuments++;
      } else {
        totalDocuments++;
        if (doc.domainId) {
          domainCountsMap.set(doc.domainId, (domainCountsMap.get(doc.domainId) || 0) + 1);
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
        trashDocuments,
        totalFaculty,
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
