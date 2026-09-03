const http = require('http');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function makeRequest(options, postData = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const mergedHeaders = { ...options.headers, ...headers };
    const reqOptions = { ...options, headers: mergedHeaders };
    
    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    
    if (postData && postData.pipe) {
      postData.pipe(req);
    } else if (postData) {
      req.write(postData);
      req.end();
    } else {
      req.end();
    }
  });
}

function getCookies(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return '';
  return setCookie.map(c => c.split(';')[0]).join('; ');
}

async function runAudit() {
  const results = {};

  console.log('TEST 1 - BACKEND HEALTH');
  let res = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  console.log(`Health Status: ${res.statusCode}, Body: ${res.body}`);
  results.health = res.statusCode === 200 && res.body.includes('ok');

  console.log('\nTEST 2 - CLOUDINARY CONFIG');
  const hasCloudName = !!process.env.CLOUDINARY_CLOUD_NAME;
  const hasApiKey = !!process.env.CLOUDINARY_API_KEY;
  const hasApiSecret = !!process.env.CLOUDINARY_API_SECRET;
  console.log(`Cloud Name: ${hasCloudName}, API Key: ${hasApiKey}, API Secret: ${hasApiSecret}`);
  results.config = hasCloudName && hasApiKey && hasApiSecret;

  console.log('\nTEST 3 - UNAUTHENTICATED UPLOAD');
  const testFilePath = path.join(__dirname, 'phase4-test.txt');
  fs.writeFileSync(testFilePath, 'Phase 4 verification test.');
  const form1 = new FormData();
  form1.append('file', fs.createReadStream(testFilePath));
  res = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/storage/test-upload', method: 'POST' }, form1, form1.getHeaders());
  console.log(`Unauth Upload Status: ${res.statusCode}`);
  results.unauth = res.statusCode === 401;

  console.log('\nTEST 4 - UNAUTHORIZED ROLE (FACULTY)');
  
  // First login as Admin to create a fresh Faculty
  res = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: 'admin@archyv.edu', password: 'SecurePassword123!' }));
  const adminCookieForSetup = getCookies(res.headers);
  
  // Create a Faculty
  const tempFacultyEmail = `faculty_${Date.now()}@college.edu`;
  await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/users', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookieForSetup }
  }, JSON.stringify({ name: "Audit", email: tempFacultyEmail, initialPassword: "Password123!" }));

  // Log in as the new Faculty
  res = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: tempFacultyEmail, password: 'Password123!' }));
  const facultyCookie = getCookies(res.headers);
  
  const form2 = new FormData();
  form2.append('file', fs.createReadStream(testFilePath));
  res = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/storage/test-upload', method: 'POST' }, form2, { 'Cookie': facultyCookie, ...form2.getHeaders() });
  console.log(`Faculty Upload Status: ${res.statusCode}`);
  results.unauthRole = res.statusCode === 403;

  console.log('\nTEST 5 & 6 - ADMIN UPLOAD');
  res = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: 'admin@archyv.edu', password: 'SecurePassword123!' }));
  const adminCookie = getCookies(res.headers);
  
  const form3 = new FormData();
  form3.append('file', fs.createReadStream(testFilePath));
  res = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/storage/test-upload', method: 'POST' }, form3, { 'Cookie': adminCookie, ...form3.getHeaders() });
  console.log(`Admin Upload Status: ${res.statusCode}, Body: ${res.body}`);
  results.upload = res.statusCode === 201 && JSON.parse(res.body).success;
  
  let publicId = null;
  if (results.upload) {
    publicId = JSON.parse(res.body).file.publicId;
  }
  
  console.log('\nTEST 7 & 8 - ADMIN DELETE');
  if (publicId) {
    const encodedId = encodeURIComponent(publicId);
    res = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/storage/test-upload/${encodedId}`, method: 'DELETE', headers: { 'Cookie': adminCookie } });
    console.log(`Admin Delete Status: ${res.statusCode}, Body: ${res.body}`);
    results.delete = res.statusCode === 200 && JSON.parse(res.body).success;
  } else {
    results.delete = false;
  }

  console.log('\nTEST 9 - DATABASE SAFETY');
  const documents = await prisma.document.findMany();
  console.log(`Total documents in DB: ${documents.length}`);
  results.dbSafe = documents.length === 0;

  fs.unlinkSync(testFilePath);
  await prisma.$disconnect();
  
  console.log('\n--- VERIFICATION RESULTS ---');
  console.log(JSON.stringify(results, null, 2));
}

runAudit().catch(console.error);
