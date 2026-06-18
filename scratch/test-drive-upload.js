// Quick test to verify Google Drive upload works after enabling the API

const http = require('http');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  console.log("Testing Google Drive upload via /api/upload...");
  
  // Create a small test PNG file
  const testFilePath = path.join(__dirname, 'test-drive.png');
  // A minimal valid PNG (1x1 pixel, red)
  const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.writeFileSync(testFilePath, pngBuffer);

  // Build multipart form data manually
  const boundary = '----FormBoundary' + Date.now();
  const fileContent = fs.readFileSync(testFilePath);
  
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="file"; filename="test-drive-upload.png"\r\n`),
    Buffer.from(`Content-Type: image/png\r\n\r\n`),
    fileContent,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log("Response:", JSON.stringify(json, null, 2));
          
          if (json.url && json.url.includes('drive.google.com')) {
            console.log("\n✅ SUCCESS! File uploaded to Google Drive!");
            console.log("   URL:", json.url);
          } else if (json.url && json.url.startsWith('/uploads/')) {
            console.log("\n⚠️  File saved to LOCAL fallback (Google Drive API may still be propagating)");
            console.log("   Local URL:", json.url);
          } else {
            console.log("\n❌ Unexpected response");
          }
        } catch (e) {
          console.log("Raw response:", data);
        }
        resolve();
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

testUpload().catch(console.error);
