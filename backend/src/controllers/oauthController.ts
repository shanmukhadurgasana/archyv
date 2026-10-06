import { Request, Response } from "express";
import { google } from "googleapis";
import { env } from "../config/env";

const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);

// Scopes required for Google Drive API
const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'];

export const getAuthUrl = (req: Request, res: Response) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent to ensure we get a refresh token
  });
  
  res.status(200).json({ success: true, authUrl });
};

export const handleCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;
  
  if (!code) {
    return res.status(400).send("No code provided");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // In a real app, you should securely store this refresh token in your .env or a secure vault.
    // For now, we will return it so the admin can copy it to the .env file.
    res.status(200).send(`
      <html>
        <body>
          <h2>Google Drive Authentication Successful!</h2>
          <p>Please copy the Refresh Token below and add it to your backend <code>.env</code> file as <code>GOOGLE_REFRESH_TOKEN</code>.</p>
          <textarea rows="5" cols="80" readonly>${tokens.refresh_token || 'No refresh token received. (You might need to revoke access in Google Account and try again)'}</textarea>
          <p>You can close this window now.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("OAuth Callback error:", error);
    res.status(500).send("Authentication failed");
  }
};
