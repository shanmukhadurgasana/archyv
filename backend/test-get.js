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
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const setCookie = res.headers['set-cookie'];
    if (!setCookie) return console.log('No cookie');
    const cookies = setCookie.map(c => c.split(';')[0]).join('; ');
    
    const getOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/users',
      method: 'GET',
      headers: {
        'Cookie': cookies
      }
    };
    
    const getReq = http.request(getOptions, (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        console.log(`Users: ${data2}`);
      });
    });
    getReq.end();
  });
});

req.write(JSON.stringify({
  email: 'admin@archyv.edu',
  password: 'SecurePassword123!'
}));
req.end();
