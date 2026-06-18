const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { Readable } = require('stream');

async function main() {
  // Parse .env.local manually
  const envRaw = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  const match = envRaw.match(/GOOGLE_SERVICE_ACCOUNT_JSON='([\s\S]+?)'\s*(?:\n|$)/m);
  if (!match) {
    console.error('Could not find GOOGLE_SERVICE_ACCOUNT_JSON in .env.local');
    process.exit(1);
  }

  let credentials;
  try {
    credentials = JSON.parse(match[1]);
    console.log('Parsed credentials OK, client_email:', credentials.client_email);
  } catch (e) {
    console.error('Failed to parse credentials JSON:', e.message);
    process.exit(1);
  }

  const folderId = '1r6dK3x2nSOziER4Te23zHDVyRBOd8EX2';
  console.log('Target folder ID:', folderId);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({ version: 'v3', auth });

  try {
    const buf = Buffer.from('hello from test ' + Date.now());
    const uploaded = await drive.files.create({
      requestBody: {
        name: 'test-' + Date.now() + '.txt',
        parents: [folderId],
      },
      media: {
        mimeType: 'text/plain',
        body: Readable.from(buf),
      },
      fields: 'id, name, webViewLink',
      supportsAllDrives: true,
    });
    console.log('Upload SUCCESS!');
    console.log('  ID:', uploaded.data.id);
    console.log('  Name:', uploaded.data.name);
    console.log('  Link:', uploaded.data.webViewLink);
  } catch (err) {
    console.error('Upload FAILED:', err.message);
    if (err.errors) console.error('API errors:', JSON.stringify(err.errors, null, 2));
    if (err.code) console.error('HTTP code:', err.code);
    if (err.status) console.error('Status:', err.status);
  }
}

main();
