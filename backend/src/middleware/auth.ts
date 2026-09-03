import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { Role } from "@prisma/client";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    facultyId?: string | null;
    departmentId?: string | null;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    
    if (decoded.isPartial) {
      return res.status(401).json({ message: "Invalid session state" });
    }

    if (decoded.sessionId) {
      const session = await prisma.session.findUnique({ where: { id: decoded.sessionId } });
      if (!session || !session.isValid) {
        return res.status(401).json({ message: "Session revoked or expired" });
      }
      
      // Optionally update lastActivity asynchronously
      prisma.session.update({
        where: { id: decoded.sessionId },
        data: { lastActivity: new Date() }
      }).catch((e: any) => console.error("Failed to update session activity", e));
    }

    // Attach user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      facultyId: decoded.facultyId,
      departmentId: decoded.departmentId,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

export const requireRole = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }

    next();
  };
};
