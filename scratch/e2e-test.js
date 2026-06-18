const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

let browser;
let page;

async function run() {
  console.log("Starting E2E Testing Script...");
  
  // 1. Create dummy files
  const scratchDir = __dirname;
  const dummyPngPath = path.join(scratchDir, 'dummy.png');
  const dummyPdfPath = path.join(scratchDir, 'dummy.pdf');
  
  fs.writeFileSync(dummyPngPath, 'fake png content');
  fs.writeFileSync(dummyPdfPath, 'fake pdf content');
  console.log(`Created dummy files at:\n - ${dummyPngPath}\n - ${dummyPdfPath}`);

  // 2. Launch Puppeteer
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  page = await browser.newPage();
  
  // Capture page console logs
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  // Capture page errors
  page.on('pageerror', err => {
    console.error(`[BROWSER ERROR] ${err.toString()}`);
  });

  const url = 'http://localhost:3000';

  // Helper delays
  const delay = ms => new Promise(res => setTimeout(res, ms));

  // Helper to click button by text
  async function clickButtonByText(txt) {
    console.log(`Clicking button/link with text "${txt}"...`);
    const clicked = await page.evaluate((t) => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      let target = buttons.find(b => b.textContent.trim() === t);
      if (!target) {
        target = buttons.find(b => b.textContent.includes(t));
      }
      if (target) {
        target.click();
        return true;
      }
      return false;
    }, txt);
    if (!clicked) {
      throw new Error(`Button/link with text "${txt}" not found`);
    }
  }

  // Helper to find the parent container of an input/toggle/file upload by label
  async function findParentByLabel(labelText) {
    const handle = await page.evaluateHandle((lbl) => {
      const elements = Array.from(document.querySelectorAll('label, .input-label, span, div, p'));
      let target = elements.find(el => (el.tagName === 'LABEL' || el.classList.contains('input-label')) && el.textContent.includes(lbl));
      if (!target) {
        target = elements.find(el => el.textContent.includes(lbl));
      }
      if (!target) return null;
      
      let parent = target;
      for (let i = 0; i < 5; i++) {
        if (!parent) break;
        if (parent.querySelector('input, textarea, select, button')) {
          return parent;
        }
        parent = parent.parentElement;
      }
      return target.parentElement || target;
    }, labelText);

    const isNull = await page.evaluate(h => h === null, handle);
    if (isNull) {
      await handle.dispose();
      return null;
    }
    return handle;
  }

  // Helper to fill input by label
  async function fillInputByLabel(labelText, value) {
    const parent = await findParentByLabel(labelText);
    if (!parent) throw new Error(`Label "${labelText}" not found`);
    const filled = await parent.evaluate((p, val) => {
      const input = p.querySelector('input, textarea, select');
      if (input) {
        const prototype = Object.getPrototypeOf(input);
        const setVal = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
        if (setVal) {
          setVal.call(input, val);
        } else {
          input.value = val;
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }, value);
    if (!filled) {
      throw new Error(`Input for label "${labelText}" not found or failed to fill`);
    }
  }

  // Helper to click toggle by label
  async function clickToggleByLabel(labelText, valueText) {
    const parent = await findParentByLabel(labelText);
    if (!parent) throw new Error(`Label "${labelText}" not found`);
    const clicked = await parent.evaluate((p, val) => {
      const buttons = Array.from(p.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes(val));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    }, valueText);
    if (!clicked) {
      throw new Error(`Toggle "${valueText}" for label "${labelText}" not found`);
    }
  }

  // Helper to upload file by label
  async function uploadFileByLabel(labelText, filePath) {
    console.log(`Uploading file for label "${labelText}"...`);
    const parent = await findParentByLabel(labelText);
    if (!parent) throw new Error(`Label "${labelText}" not found`);
    
    const found = await parent.evaluate((p) => {
      const fileInput = p.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.id = 'temp-file-input';
        return true;
      }
      return false;
    });

    if (!found) {
      throw new Error(`File input container for label "${labelText}" not found`);
    }

    const fileInput = await page.$('#temp-file-input');
    await fileInput.uploadFile(filePath);
    
    await page.evaluate(() => {
      const el = document.getElementById('temp-file-input');
      if (el) el.removeAttribute('id');
    });

    // Wait for the upload text to display 'Uploaded' or 'CHANGE'
    console.log(`Waiting for upload to finish for "${labelText}"...`);
    await page.waitForFunction((p) => {
      return p.textContent.includes('Uploaded') || p.textContent.includes('CHANGE');
    }, { timeout: 25000 }, parent);
    console.log(`Upload complete for "${labelText}".`);
  }

  // Helper to fill multiple inputs (like nominee names/evals)
  async function fillAllInputsByLabel(labelText, values) {
    const filled = await page.evaluate((lbl, vals) => {
      const elements = Array.from(document.querySelectorAll('label, .input-label, span, div, p'));
      const targets = elements.filter(el => (el.tagName === 'LABEL' || el.classList.contains('input-label')) && el.textContent.includes(lbl));
      let filledCount = 0;
      vals.forEach((val, idx) => {
        const target = targets[idx];
        if (!target) return;
        let parent = target;
        for (let i = 0; i < 5; i++) {
          if (!parent) break;
          const input = parent.querySelector('input, textarea, select');
          if (input) {
            const prototype = Object.getPrototypeOf(input);
            const setVal = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
            if (setVal) {
              setVal.call(input, val);
            } else {
              input.value = val;
            }
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            filledCount++;
            break;
          }
          parent = parent.parentElement;
        }
      });
      return filledCount === vals.length;
    }, labelText, values);
    if (!filled) {
      throw new Error(`Failed to fill all inputs for label "${labelText}" with values [${values.join(', ')}]`);
    }
  }

  async function toggleProjectNomination() {
    console.log("Ensuring project nomination switch is enabled...");
    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const txtSpan = spans.find(s => s.textContent.trim() === 'Nominate in this category');
      if (!txtSpan) throw new Error("Could not find 'Nominate in this category' span");
      const parent = txtSpan.parentElement;
      if (!parent) throw new Error("Could not find parent container");
      const switchSpan = parent.querySelector('span.relative');
      if (!switchSpan) throw new Error("Could not find switch span");
      
      const isCurrentlyActive = switchSpan.className.includes('bg-[#d6ba73]');
      if (!isCurrentlyActive) {
        console.log("Switch is currently disabled. Clicking to enable.");
        switchSpan.click();
      } else {
        console.log("Switch is already enabled. No click needed.");
      }
    });
    await delay(1000);
  }

  // Test Case 1: Submit Nomination (username - details)
  async function submitNomination(username, password, details) {
    console.log(`\n==================================================`);
    console.log(`SUBMITTING NOMINATION FOR: ${username}`);
    console.log(`==================================================`);
    
    // Clear cookies/localStorage/sessionStorage and go to nominate
    await page.goto(url + '/nominate');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(url + '/nominate');
    
    await page.waitForSelector('input[placeholder="e.g. mssw.rotaract"]');
    
    // Fill login credentials
    await page.type('input[placeholder="e.g. mssw.rotaract"]', username);
    await page.type('input[placeholder="••••••••"]', password);
    await clickButtonByText('Authenticate & Continue →');
    
    // Wait for the IdentitySection to load
    await page.waitForSelector('input[placeholder="Rotary Club of ____"]');
    console.log(`Login successful for ${username}. Form loaded.`);

    // 1. Identity step
    await fillInputByLabel('Parent Club Name', details.parentClub);
    await fillInputByLabel('Club Number', details.clubNumber);
    await clickToggleByLabel('Club Type', details.clubType === 'college' ? 'College-based Club' : 'Community-based Club');
    await uploadFileByLabel('Upload Club Logo', dummyPngPath);
    await clickButtonByText('Continue →');
    await delay(1000);

    // 2. Docs step
    console.log("Filling Docs Section...");
    await clickToggleByLabel('RI Dues paid', 'Yes');
    await uploadFileByLabel('Upload RI Dues payment proof', dummyPdfPath);
    await clickToggleByLabel('District Dues paid', 'Yes');
    await uploadFileByLabel('Upload District Dues payment proof', dummyPdfPath);
    
    if (details.clubType === 'community') {
      await clickToggleByLabel('Does your club have an active bank account', 'Yes');
      await uploadFileByLabel('Upload proof of an active bank account', dummyPdfPath);
      await uploadFileByLabel('Upload Account Created Mail', dummyPdfPath);
      await clickToggleByLabel('Did your club host / participate in Colour Galata', 'Yes');
      await fillInputByLabel('How much did your club contribute', 'Host sponsor with 10 volunteers.');
    }
    
    await clickButtonByText('Continue →');
    await delay(1000);

    // 3. Project steps (14 steps - just skip by clicking Continue)
    console.log("Skipping 14 Project sections...");
    for (let pIdx = 0; pIdx < 14; pIdx++) {
      await clickButtonByText('Continue →');
      await delay(200);
    }
    await delay(1000);

    // 4. Club Award nomination
    console.log("Filling Club Award Nomination...");
    await fillInputByLabel('Club Performance Self-Evaluation', 'We achieved deep fellowship, 100% dues clearance and exceptional support of all district events.');
    await fillInputByLabel('District Rotaract Council Meetings Attended', '5');
    await fillInputByLabel('Close Door Meetings Attended', '4');
    await fillInputByLabel('District Rotaract Council Meetings Hosted', 'No');
    await fillInputByLabel('Contribution to TRF', '50');
    await fillInputByLabel('District Events Hosted', 'No');
    await clickToggleByLabel('Twin / Sister Club agreement', 'No');
    await fillInputByLabel('Number of District Officials', '2');
    await fillInputByLabel('Number of Collared Meetings', '10');
    await fillInputByLabel('Submission of Supporting Photographs', 'https://drive.google.com/test-photos');
    await clickButtonByText('Continue →');
    await delay(1000);

    // 5. Social Media
    console.log("Filling Social Media section...");
    await fillInputByLabel('Social media effectiveness and innovation', 'Weekly reels and daily updates, with high organic engagement.');
    await fillInputByLabel('Links to social media pages', 'https://instagram.com/test-sm');
    await clickButtonByText('Continue →');
    await delay(1000);

    // 6. Practice Award
    console.log("Filling Practice Award section...");
    await fillInputByLabel('A best practice for club performance and quality', 'Implemented custom QR code attendance tracking for fellowship events.');
    await clickButtonByText('Continue →');
    await delay(1000);

    // 7. President
    console.log("Filling President section...");
    await fillInputByLabel("President's Full Name", details.presidentName);
    await fillInputByLabel('Self-Evaluation of Performance', 'Fostered high fellowship and led the club to accomplish all goals.');
    await fillInputByLabel('Key Contributions and Impact', 'Introduced new service partners.');
    await fillInputByLabel('Leadership, Commitment and Support', 'Attended all district level meets.');
    await fillInputByLabel('Biggest Challenge You Faced This Year as President', 'Academics and service workload balancing.');
    await fillInputByLabel('District Rotaract Council Meetings Attended', '6');
    await fillInputByLabel('Close Door Meetings Attended', '5');
    await fillInputByLabel('Contribution to TRF during 2025-26', '10');
    await fillInputByLabel('Nominee 1', 'Rtr. Alice Brown · GRR');
    await fillInputByLabel('Submission of Supporting Photographs', 'https://drive.google.com/test-pres');
    await clickButtonByText('Continue →');
    await delay(1000);

    // 8. Secretary
    console.log("Filling Secretary section...");
    await fillInputByLabel("Secretary's Full Name", details.secretaryName);
    await fillInputByLabel('Overall Performance and Responsibilities', 'Detailed minutes and reporting completed consistently.');
    await fillInputByLabel('Efficiency and Contribution', 'Streamlined reports flow.');
    await fillInputByLabel('Consistency and Support', 'Supported the president in all meetings.');
    await fillInputByLabel('Biggest Challenge You Faced This Year as Secretary', 'Meeting timelines.');
    await fillInputByLabel('District Rotaract Council Meetings Attended', '5');
    await fillInputByLabel('Close Door Meetings Attended', '4');
    await fillInputByLabel('Contribution to TRF during 2025-26', '0');
    await fillInputByLabel('Nominee 1', 'Rtr. Bob Green · GRS');
    await fillInputByLabel('Submission of Supporting Photographs', 'https://drive.google.com/test-sec');
    await clickButtonByText('Continue →');
    await delay(1000);

    // 9. Star of Rotaract
    console.log("Filling Star of Rotaract section...");
    await fillAllInputsByLabel('Name of the Nominee', ['Rtr. Star One', 'Rtr. Star Two']);
    await fillAllInputsByLabel('Star of Rotaract nomination & evaluation', [
      'Volunteered for every single community initiative.',
      'Outstanding graphic design lead this year.'
    ]);
    await clickButtonByText('Continue →');
    await delay(1000);

    // 10. Declaration & Submit
    console.log("Submitting Nomination...");
    await fillInputByLabel('Sign with your full name', 'Rtr. Authorized Officer');
    await fillInputByLabel('Role in the club', 'President');
    await fillInputByLabel('Date', '2026-06-18');
    
    // Check all checkboxes
    await page.evaluate(() => {
      const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      checkboxes.forEach(cb => { if (!cb.checked) cb.click(); });
    });
    
    await clickButtonByText('Nomination ✓');
    
    // Wait for thank you card
    await page.waitForFunction(() => document.body.textContent.includes('A story worth standing for.'), { timeout: 20000 });
    console.log(`Nomination submission SUCCESSFUL for ${username}!`);
  }

  // Submit 3 full nominations
  // Nomination 1: mssw.rotaract (College)
  await submitNomination('mssw.rotaract', 'K9#fA7$wQ2', {
    parentClub: 'Rotary Club of Madras South',
    clubNumber: '12345',
    clubType: 'college',
    presidentName: 'Rtr. Dev President 1',
    secretaryName: 'Rtr. Dev Secretary 1'
  });

  // Nomination 2: zenith.rotaract (Community)
  await submitNomination('zenith.rotaract', 'vB5!xZ9*pT', {
    parentClub: 'Rotary Club of Chennai Zenith',
    clubNumber: '67890',
    clubType: 'community',
    presidentName: 'Rtr. Dev President 2',
    secretaryName: 'Rtr. Dev Secretary 2'
  });

  // Nomination 3: licet.rotaract (College)
  await submitNomination('licet.rotaract', 'mN3$uV8%rE', {
    parentClub: 'Rotary Club of Madras Mount',
    clubNumber: '54321',
    clubType: 'college',
    presidentName: 'Rtr. Dev President 3',
    secretaryName: 'Rtr. Dev Secretary 3'
  });

  // 4. Test 2 edits via single category links
  console.log(`\n==================================================`);
  console.log(`TESTING SINGLE-SECTION CATEGORY EDITS`);
  console.log(`==================================================`);

  // Edit 1: Edit "Best Club Service Project" for mssw.rotaract
  console.log("Category Edit 1: Best Club Service Project...");
  await page.goto(url + '/nominate');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  // Navigate directly to category edit
  await page.goto(url + '/nominate?category=best-club-service-project');
  
  // Login Gate should appear
  await page.waitForSelector('input[placeholder="e.g. mssw.rotaract"]');
  await page.type('input[placeholder="e.g. mssw.rotaract"]', 'mssw.rotaract');
  await page.type('input[placeholder="••••••••"]', 'K9#fA7$wQ2');
  await clickButtonByText('Authenticate & Continue →');
  
  // Should land directly on Club Service Project 1 step
  await page.waitForSelector('button ::-p-text(Cancel)'); // Cancel button should be visible in single section mode
  console.log("Redirected directly to category section. Validating single section layout...");
  
  // Toggle Nominate to Yes
  await toggleProjectNomination();
  await fillInputByLabel('Project Name', 'Ignite Fellowship Campaign');
  await fillInputByLabel('Project Start Date', '2026-02-01');
  await fillInputByLabel('Project End Date', '2026-02-05');
  await fillInputByLabel('Number of Beneficiaries', '200');
  await fillInputByLabel('Purpose of the Project', 'Strengthen club ties and member bonding.');
  await fillInputByLabel('Overview of the Project', 'We organized a series of sports events and weekend outings.');
  await fillInputByLabel('Highlights of the Project', '100% participation. Raised funds for fellowship.');
  
  // Upload 3 pictures
  await uploadFileByLabel('Picture 1', dummyPngPath);
  await uploadFileByLabel('Picture 2', dummyPngPath);
  await uploadFileByLabel('Picture 3', dummyPngPath);
  
  await clickButtonByText('Save Changes');
  
  // Wait for submission confirmation/thanks card
  await page.waitForFunction(() => document.body.textContent.includes('A story worth standing for.'), { timeout: 20000 });
  console.log("Category Edit 1: Saved successfully!");

  // Edit 2: Edit "Best Professional Development Project" for licet.rotaract
  console.log("Category Edit 2: Best Professional Development Project...");
  await page.goto(url + '/nominate');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto(url + '/nominate?category=best-professional-service-project');
  
  // Login Gate should appear
  await page.waitForSelector('input[placeholder="e.g. mssw.rotaract"]');
  await page.type('input[placeholder="e.g. mssw.rotaract"]', 'licet.rotaract');
  await page.type('input[placeholder="••••••••"]', 'mN3$uV8%rE');
  await clickButtonByText('Authenticate & Continue →');
  
  // Land on Professional Project 1 step
  await page.waitForSelector('button ::-p-text(Cancel)');
  console.log("Redirected to Professional Development step. Saving details...");
  
  await toggleProjectNomination();
  await fillInputByLabel('Project Name', 'Horizons Coding Bootcamp');
  await fillInputByLabel('Project Start Date', '2026-03-10');
  await fillInputByLabel('Project End Date', '2026-03-15');
  await fillInputByLabel('Number of Beneficiaries', '80');
  await fillInputByLabel('Purpose of the Project', 'Provide React development training.');
  await fillInputByLabel('Overview of the Project', 'Hands-on bootcamps conducted by senior developer mentors.');
  await fillInputByLabel('Highlights of the Project', '30 graduates secured job interviews.');
  
  await uploadFileByLabel('Picture 1', dummyPngPath);
  await uploadFileByLabel('Picture 2', dummyPngPath);
  await uploadFileByLabel('Picture 3', dummyPngPath);
  
  await clickButtonByText('Save Changes');
  
  // Wait for thank you
  await page.waitForFunction(() => document.body.textContent.includes('A story worth standing for.'), { timeout: 20000 });
  console.log("Category Edit 2: Saved successfully!");

  // 5. Test Event Admin Console
  console.log(`\n==================================================`);
  console.log(`TESTING EVENT ADMIN CONSOLE`);
  console.log(`==================================================`);
  
  await page.goto(url + '/admin');
  await page.waitForSelector('input[placeholder="admin"]');
  await page.type('input[placeholder="admin"]', 'admin');
  await page.type('input[placeholder="••••••••"]', 'rotaract');
  await clickButtonByText('Enter the Console');
  
  // Wait for console to list submissions
  await page.waitForSelector('button ::-p-text(Rotaract Club of)', { timeout: 15000 });
  console.log("Admin Dashboard loaded successfully.");
  
  // Verify submissions are listed
  const submissionsCount = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Rotaract Club of')).length;
  });
  console.log(`Number of club submissions listed in admin: ${submissionsCount}`);
  if (submissionsCount < 3) {
    console.warn(`WARNING: Only found ${submissionsCount} submissions, expected at least 3!`);
  }
  
  // Click on the first club submission to open drawer
  console.log("Opening details drawer for first submission...");
  await page.evaluate(() => {
    const listButtons = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Rotaract Club of'));
    if (listButtons.length > 0) {
      listButtons[0].click();
    } else {
      throw new Error("No submission items found in the list to click");
    }
  });
  
  await page.waitForSelector('aside.border-l button ::-p-text(Shortlist)', { timeout: 5000 });
  console.log("Drawer opened successfully. Shortlisting the nomination...");
  
  // Shortlist the active item
  await clickButtonByText('Shortlist');
  await delay(1500); // Wait for Supabase update to complete
  
  console.log("Checking if status changed to Shortlisted...");
  const statusUpdated = await page.evaluate(() => {
    const clubButton = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Rotaract Club of'));
    return clubButton ? clubButton.textContent.includes('Shortlisted') : false;
  });
  if (statusUpdated) {
    console.log("Nomination status updated to Shortlisted successfully!");
  } else {
    throw new Error("Nomination status update verification failed!");
  }
  
  console.log(`\n==================================================`);
  console.log(`E2E TESTING COMPLETED SUCCESSFULLY WITH NO ERRORS!`);
  console.log(`==================================================`);
  
  await browser.close();
}

run().catch(async err => {
  console.error("\n==================================================");
  console.error("E2E TESTING FAILED!");
  console.error(err);
  console.error("==================================================");
  if (page) {
    try {
      const url = page.url();
      console.log(`Current page URL: ${url}`);
      
      const pageText = await page.evaluate(() => document.body.textContent);
      console.log(`\n--- Page text content (first 1500 chars) ---`);
      console.log(pageText.substring(0, 1500));
      console.log(`-------------------------------------------\n`);
      
      const screenshotPath = path.join(__dirname, 'error.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Saved failure screenshot to: ${screenshotPath}`);
    } catch (e) {
      console.error("Failed to gather debugging info from browser page:", e);
    }
  }
  if (browser) {
    await browser.close();
  }
  process.exit(1);
});
