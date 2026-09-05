import { Router } from "express";
import { signup, login, logout, getCurrentUser, updateAvatar, updateProfile, updatePassword, generate2FA, verify2FA, disable2FA, login2FA, getSessions, revokeSession, revokeAllOtherSessions, testAuth, testAdmin, testFaculty } from "../controllers/authController";
import { requireAuth, requireRole } from "../middleware/auth";
import { Role } from "@prisma/client";
import multer from "multer";

import rateLimit from "express-rate-limit";
import { forgotPassword, resetPassword } from "../controllers/authController";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for avatars
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: { message: "Too many password reset requests from this IP, please try again after 15 minutes." }
});

const router = Router();

import {
  generateRegistrationOptionsHandler,
  verifyRegistrationResponseHandler,
  generateAuthenticationOptionsHandler,
  verifyAuthenticationResponseHandler,
  getUserPasskeys,
  deletePasskey,
} from "../controllers/passkeyController";

// Public routes
router.post("/signup", signup as any);
router.post("/login", login as any);
router.post("/logout", logout as any);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword as any);
router.post("/reset-password", resetPassword as any);

// Passkey Public Auth Routes
router.get("/passkey/generate-authentication-options", generateAuthenticationOptionsHandler as any);
router.post("/passkey/verify-authentication", verifyAuthenticationResponseHandler as any);

// Protected routes
router.get("/me", requireAuth as any, getCurrentUser as any);
router.patch("/me/avatar", requireAuth as any, upload.single("file"), updateAvatar as any);
router.patch("/me/profile", requireAuth as any, updateProfile as any);
router.patch("/me/password", requireAuth as any, updatePassword as any);

// Passkey Protected Registration/Management Routes
router.get("/passkey/generate-registration-options", requireAuth as any, generateRegistrationOptionsHandler as any);
router.post("/passkey/verify-registration", requireAuth as any, verifyRegistrationResponseHandler as any);
router.get("/passkey", requireAuth as any, getUserPasskeys as any);
router.delete("/passkey/:id", requireAuth as any, deletePasskey as any);

// 2FA endpoints
router.post("/2fa/generate", requireAuth as any, generate2FA as any);
router.post("/2fa/verify", requireAuth as any, verify2FA as any);
router.post("/2fa/disable", requireAuth as any, disable2FA as any);
router.post("/2fa/login", login2FA as any);

// Session endpoints
router.get("/sessions", requireAuth as any, getSessions as any);
router.delete("/sessions", requireAuth as any, revokeAllOtherSessions as any);
router.delete("/sessions/:id", requireAuth as any, revokeSession as any);

// Test endpoints for RBAC verification (as per Phase 3 requirements)
router.get("/test", requireAuth as any, testAuth as any);
router.get("/test-admin", requireAuth as any, requireRole(Role.ADMIN) as any, testAdmin as any);
router.get("/test-faculty", requireAuth as any, requireRole(Role.FACULTY, Role.ADMIN) as any, testFaculty as any);

export default router;
