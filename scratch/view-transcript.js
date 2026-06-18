const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const logPath = '/Users/finstein-emp/.gemini/antigravity/brain/cacde720-50aa-410f-99ae-46cf1ba40086/.system_generated/logs/transcript.jsonl';
  const fileStream = fs.createReadStream(logPath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("Searching transcript for any SQL statements...");
  for await (const line of rl) {
    if (line.toLowerCase().includes('sql') || line.toLowerCase().includes('create table') || line.toLowerCase().includes('alter table')) {
      const obj = JSON.parse(line);
      console.log(`\n--- MATCH (step ${obj.step_index}, type ${obj.type}) ---`);
      if (obj.tool_calls) {
        obj.tool_calls.forEach(tc => {
          if (tc.args && tc.args.CodeContent) {
            console.log(tc.args.CodeContent.substring(0, 1000));
          } else if (tc.args && tc.args.CommandLine) {
            console.log(tc.args.CommandLine);
          }
        });
      } else if (obj.content) {
        console.log(obj.content.substring(0, 1000));
      }
    }
  }
}
processLineByLine();
