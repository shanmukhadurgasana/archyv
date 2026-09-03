import { prisma } from './src/lib/prisma';
async function main() { try { const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } }); const newUser = await prisma.user.create({ data: { facultyId: 'fac-' + Date.now(), name: 'Test', email: 'test' + Date.now() + '@test.com', phone: null, departmentId: null, dateOfJoin: null, status: 'Active', passwordHash: 'hash', role: 'FACULTY', adminId: adminUser ? adminUser.id : null } }); console.log('success', newUser.id); } catch (e) { console.error(e); } finally { await prisma.$disconnect(); } }
main();
