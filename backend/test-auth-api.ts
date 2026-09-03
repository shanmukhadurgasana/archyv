const http = require('http');
async function test() {
  try {
    const { prisma } = require('./src/lib/prisma');
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: admin.email, password: 'password123' })
    });
    const cookies = loginRes.headers.get('set-cookie');
    console.log('Login status:', loginRes.status);
    
    const docRes = await fetch('http://localhost:5000/api/documents?isStarred=true', {
      headers: cookies ? { 'cookie': cookies } : {}
    });
    const data = await docRes.json();
    console.log('Starred docs count:', data.documents ? data.documents.length : 0);
    if(data.documents) {
      console.log(data.documents.map((d: any) => ({ name: d.name, isStarred: d.isStarred })));
    }
  } catch(e) { console.error(e); }
}
test();
