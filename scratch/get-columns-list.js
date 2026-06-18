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
  const { data, error } = await supabase.from('submissions').select('*');
  if (error) {
    console.error("Error fetching submissions:", error);
  } else {
    console.log("Submissions count:", data.length);
    if (data.length > 0) {
      console.log("Columns present in returned data:");
      console.log(Object.keys(data[0]).sort());
    } else {
      console.log("No submissions exist in the table. Trying to find columns via dummy query...");
      // Let's try to query with an empty filter to see if we can get anything
      console.log("Data is empty");
    }
  }
}
run();
