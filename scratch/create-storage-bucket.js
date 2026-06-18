// Create the 'uploads' bucket in Supabase Storage
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log("Checking existing buckets...");
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error("Error listing buckets:", listErr.message);
    console.log("\nNote: You may need to create the bucket manually in Supabase Dashboard:");
    console.log("  1. Go to https://supabase.com/dashboard → your project → Storage");
    console.log("  2. Click 'New bucket'");
    console.log("  3. Name it 'uploads'");
    console.log("  4. Check 'Public bucket'");
    console.log("  5. Set file size limit to 20MB");
    console.log("  6. Click 'Create bucket'");
    return;
  }
  
  console.log("Existing buckets:", buckets?.map(b => b.name) || []);
  
  const exists = buckets?.some(b => b.name === 'uploads');
  if (exists) {
    console.log("'uploads' bucket already exists!");
    return;
  }
  
  console.log("Creating 'uploads' bucket...");
  const { data, error } = await supabase.storage.createBucket('uploads', {
    public: true,
    fileSizeLimit: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: ['image/*', 'application/pdf'],
  });
  
  if (error) {
    console.error("Error creating bucket:", error.message);
    console.log("\nYou may need to create it manually in Supabase Dashboard:");
    console.log("  1. Go to https://supabase.com/dashboard → your project → Storage");
    console.log("  2. Click 'New bucket'");
    console.log("  3. Name it 'uploads'");
    console.log("  4. Check 'Public bucket'");
    console.log("  5. Set file size limit to 20MB");
    console.log("  6. Click 'Create bucket'");
  } else {
    console.log("Successfully created 'uploads' bucket!", data);
  }
}

run();
