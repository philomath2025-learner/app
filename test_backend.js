const http = require('http');

const data = JSON.stringify({
  ayahKey: "1:1",
  position: 1,
  arabic: "بِسْمِ",
  root: "س م و",
  lemma: "بِسْمِ",
  pos: "noun"
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/lesson/progress',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    // We can't easily mock the JWT cookie without a real token...
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('POST Response:', res.statusCode, body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
