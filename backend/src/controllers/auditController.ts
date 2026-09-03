import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const skip = (page - 1) * limit;

    let auditWhere: any = {};
    const userRole = req.user?.role;
    const userId = req.user?.id;
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

    const auditLogs = await prisma.auditLog.findMany({
      where: auditWhere,
      take: limit,
      skip,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            name: true,
            role: true
          }
        }
      }
    });

    const totalLogs = await prisma.auditLog.count({ where: auditWhere });

    res.status(200).json({
      success: true,
      auditLogs,
      pagination: {
        page,
        limit,
        total: totalLogs,
        totalPages: Math.ceil(totalLogs / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
