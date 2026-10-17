import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  try {
    // 1. Try to add SUPER_ADMIN to Role enum in Postgres if not already present
    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';`);
      console.log("Successfully verified/added 'SUPER_ADMIN' to Role enum.");
    } catch (enumErr: any) {
      console.log("Enum update note:", enumErr.message);
    }

    // 2. Check if superadmin exists
    const superAdminEmail = "superadmin@archyv.com";
    const passwordHash = await bcrypt.hash("SuperAdmin@123", 12);

    const existing = await prisma.user.findUnique({
      where: { email: superAdminEmail }
    });

    if (existing) {
      // Update password hash and role
      await prisma.$executeRawUnsafe(
        `UPDATE "User" SET "passwordHash" = $1, "role" = 'SUPER_ADMIN'::"Role", "name" = 'Super Administrator', "status" = 'Active' WHERE "email" = $2`,
        passwordHash,
        superAdminEmail
      );
      console.log("Updated existing Super Admin user.");
    } else {
      // Insert new superadmin
      await prisma.$executeRawUnsafe(
        `INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "status", "createdAt", "updatedAt") 
         VALUES (gen_random_uuid()::text, 'Super Administrator', $1, $2, 'SUPER_ADMIN'::"Role", 'Active', NOW(), NOW())`,
        superAdminEmail,
        passwordHash
      );
      console.log("Created new Super Admin user: " + superAdminEmail);
    }
  } catch (err) {
    console.error("Setup error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
