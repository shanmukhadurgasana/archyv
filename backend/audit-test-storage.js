const http = require('http');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

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

async function runStorageTest() {
  console.log('--- ADMIN LOGIN ---');
  let res = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: 'admin@archyv.edu', password: 'SecurePassword123!' }));
  console.log(`Admin Login Status: ${res.statusCode}`);
  const adminCookie = getCookies(res.headers);

  console.log('\n--- CREATE TEST FILE ---');
  const testFilePath = path.join(__dirname, 'test-document.txt');
  fs.writeFileSync(testFilePath, 'This is a test document for Cloudinary upload validation.');
  console.log('Test file created.');

  console.log('\n--- UPLOAD TEST FILE (AUTHENTICATED) ---');
  const form = new FormData();
  form.append('file', fs.createReadStream(testFilePath));

  res = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/storage/test-upload', method: 'POST',
  }, form, { 'Cookie': adminCookie, ...form.getHeaders() });
  
  console.log(`Upload Status: ${res.statusCode}`);
  console.log(`Upload Body: ${res.body}`);

  const uploadResult = JSON.parse(res.body);
  
  if (uploadResult.success) {
    const publicId = uploadResult.file.publicId;
    console.log(`\n--- DELETE TEST FILE (${publicId}) ---`);
    
    // We must properly encode the publicId for the URL route parameters
    const encodedId = encodeURIComponent(publicId);
    
    res = await makeRequest({
      hostname: 'localhost', port: 5000, path: `/api/storage/test-upload/${encodedId}`, method: 'DELETE',
      headers: { 'Cookie': adminCookie }
    });
    
    console.log(`Delete Status: ${res.statusCode}`);
    console.log(`Delete Body: ${res.body}`);
  }

  console.log('\n--- UNAUTHENTICATED UPLOAD TEST ---');
  const form2 = new FormData();
  form2.append('file', fs.createReadStream(testFilePath));
  res = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/storage/test-upload', method: 'POST',
  }, form2, form2.getHeaders());
  console.log(`Unauthenticated Upload Status: ${res.statusCode}`); // Expected 401
  
  fs.unlinkSync(testFilePath);
}

runStorageTest().catch(console.error);
