import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { getFileStreamFromDrive } from "../services/googleDrive.service";

export const getUserAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user || !user.avatar) {
      return res.status(404).json({ message: "Avatar not found" });
    }

    const fileId = user.avatar;
    if (fileId.startsWith('http')) {
      // Legacy cloudinary URL fallback
      return res.redirect(fileId);
    }

    const stream = await getFileStreamFromDrive(fileId);
    
    res.setHeader('Content-Type', 'image/jpeg'); // or dynamic if we store mimetype
    res.setHeader('Content-Disposition', `inline; filename="avatar_${id}.jpg"`);
    
    stream.pipe(res);
  } catch (error) {
    console.error("Get avatar error:", error);
    res.status(500).json({ message: "Failed to get avatar" });
  }
};
