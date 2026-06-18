const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log("Discovering NOT NULL constraints in 'submissions' table...");
  
  // Start with a clean/minimal payload
  const testId = "DISCOVER-" + Date.now().toString(36).toUpperCase();
  const payload = {
    id: testId,
    submittedAt: new Date().toISOString()
  };
  
  const discovered = [];
  let success = false;
  
  for (let i = 0; i < 50; i++) {
    const { error } = await supabase.from('submissions').insert([payload]);
    if (!error) {
      console.log(`\nSuccessfully inserted discovery row with payload:`, payload);
      success = true;
      // Clean it up
      await supabase.from('submissions').delete().eq('id', testId);
      break;
    }
    
    // Check if it's a NOT NULL violation
    // Postgres error code for NOT NULL violation is 23502
    if (error.code === '23502') {
      const match = error.message.match(/column "([^"]+)"/);
      if (match) {
        const columnName = match[1];
        console.log(`Found NOT NULL constraint on column: "${columnName}"`);
        discovered.push(columnName);
        
        // Add dummy value to payload based on typical types
        // Let's check typical names or use default fallback value
        if (columnName.toLowerCase().includes('count')) {
          payload[columnName] = {};
        } else if (columnName === 'declared' || columnName === 'consentContact') {
          payload[columnName] = false;
        } else {
          payload[columnName] = "";
        }
      } else {
        console.log("Not null violation but column name not parsed:", error.message);
        break;
      }
    } else {
      console.log("Different database error encountered:", error);
      break;
    }
  }
  
  console.log("\n--- DISCOVERY COMPLETED ---");
  console.log("All discovered NOT NULL columns:", discovered);
}

run();
