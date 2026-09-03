import { prisma } from './src/lib/prisma';
async function main() { try { const stars = await prisma.starredDocument.findMany({ include: { user: true, document: true } }); console.log(stars.length, 'total starred documents'); if (stars.length > 0) { console.log(stars.slice(0, 5)); } } catch (e) { console.error(e); } finally { await prisma.$disconnect(); } }
main();
