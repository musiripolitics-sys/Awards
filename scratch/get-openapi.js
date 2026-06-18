const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  }
});

async function run() {
  const specUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`;
  try {
    const res = await fetch(specUrl);
    const json = await res.json();
    fs.writeFileSync(path.join(__dirname, 'openapi.json'), JSON.stringify(json, null, 2));
    console.log("Wrote openapi.json successfully!");
  } catch (err) {
    console.error("Failed to fetch OpenAPI spec:", err);
  }
}

run();
