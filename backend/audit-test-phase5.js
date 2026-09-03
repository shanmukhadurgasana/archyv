const http = require('http');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

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
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
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

async function runTests() {
  const results = {};
  console.log('--- ADMIN LOGIN ---');
  let res = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: 'admin@archyv.edu', password: 'SecurePassword123!' }));
  const adminCookie = getCookies(res.headers);
  console.log(`Login Status: ${res.statusCode}`);
  
  console.log('\n--- UPLOAD REAL DOCUMENT ---');
  const testFilePath = path.join(__dirname, 'phase5-test.txt');
  fs.writeFileSync(testFilePath, 'Phase 5 real document test.');
  
  const form = new FormData();
  form.append('file', fs.createReadStream(testFilePath));
  form.append('name', 'Test Document 123');
  form.append('domain', 'Admissions');
  form.append('department', 'CSD');
  form.append('academicYear', '2023-24');
  
  res = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/documents', method: 'POST' }, form, { 'Cookie': adminCookie, ...form.getHeaders() });
  console.log(`Upload Status: ${res.statusCode}`);
  const uploadBody = JSON.parse(res.body);
  console.log(uploadBody);
  results.upload = res.statusCode === 201 && uploadBody.success;
  
  const documentId = uploadBody.document?.id;
  
  if (documentId) {
    console.log('\n--- GET ALL DOCUMENTS ---');
    res = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/documents', method: 'GET', headers: { 'Cookie': adminCookie } });
    console.log(`Get All Status: ${res.statusCode}`);
    const getBody = JSON.parse(res.body);
    results.getAll = res.statusCode === 200 && getBody.documents?.length > 0;
    
    console.log('\n--- SEARCH DOCUMENTS ---');
    res = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/documents?search=Test%20Document', method: 'GET', headers: { 'Cookie': adminCookie } });
    console.log(`Search Status: ${res.statusCode}`);
    const searchBody = JSON.parse(res.body);
    results.search = res.statusCode === 200 && searchBody.documents?.length > 0;
    
    console.log('\n--- GET SINGLE DOCUMENT ---');
    res = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/documents/${documentId}`, method: 'GET', headers: { 'Cookie': adminCookie } });
    console.log(`Get Single Status: ${res.statusCode}`);
    results.getSingle = res.statusCode === 200 && JSON.parse(res.body).document?.id === documentId;
    
    console.log('\n--- STAR DOCUMENT ---');
    res = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/documents/${documentId}/star`, method: 'POST', headers: { 'Cookie': adminCookie } });
    console.log(`Star Status: ${res.statusCode}`);
    results.star = res.statusCode === 200;
    
    console.log('\n--- GET ALL DOCUMENTS (CHECK STAR) ---');
    res = await makeRequest({ hostname: 'localhost', port: 5000, path: '/api/documents', method: 'GET', headers: { 'Cookie': adminCookie } });
    const docsAfterStar = JSON.parse(res.body).documents;
    const starredDoc = docsAfterStar.find(d => d.id === documentId);
    console.log(`Is Starred in list: ${starredDoc?.isStarred}`);
    results.starVisible = starredDoc?.isStarred === true;
    
    console.log('\n--- UNSTAR DOCUMENT ---');
    res = await makeRequest({ hostname: 'localhost', port: 5000, path: `/api/documents/${documentId}/star`, method: 'DELETE', headers: { 'Cookie': adminCookie } });
    console.log(`Unstar Status: ${res.statusCode}`);
    results.unstar = res.statusCode === 200;
  }
  
  fs.unlinkSync(testFilePath);
  await prisma.$disconnect();
  console.log('\n--- RESULTS ---');
  console.log(results);
}

runTests().catch(console.error);
