import { Request, Response } from "express";
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { GenerateRegistrationOptionsOpts, VerifyRegistrationResponseOpts, GenerateAuthenticationOptionsOpts, VerifyAuthenticationResponseOpts } from "@simplewebauthn/server";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { AuthRequest } from "../middleware/auth";
import jwt from "jsonwebtoken";
import { createAuditLog } from "../services/audit.service";
import crypto from "crypto";

const rpName = "Archyv Platform";
// For development on localhost, RP ID is localhost. In production, use the actual domain.
const rpID = process.env.NODE_ENV === "production" ? new URL(env.FRONTEND_URL).hostname : "localhost";
const expectedOrigin = env.FRONTEND_URL || "http://localhost:3000";

/**
 * 1. Generate Registration Options
 */
export const generateRegistrationOptionsHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { passkeys: true }
    });
    
    if (!user) return res.status(404).json({ message: "User not found" });

    const userPasskeys = user.passkeys.map(passkey => ({
      id: Buffer.from(passkey.credentialID).toString('base64url'),
      transports: passkey.transports ? (passkey.transports.split(',') as any[]) : undefined,
    }));

    const options: GenerateRegistrationOptionsOpts = {
      rpName,
      rpID,
      userID: new Uint8Array(Buffer.from(user.id)),
      userName: user.email,
      attestationType: 'none',
      excludeCredentials: userPasskeys,
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
    };

    const registrationOptions = await generateRegistrationOptions(options);

    await prisma.user.update({
      where: { id: user.id },
      data: { currentChallenge: registrationOptions.challenge },
    });

    res.status(200).json(registrationOptions);
  } catch (error) {
    console.error("Error generating registration options:", error);
    res.status(500).json({ message: "Failed to generate registration options" });
  }
};

/**
 * 2. Verify Registration Response
 */
export const verifyRegistrationResponseHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    
    const body = req.body;
    
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.currentChallenge) {
      return res.status(400).json({ message: "No active challenge found for user" });
    }

    let verification;
    try {
      const opts: VerifyRegistrationResponseOpts = {
        response: body,
        expectedChallenge: user.currentChallenge,
        expectedOrigin,
        expectedRPID: rpID,
      };
      verification = await verifyRegistrationResponse(opts);
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({ message: error.message });
    }

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const { credential, credentialDeviceType, credentialBackedUp } = registrationInfo;
      
      const transports = body.response.transports ? body.response.transports.join(',') : '';
      
      await prisma.passkey.create({
        data: {
          userId: user.id,
          credentialID: Buffer.from(credential.id, 'base64url'),
          credentialPublicKey: Buffer.from(credential.publicKey),
          counter: BigInt(credential.counter),
          transports,
          deviceType: credentialDeviceType,
          backedUp: credentialBackedUp,
        }
      });
      
      // Clear the challenge
      await prisma.user.update({
        where: { id: user.id },
        data: { currentChallenge: null }
      });
      
      return res.status(200).json({ verified: true });
    }
    
    res.status(400).json({ message: "Passkey verification failed" });
  } catch (error) {
    console.error("Error verifying registration:", error);
    res.status(500).json({ message: "Failed to verify registration" });
  }
};

/**
 * 3. Generate Authentication Options
 */
export const generateAuthenticationOptionsHandler = async (req: Request, res: Response) => {
  try {
    const options: GenerateAuthenticationOptionsOpts = {
      rpID,
      userVerification: 'required',
    };

    const authOptions = await generateAuthenticationOptions(options);

    // We don't know the user yet, store challenge in AuthChallenge table (valid for 5 mins)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    
    await prisma.authChallenge.create({
      data: {
        challenge: authOptions.challenge,
        expiresAt,
      }
    });

    res.status(200).json(authOptions);
  } catch (error) {
    console.error("Error generating auth options:", error);
    res.status(500).json({ message: "Failed to generate authentication options" });
  }
};

/**
 * 4. Verify Authentication Response
 */
export const verifyAuthenticationResponseHandler = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    
    // The challenge is included in the client data. Let's decode it to find it in our DB.
    // However, typical flow is we store the challenge in a signed cookie before. 
    // Since we created `AuthChallenge` with the exact challenge, we can extract it from the clientDataJSON
    // But it's base64url encoded. Let's just expect the client to send the original challenge back or find it.
    // Instead of parsing clientDataJSON manually, we can accept the `challenge` alongside the body if the frontend keeps track of it, 
    // or we can use the `challenge` parameter sent from frontend.
    
    const clientChallenge = req.body.challenge; 
    
    if (!clientChallenge) {
       return res.status(400).json({ message: "Missing challenge in request" });
    }

    const authChallenge = await prisma.authChallenge.findUnique({
      where: { challenge: clientChallenge }
    });

    if (!authChallenge || authChallenge.expiresAt < new Date()) {
      return res.status(400).json({ message: "Challenge expired or invalid" });
    }

    const credentialIDBuffer = Buffer.from(body.id, 'base64url');
    
    // Find the passkey using the credentialID
    const passkey = await prisma.passkey.findUnique({
      where: { credentialID: credentialIDBuffer },
      include: { user: { include: { department: true } } }
    });

    if (!passkey) {
      return res.status(400).json({ message: "Passkey not recognized" });
    }

    const user = passkey.user;
    
    if (user.status !== "Active") {
      return res.status(403).json({ message: "Account is inactive" });
    }

    let verification;
    try {
      const opts: VerifyAuthenticationResponseOpts = {
        response: body,
        expectedChallenge: authChallenge.challenge,
        expectedOrigin,
        expectedRPID: rpID,
        credential: {
          id: Buffer.from(passkey.credentialID).toString('base64url'),
          publicKey: new Uint8Array(passkey.credentialPublicKey),
          counter: Number(passkey.counter),
          transports: passkey.transports ? (passkey.transports.split(',') as any[]) : undefined,
        },
        requireUserVerification: true,
      };
      verification = await verifyAuthenticationResponse(opts);
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({ message: error.message });
    }

    const { verified, authenticationInfo } = verification;

    if (verified && authenticationInfo) {
      // Update counter to prevent replay attacks
      await prisma.passkey.update({
        where: { id: passkey.id },
        data: { counter: BigInt(authenticationInfo.newCounter) }
      });
      
      // Delete used challenge
      await prisma.authChallenge.delete({ where: { id: authChallenge.id } });

      // -- Create standard ARCHYV session --
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

      const currentLoginTime = new Date();
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: currentLoginTime },
      });

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
        { expiresIn: "1d" }
      );

      res.cookie("jwt", token, {
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
        lastLogin: currentLoginTime.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: '2-digit', minute: '2-digit' }),
      };

      createAuditLog(user.id, "LOGIN_PASSKEY", user.email, "Auth").catch(console.error);

      return res.status(200).json({ user: mappedUser });
    }

    res.status(400).json({ message: "Passkey authentication failed" });
  } catch (error) {
    console.error("Error verifying authentication:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * 5. Get User Passkeys
 */
export const getUserPasskeys = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    
    const passkeys = await prisma.passkey.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        createdAt: true,
        deviceType: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.status(200).json({ passkeys });
  } catch (error) {
    console.error("Error getting passkeys:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * 6. Delete Passkey
 */
export const deletePasskey = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    
    const { id } = req.params;
    
    await prisma.passkey.deleteMany({
      where: { id, userId: req.user.id }
    });
    
    res.status(200).json({ message: "Passkey deleted" });
  } catch (error) {
    console.error("Error deleting passkey:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
