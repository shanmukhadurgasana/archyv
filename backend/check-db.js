const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Domains:', await prisma.domain.findMany());
  console.log('Departments:', await prisma.department.findMany());
  console.log('AcademicYears:', await prisma.academicYear.findMany());
}

main().finally(() => prisma.$disconnect());
