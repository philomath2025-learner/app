const http = require('http');

async function testHearts() {
  console.log("--- Testing Hearts Persistence ---");

  // 1. Set Hearts to 2
  const data = JSON.stringify({
    hearts: 2,
    hearts_refill_at: new Date().toISOString()
  });

  const postReq = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/user/progress',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    }
  }, (res) => {
    console.log('Update Hearts Status:', res.statusCode);
    
    // 2. Verify Hearts are 2
    http.get('http://localhost:3000/api/user/progress', (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const json = JSON.parse(body);
        console.log('Current Hearts in DB:', json.hearts);
        if (json.hearts === 2) {
          console.log('✅ Heart persistence test passed!');
        } else {
          console.log('❌ Heart persistence test failed.');
        }
      });
    });
  });

  postReq.on('error', e => console.error(e));
  postReq.write(data);
  postReq.end();
}

testHearts();
