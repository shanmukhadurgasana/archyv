import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env";

const pool = new Pool({ connectionString: env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding reference data for documents...");

  // Seed Domains
  const domains = ["Admissions", "Administrative", "Examination", "Placements", "Events", "Academics", "Files"];
  for (const domain of domains) {
    await prisma.domain.upsert({
      where: { name: domain },
      update: {},
      create: { name: domain },
    });
  }
  console.log("✅ Domains seeded");

  // Seed Departments
  const departments = ["CSIT", "CSD", "CSE", "Admissions", "Notices"];
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept },
      update: {},
      create: { name: dept },
    });
  }
  console.log("✅ Departments seeded");

  // Seed Academic Years
  const years = ["2023-24", "2024-25", "2025-26"];
  for (const year of years) {
    await prisma.academicYear.upsert({
      where: { year: year },
      update: {},
      create: { year: year },
    });
  }
  console.log("✅ Academic Years seeded");
}

main()
  .catch((e) => {
    console.error("Error seeding reference data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
