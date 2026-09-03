import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";

async function main() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = env;

  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("❌ Missing required Admin environment variables in .env");
    process.exit(1);
  }

  // Check if an admin already exists by email
  const existingAdminByEmail = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existingAdminByEmail) {
    console.log(`✅ Admin with email ${ADMIN_EMAIL} already exists.`);
    return;
  }

  // Hash the password securely
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  // Create the Admin user
  const adminUser = await prisma.user.create({
    data: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash,
      role: Role.ADMIN,
      status: "Active",
    },
  });

  console.log(`✅ Successfully seeded Admin user: ${adminUser.email}`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding Admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
