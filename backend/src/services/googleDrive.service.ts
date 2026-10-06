import { google } from "googleapis";
import { env } from "../config/env";
import stream from "stream";

// Configure OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);

// Only set credentials if refresh token is available (it should be in production)
if (env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: env.GOOGLE_REFRESH_TOKEN,
  });
}

export const drive = google.drive({ version: "v3", auth: oauth2Client });

/**
 * Uploads a file buffer to Google Drive.
 * @param fileBuffer The file buffer.
 * @param fileName The sanitized filename.
 * @param mimeType Optional mime type (defaults to application/octet-stream).
 * @returns The Google Drive file ID and web view link.
 */
export const uploadFileToDrive = async (
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string = "application/octet-stream"
) => {
  try {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    const fileMetadata: any = {
      name: fileName,
    };
    
    if (env.GOOGLE_DRIVE_FOLDER_ID) {
      fileMetadata.parents = [env.GOOGLE_DRIVE_FOLDER_ID];
    }

    const media = {
      mimeType,
      body: bufferStream,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, mimeType, webViewLink",
    });

    return {
      fileId: response.data.id,
      mimeType: response.data.mimeType,
      webViewLink: response.data.webViewLink,
    };
  } catch (error) {
    console.error("Google Drive upload error:", error);
    throw error;
  }
};

/**
 * Gets a file stream from Google Drive.
 * @param fileId The Google Drive file ID.
 */
export const getFileStreamFromDrive = async (fileId: string) => {
  try {
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' }
    );
    return response.data;
  } catch (error) {
    console.error("Google Drive download error:", error);
    throw error;
  }
};

/**
 * Deletes a file from Google Drive.
 * @param fileId The Google Drive file ID.
 */
export const deleteFileFromDrive = async (fileId: string) => {
  try {
    await drive.files.delete({
      fileId: fileId,
    });
    return { success: true };
  } catch (error: any) {
    // If file is not found, treat it as idempotent success
    if (error.code === 404 || error.message?.includes('File not found')) {
      console.log(`Google Drive deletion idempotent: file already missing for id ${fileId}`);
      return { success: true };
    }
    console.error(`Error deleting file with id ${fileId} from Google Drive:`, error);
    return { success: false, error };
  }
};
