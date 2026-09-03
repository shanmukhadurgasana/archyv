import { prisma } from "../lib/prisma";

/**
 * Creates an audit log entry in the database.
 * Does not throw errors to prevent disrupting main business flows.
 */
export const createAuditLog = async (
  userId: string,
  action: string,
  target: string,
  domain: string | null = null
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        target,
        domain
      }
    });
  } catch (error) {
    // Log the error but don't fail the primary request
    console.error("Failed to create audit log:", error);
  }
};
