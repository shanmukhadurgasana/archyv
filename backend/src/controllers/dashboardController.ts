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
      baseWhere.uploadedById = userId;
    }

    // Fetch everything concurrently to minimize latency
    const domainsPromise = prisma.domain.findMany();
    const storagePromise = prisma.document.aggregate({
      _sum: { sizeBytes: true },
      where: { ...baseWhere }
    });
    const statusCountsPromise = prisma.document.groupBy({
      by: ['isDeleted'],
      where: baseWhere,
      _count: { _all: true }
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

    const domainCountsPromise = prisma.document.groupBy({
      by: ['domainId'],
      where: { ...baseWhere, isDeleted: false },
      _count: { _all: true }
    });

    // Await all parallel promises
    const [domains, storageResult, statusCounts, totalFaculty, rawAuditLogs, domainCounts] = await Promise.all([
      domainsPromise,
      storagePromise,
      statusCountsPromise,
      totalFacultyPromise,
      rawAuditLogsPromise,
      domainCountsPromise
    ]);

    const totalBytes = Number(storageResult._sum.sizeBytes || 0);

    let totalDocuments = 0, trashDocuments = 0;
    statusCounts.forEach(group => {
      const count = group._count._all;
      if (group.isDeleted) {
        trashDocuments += count;
      } else {
        totalDocuments += count;
      }
    });

    // Construct Domain Stats using grouped results efficiently without N+1 queries
    const domainStats = domains.map((domain) => {
      const found = domainCounts.find(dc => dc.domainId === domain.id);
      return { id: domain.id, name: domain.name, count: found ? found._count._all : 0 };
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
