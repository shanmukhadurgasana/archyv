import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { uploadFileToDrive, deleteFileFromDrive } from "../services/googleDrive.service";

export const testUpload = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadFileToDrive(req.file.buffer, req.file.originalname, req.file.mimetype);
    
    res.status(201).json({
      success: true,
      file: {
        fileId: result.fileId,
        mimeType: result.mimeType,
        webViewLink: result.webViewLink
      }
    });
  } catch (error) {
    console.error("Test upload error:", error);
    res.status(500).json({ message: "Failed to upload file to Google Drive" });
  }
};

export const testDelete = async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({ message: "publicId is required" });
    }

    // Since public IDs can contain slashes, it might be encoded. Usually we get it from params correctly if routed well.
    const decodedId = decodeURIComponent(publicId);

    const { success } = await deleteFileFromDrive(decodedId);
    
    if (success) {
      res.status(200).json({ success: true, message: "File deleted successfully" });
    } else {
      res.status(400).json({ success: false, message: "Failed to delete file from Google Drive" });
    }
  } catch (error) {
    console.error("Test delete error:", error);
    res.status(500).json({ message: "Internal server error during deletion" });
  }
};
