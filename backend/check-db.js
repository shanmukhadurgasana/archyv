const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_2gN4sLHwnSim@ep-late-flower-a5eawtqv-pooler.us-east-2.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
  console.log("Domains:");
  const domains = await prisma.domain.findMany({ include: { subdomains: true } });
  console.log(JSON.stringify(domains, null, 2));

  console.log("Departments:");
  const depts = await prisma.department.findMany();
  console.log(JSON.stringify(depts, null, 2));
}

test().catch(console.error).finally(() => prisma.$disconnect());
