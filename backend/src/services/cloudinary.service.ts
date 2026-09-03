import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { env } from "../config/env";
import streamifier from "streamifier";

// Configure Cloudinary
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Uploads a file buffer to Cloudinary in the "archyv/" folder.
 * @param fileBuffer The file buffer from multer.
 * @param originalName The original file name.
 * @returns The secure URL and public ID from Cloudinary.
 */
export const uploadFile = (fileBuffer: Buffer, originalName: string): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    // Determine resource_type from file extension
    let resourceType: "auto" | "image" | "video" | "raw" = "auto";
    const extension = originalName.split('.').pop()?.toLowerCase();
    
    // Cloudinary treats PDF as image if we want thumbnails, but "raw" or "auto" is safer for arbitrary documents
    if (extension && ["pdf", "docx", "xlsx", "txt", "csv"].includes(extension)) {
      resourceType = "auto"; 
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "archyv",
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(error);
        }
        if (result) {
          resolve(result);
        } else {
          reject(new Error("Unknown error during upload"));
        }
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Deletes a file from Cloudinary by its public ID.
 * @param publicId The Cloudinary public ID.
 */
export const deleteFile = async (publicId: string, resourceType?: "image" | "raw" | "video"): Promise<boolean> => {
  try {
    const typesToTry = resourceType ? [resourceType] : ["image", "raw", "video"];
    
    for (const type of typesToTry) {
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: type });
      if (result.result === "ok") {
        return true;
      }
    }
    
    console.warn(`Cloudinary deletion not ok for publicId ${publicId}`);
    return false;
  } catch (error) {
    console.error(`Error deleting file with publicId ${publicId} from Cloudinary:`, error);
    throw error;
  }
};
