import { Router } from "express";
import multer from "multer";
import { testUpload, testDelete } from "../controllers/storageController";
import { requireAuth, requireRole } from "../middleware/auth";
import { Role } from "@prisma/client";

const router = Router();

// Configure multer to use memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB temporary limit
  }
});

// Admin-only test endpoints
router.post(
  "/test-upload",
  requireAuth as any,
  requireRole(Role.ADMIN) as any,
  upload.single("file"),
  testUpload as any
);

// Use wildcard for publicId parameter since it may contain slashes (e.g. archyv/abc12345)
// In express, encodeURIComponent on the frontend or using a wildcard parameter helps.
router.delete(
  "/test-upload/:publicId(*)",
  requireAuth as any,
  requireRole(Role.ADMIN) as any,
  testDelete as any
);

export default router;
