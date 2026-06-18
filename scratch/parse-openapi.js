const fs = require('fs');
const path = require('path');

const openapi = JSON.parse(fs.readFileSync(path.join(__dirname, 'openapi.json'), 'utf8'));

// Print all keys in openapi
console.log("OpenAPI keys:", Object.keys(openapi));

if (openapi.definitions) {
  const subKey = Object.keys(openapi.definitions).find(k => k.toLowerCase().includes('submission'));
  if (subKey) {
    console.log(`\nProperties of definition "${subKey}":`);
    const props = openapi.definitions[subKey].properties || {};
    const required = openapi.definitions[subKey].required || [];
    console.log("Required properties:", required);
    for (const [propName, propVal] of Object.entries(props)) {
      console.log(` - ${propName}: type=${propVal.type}, format=${propVal.format}, description=${propVal.description || ''}`);
    }
  } else {
    console.log("No definition matching 'submission' found.");
  }
} else {
  console.log("No definitions found in OpenAPI spec.");
}
