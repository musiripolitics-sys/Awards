const { createClient } = require('@supabase/supabase-js');
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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const COLUMNS = [
  'id',
  'submittedAt',
  'status',
  'submittedBy',
  'clubName',
  'parentClub',
  'clubNumber',
  'clubType',
  'clubLogo',
  'riDuesPaid',
  'riDuesProof',
  'districtDuesPaid',
  'districtDuesProof',
  'bankAccountActive',
  'bankProofName',
  'accountCreatedMailProof',
  'colourGalataHosted',
  'colourGalataContribution',
  'colourGalataReason',
  'projects',
  'clubSelfEval',
  'clubEvents',
  'clubEventCounts',
  'clubInitiatives',
  'clubRotary',
  'clubOtherRIDE',
  'clubOtherEvents',
  'drcMeetingsAttended',
  'closedDoorMeetingsAttended',
  'drcMeetingsHosted',
  'clubTRFContribution',
  'districtEventsHostedByClub',
  'twinClubAgreement',
  'twinClubAgreementProof',
  'districtOfficialsFromClub',
  'collaredMeetings',
  'clubPhotosLink',
  'socialMediaDesc',
  'socialMediaLinks',
  'bestPracticeDesc',
  'bestPracticePic1',
  'bestPracticePic2',
  'bestPracticePic3',
  'president',
  'secretary',
  'starNominees',
  'declarationName',
  'declarationRole',
  'declarationDate',
  'declared',
  'consentContact'
];

async function run() {
  console.log("Checking individual column existences in 'submissions' table...");
  const results = { exists: [], missing: [], errors: [] };
  
  for (const col of COLUMNS) {
    const { error } = await supabase.from('submissions').select(col).limit(1);
    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        results.missing.push(col);
      } else {
        results.errors.push({ column: col, error });
      }
    } else {
      results.exists.push(col);
    }
  }
  
  console.log("\n--- SCHEMA RESULT ---");
  console.log("EXISTS (", results.exists.length, "):", results.exists.join(', '));
  console.log("MISSING (", results.missing.length, "):", results.missing.join(', '));
  if (results.errors.length > 0) {
    console.log("OTHER ERRORS:", results.errors);
  }
}

run();
