import { prisma } from './src/lib/prisma';
async function main() { try { const res = await prisma.$queryRaw\SELECT column_name FROM information_schema.columns WHERE table_name = 'User';\ ; console.log(res); } catch (e) { console.error(e); } finally { await prisma.$disconnect(); } }
main();
