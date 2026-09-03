import { Router } from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../middleware/auth";
import { Role } from "@prisma/client";
import {
  createDocument,
  getDocuments,
  getDocumentById,
  toggleStar,
  viewDocument,
  softDeleteDocument,
  getTrashedDocuments,
  restoreDocument,
  permanentDeleteDocument,
  cleanupExpiredDocuments
} from "../controllers/documentController";

const router = Router();

// Configure multer for memory storage (for Cloudinary upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit matching frontend
  },
});

// All document routes require authentication
router.use(requireAuth);

// GET /api/documents - Get all documents with optional filtering
router.get("/", getDocuments as any);

// POST /api/documents/cleanup - Automatic cleanup trigger (Admin)
router.post("/cleanup", requireRole(Role.ADMIN) as any, cleanupExpiredDocuments as any);

// GET /api/documents/trash - Get all trashed documents
router.get("/trash", requireRole(Role.ADMIN) as any, getTrashedDocuments as any);

// POST /api/documents - Create a new document (upload file)
router.post("/", upload.single("file"), createDocument as any);

// GET /api/documents/:id - Get a specific document
router.get("/:id", getDocumentById as any);

// DELETE /api/documents/:id - Soft delete a document
router.delete("/:id", requireRole(Role.ADMIN) as any, softDeleteDocument as any);

// PATCH /api/documents/:id/restore - Restore a trashed document
router.patch("/:id/restore", requireRole(Role.ADMIN) as any, restoreDocument as any);

// DELETE /api/documents/:id/permanent - Permanently delete a trashed document
router.delete("/:id/permanent", requireRole(Role.ADMIN) as any, permanentDeleteDocument as any);

// POST /api/documents/:id/star - Star a document
router.post("/:id/star", toggleStar as any);

// DELETE /api/documents/:id/star - Unstar a document
router.delete("/:id/star", toggleStar as any);

// GET /api/documents/:id/view - View/Download a document
router.get("/:id/view", viewDocument as any);

export default router;
