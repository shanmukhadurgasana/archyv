const http = require('http');

async function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
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
    if (postData) req.write(postData);
    req.end();
  });
}

function getCookies(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return '';
  return setCookie.map(c => c.split(';')[0]).join('; ');
}

async function runAudit() {
  console.log('--- ADMIN LOGIN ---');
  let res = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: 'admin@archyv.edu', password: 'SecurePassword123!' }));
  console.log(`Admin Login Status: ${res.statusCode}`);
  const adminCookie = getCookies(res.headers);

  console.log('\n--- ADMIN /ME ---');
  res = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/auth/me', method: 'GET',
    headers: { 'Cookie': adminCookie }
  });
  console.log(`Admin /me Status: ${res.statusCode}`);

  console.log('\n--- ADMIN CREATE FACULTY ---');
  res = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/users', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie }
  }, JSON.stringify({
    name: "Audit Faculty",
    email: `audit_${Date.now()}@college.edu`,
    initialPassword: "Password123!",
    department: "CSE",
    facultyId: `FAC-AUDIT-${Date.now()}`
  }));
  console.log(`Admin Create Faculty Status: ${res.statusCode}`);
  const createdFaculty = JSON.parse(res.body).user;
  
  console.log('\n--- ADMIN FETCH USERS (PROTECTED) ---');
  res = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/users', method: 'GET',
    headers: { 'Cookie': adminCookie }
  });
  console.log(`Admin /users Status: ${res.statusCode}`);

  console.log('\n--- ADMIN LOGOUT ---');
  res = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/auth/logout', method: 'POST',
    headers: { 'Cookie': adminCookie }
  });
  console.log(`Admin Logout Status: ${res.statusCode}`);
  const clearedCookie = getCookies(res.headers) || adminCookie;

  console.log('\n--- /ME AFTER LOGOUT ---');
  res = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/auth/me', method: 'GET',
    headers: { 'Cookie': clearedCookie }
  });
  console.log(`After Logout /me Status: ${res.statusCode}`);

  console.log('\n--- FACULTY LOGIN ---');
  res = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: createdFaculty.email, password: 'Password123!' }));
  console.log(`Faculty Login Status: ${res.statusCode}`);
  const facultyCookie = getCookies(res.headers);

  console.log('\n--- FACULTY ATTEMPTING ADMIN API ---');
  res = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/users', method: 'GET',
    headers: { 'Cookie': facultyCookie }
  });
  console.log(`Faculty -> /users Status: ${res.statusCode}`);
}

runAudit();
