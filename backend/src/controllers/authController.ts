import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateSecret, generateURI, verifySync } from "otplib";
import qrcode from "qrcode";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { AuthRequest } from "../middleware/auth";
import { Role } from "@prisma/client";
import { createAuditLog } from "../services/audit.service";

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: Role.ADMIN,
        status: "Active",
      },
    });

    res.status(201).json({ message: "Admin created successfully", user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        department: { select: { name: true } }
      }
    });

    if (!user) {
      // Return generic error to avoid user enumeration
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status !== "Active") {
      return res.status(403).json({ message: "Account is inactive" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const userAgent = req.headers["user-agent"] || "Unknown Device";
    const ipAddress = req.ip || req.socket.remoteAddress || "Unknown IP";

    if (user.isTwoFactorEnabled) {
      const existingSession = await prisma.session.findFirst({
        where: { userId: user.id, deviceInfo: userAgent, ipAddress: ipAddress, isValid: true }
      });

      if (!existingSession) {
        const tempToken = jwt.sign(
          { id: user.id, isPartial: true },
          env.JWT_SECRET,
          { expiresIn: "5m" }
        );
        return res.status(200).json({
          require2FA: true,
          tempToken,
          message: "2FA code required"
        });
      }
    }

    let session = await prisma.session.findFirst({
      where: { userId: user.id, deviceInfo: userAgent, ipAddress: ipAddress, isValid: true }
    });

    if (session) {
      session = await prisma.session.update({
        where: { id: session.id },
        data: { lastActivity: new Date() }
      });
    } else {
      session = await prisma.session.create({
        data: {
          userId: user.id,
          deviceInfo: userAgent,
          ipAddress: ipAddress,
        }
      });
    }

    const currentLoginTime = new Date();

    // Update lastLogin silently
    prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: currentLoginTime },
    }).catch(console.error);

    // Create JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        facultyId: user.facultyId,
        departmentId: user.departmentId,
        adminId: user.adminId,
        sessionId: session.id,
      },
      env.JWT_SECRET,
      { expiresIn: "1d" } // 1 day expiration
    );

    // Set cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day in ms
    });

    // Return safe user object
    const mappedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      facultyId: user.facultyId,
      departmentId: user.departmentId,
      department: user.department?.name,
      status: user.status,
      avatar: user.avatar,
      phone: user.phone,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      dateOfJoin: user.dateOfJoin ? user.dateOfJoin.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A",
      lastLogin: currentLoginTime.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: '2-digit', minute: '2-digit' }),
    };

    res.status(200).json({ user: mappedUser });

    // Create Audit Log asynchronously
    createAuditLog(user.id, "LOGIN", user.email, "Auth").catch(console.error);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies.jwt;
  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      if (decoded.id) {
        createAuditLog(decoded.id, "LOGOUT", decoded.email || decoded.id, "Auth").catch(console.error);
        if (decoded.sessionId) {
          await prisma.session.update({
            where: { id: decoded.sessionId },
            data: { isValid: false }
          }).catch(console.error);
        }
      }
    } catch (e) {
      // ignore token verification errors on logout
    }
  }

  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        facultyId: true,
        departmentId: true,
        phone: true,
        status: true,
        avatar: true,
        dateOfJoin: true,
        lastLogin: true,
        isTwoFactorEnabled: true,
        department: { select: { name: true } }
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const mappedUser = {
      ...user,
      department: user.department?.name,
      dateOfJoin: user.dateOfJoin ? user.dateOfJoin.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A",
      lastLogin: user.lastLogin ? user.lastLogin.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: '2-digit', minute: '2-digit' }) : "Never",
    };

    res.status(200).json({ user: mappedUser });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

import { uploadFile } from "../services/cloudinary.service";

export const updateAvatar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.file) {
      return res.status(400).json({ message: "No user or file provided" });
    }

    const uploadResult = await uploadFile(req.file.buffer, req.file.originalname);
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: uploadResult.secure_url },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        facultyId: true,
        departmentId: true,
        phone: true,
        status: true,
        avatar: true,
        dateOfJoin: true,
        lastLogin: true,
        department: { select: { name: true } }
      }
    });

    const mappedUser = {
      ...updatedUser,
      department: updatedUser.department?.name,
      dateOfJoin: updatedUser.dateOfJoin ? updatedUser.dateOfJoin.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A",
      lastLogin: updatedUser.lastLogin ? updatedUser.lastLogin.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: '2-digit', minute: '2-digit' }) : "Never",
    };

    res.status(200).json({ success: true, user: mappedUser });
  } catch (error) {
    console.error("Avatar update error:", error);
    res.status(500).json({ message: "Failed to update avatar" });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const { name, phone, dateOfJoin, email, facultyId } = req.body;
    
    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (facultyId !== undefined) dataToUpdate.facultyId = facultyId;

    if (email !== undefined && email !== req.user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) return res.status(409).json({ message: "Email already in use" });
      dataToUpdate.email = email;
    }

    // Only Admin can update their dateOfJoin
    if (req.user.role === 'ADMIN' && dateOfJoin !== undefined) {
      dataToUpdate.dateOfJoin = dateOfJoin ? new Date(dateOfJoin) : null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        facultyId: true,
        departmentId: true,
        phone: true,
        status: true,
        avatar: true,
        dateOfJoin: true,
        lastLogin: true,
        department: { select: { name: true } }
      }
    });

    const mappedUser = {
      ...updatedUser,
      department: updatedUser.department?.name,
      dateOfJoin: updatedUser.dateOfJoin ? updatedUser.dateOfJoin.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A",
      lastLogin: updatedUser.lastLogin ? updatedUser.lastLogin.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: '2-digit', minute: '2-digit' }) : "Never",
    };

    res.status(200).json({ success: true, user: mappedUser });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Missing passwords" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) return res.status(401).json({ message: "Incorrect previous password" });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    // Invalidate all active sessions for the user to secure the account
    await prisma.session.updateMany({
      where: { userId: user.id },
      data: { isValid: false },
    });

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

import crypto from "crypto";
import { sendPasswordResetEmail } from "../services/email.service";

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    
    // Always return generic success message to prevent user enumeration
    if (!user || user.status !== "Active") {
      return res.status(200).json({ message: "If an account exists with this email, a password reset link has been sent." });
    }

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Token expires in 15 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const resetLink = `${env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    
    // Send email asynchronously
    sendPasswordResetEmail(user.email, resetLink).catch(console.error);
    
    createAuditLog(user.id, "PASSWORD_RESET_REQUESTED", user.email, "Auth").catch(console.error);

    res.status(200).json({ message: "If an account exists with this email, a password reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const resetTokenRecord = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetTokenRecord) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12); // Using 12 rounds as in signup

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetTokenRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetTokenRecord.id },
        data: { usedAt: new Date() },
      }),
      prisma.session.updateMany({
        where: { userId: resetTokenRecord.userId },
        data: { isValid: false },
      })
    ]);

    createAuditLog(resetTokenRecord.userId, "PASSWORD_RESET_COMPLETED", resetTokenRecord.user.email, "Auth").catch(console.error);

    res.status(200).json({ message: "Password has been successfully reset" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 2FA Endpoints

export const generate2FA = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const secret = generateSecret();
    const otpauth = generateURI({ issuer: "Archyv Admin", label: user.email, secret, strategy: "totp" });
    const qrCodeUrl = await qrcode.toDataURL(otpauth);

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret }
    });

    res.status(200).json({ qrCodeUrl, secret });
  } catch (error) {
    console.error("Generate 2FA error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verify2FA = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;
    if (!req.user || !token) return res.status(400).json({ message: "Missing token" });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.twoFactorSecret) return res.status(400).json({ message: "2FA not set up" });

    const result = verifySync({ token: String(token), secret: user.twoFactorSecret, strategy: "totp", epochTolerance: 1 });
    if (!result.valid) return res.status(400).json({ message: "Invalid 2FA code" });

    await prisma.user.update({
      where: { id: user.id },
      data: { isTwoFactorEnabled: true }
    });

    res.status(200).json({ success: true, message: "2FA enabled successfully" });
  } catch (error) {
    console.error("Verify 2FA error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const disable2FA = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    await prisma.user.update({
      where: { id: req.user.id },
      data: { isTwoFactorEnabled: false, twoFactorSecret: null }
    });

    res.status(200).json({ success: true, message: "2FA disabled successfully" });
  } catch (error) {
    console.error("Disable 2FA error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login2FA = async (req: Request, res: Response) => {
  try {
    const { tempToken, token } = req.body;
    if (!tempToken || !token) return res.status(400).json({ message: "Missing tokens" });

    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: "Invalid or expired temporary token" });
    }

    if (!decoded.isPartial || !decoded.id) {
      return res.status(401).json({ message: "Invalid token structure" });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { department: { select: { name: true } } }
    });

    if (!user || !user.twoFactorSecret || !user.isTwoFactorEnabled) {
      return res.status(400).json({ message: "Invalid 2FA state" });
    }

    const result = verifySync({ token: String(token), secret: user.twoFactorSecret, strategy: "totp", epochTolerance: 1 });
    if (!result.valid) return res.status(400).json({ message: "Invalid 2FA code" });

    const userAgent = req.headers["user-agent"] || "Unknown Device";
    const ipAddress = req.ip || req.socket.remoteAddress || "Unknown IP";

    let session = await prisma.session.findFirst({
      where: { userId: user.id, deviceInfo: userAgent, ipAddress: ipAddress, isValid: true }
    });

    if (session) {
      session = await prisma.session.update({
        where: { id: session.id },
        data: { lastActivity: new Date() }
      });
    } else {
      session = await prisma.session.create({
        data: {
          userId: user.id,
          deviceInfo: userAgent,
          ipAddress: ipAddress,
        }
      });
    }

    const finalToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        facultyId: user.facultyId,
        departmentId: user.departmentId,
        adminId: user.adminId,
        sessionId: session.id,
      },
      env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("jwt", finalToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const mappedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      facultyId: user.facultyId,
      departmentId: user.departmentId,
      department: user.department?.name,
      status: user.status,
      avatar: user.avatar,
      phone: user.phone,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      dateOfJoin: user.dateOfJoin ? user.dateOfJoin.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A",
      lastLogin: user.lastLogin ? user.lastLogin.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: '2-digit', minute: '2-digit' }) : "Never",
    };

    res.status(200).json({ user: mappedUser });
  } catch (error) {
    console.error("2FA Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Session Endpoints

export const getSessions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const sessions = await prisma.session.findMany({
      where: { userId: req.user.id, isValid: true },
      orderBy: { lastActivity: "desc" }
    });
    // Mark the current session
    const currentSessionId = (req.user as any).sessionId;
    const mappedSessions = sessions.map(s => ({
      ...s,
      isCurrent: s.id === currentSessionId
    }));
    res.status(200).json({ sessions: mappedSessions });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const revokeSession = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const { id } = req.params;
    await prisma.session.updateMany({
      where: { id, userId: req.user.id },
      data: { isValid: false }
    });
    res.status(200).json({ success: true, message: "Session revoked" });
  } catch (error) {
    console.error("Revoke session error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const revokeAllOtherSessions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const currentSessionId = (req.user as any).sessionId;
    await prisma.session.updateMany({
      where: { 
        userId: req.user.id,
        id: { not: currentSessionId }
      },
      data: { isValid: false }
    });
    res.status(200).json({ success: true, message: "Other sessions revoked" });
  } catch (error) {
    console.error("Revoke other sessions error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Test endpoints
export const testAuth = (req: AuthRequest, res: Response) => {
  res.status(200).json({ message: "Authenticated", user: req.user });
};

export const testAdmin = (req: AuthRequest, res: Response) => {
  res.status(200).json({ message: "Admin authenticated", user: req.user });
};

export const testFaculty = (req: AuthRequest, res: Response) => {
  res.status(200).json({ message: "Faculty authenticated", user: req.user });
};
