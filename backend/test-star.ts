import { prisma } from './src/lib/prisma';
async function main() { try { const user = await prisma.user.findFirst(); const doc = await prisma.document.findFirst(); if(user && doc) { console.log('user', user.id, 'doc', doc.id); await prisma.starredDocument.create({data: {userId: user.id, documentId: doc.id}}); console.log('starred'); await prisma.starredDocument.delete({where: {userId_documentId: {userId: user.id, documentId: doc.id}}}); console.log('unstarred'); } } catch (e) { console.error(e); } finally { await prisma.$disconnect(); } }
main();
