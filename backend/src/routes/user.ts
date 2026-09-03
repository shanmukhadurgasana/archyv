import { Router } from "express";
import { getUsers, createUser, updateUser, deleteUser, updateUserAvatar } from "../controllers/userController";
import { requireAuth, requireRole } from "../middleware/auth";
import { Role } from "@prisma/client";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for avatars
});

const router = Router();

// Protect all user routes, only accessible by ADMIN
router.use(requireAuth as any);
router.use(requireRole(Role.ADMIN) as any);

router.get("/", getUsers as any);
router.post("/", createUser as any);
router.patch("/:id", updateUser as any);
router.patch("/:id/avatar", upload.single("file"), updateUserAvatar as any);
router.delete("/:id", deleteUser as any);

export default router;
