const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Let's get list of commits
  const commits = execSync('git log --format="%H"').toString().trim().split('\n');
  const initialCommit = commits[commits.length - 1];
  console.log("Initial commit:", initialCommit);
  
  // Show NominationForm.tsx from initial commit
  const content = execSync(`git show ${initialCommit}:src/app/nominate/NominationForm.tsx`).toString();
  
  // Let's search for keys in EMPTY or keys in the submit payload
  console.log("Checking if happyMomentDesc is present in the initial commit...");
  const hasHappy = content.includes("happyMomentDesc") || content.includes("happyMoment");
  console.log("happyMomentDesc present:", hasHappy);
  
  if (hasHappy) {
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes("happyMoment")) {
        console.log(`Line ${idx + 1}: ${line}`);
      }
    });
  } else {
    console.log("Not present in initial commit of src/app/nominate/NominationForm.tsx");
  }
} catch (err) {
  console.error("Error running script:", err);
}
