const http = require('http');

const loginOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(loginOptions, (res) => {
  console.log(`Login Status: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`Login Body: ${data}`);
    
    // Extract cookies
    const setCookie = res.headers['set-cookie'];
    if (!setCookie) {
      console.log('No cookie received. Exiting.');
      return;
    }
    const cookies = setCookie.map(c => c.split(';')[0]).join('; ');
    
    // Create Faculty
    const createOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      }
    };
    
    const createReq = http.request(createOptions, (res2) => {
      console.log(`Create Status: ${res2.statusCode}`);
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        console.log(`Create Body: ${data2}`);
      });
    });
    
    createReq.write(JSON.stringify({
      name: "Test Faculty",
      email: `faculty_${Date.now()}@college.edu`,
      initialPassword: "Password123!",
      department: "CSE",
      phone: "1234567890",
      facultyId: `FAC-${Date.now()}`
    }));
    createReq.end();
  });
});

req.write(JSON.stringify({
  email: 'admin@archyv.edu',
  password: 'SecurePassword123!'
}));
req.end();
