const puppeteer = require('puppeteer');
const path = require('path');

async function run() {
  console.log("Launching debug script...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const url = 'http://localhost:3000';
  
  // Listen to browser console events
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  // Set viewport
  await page.setViewport({ width: 1280, height: 960 });
  
  console.log("Navigating to /nominate?category=best-club-service-project");
  await page.goto(url + '/nominate?category=best-club-service-project');
  
  // Login as mssw.rotaract
  console.log("Waiting for login inputs...");
  await page.waitForSelector('input[placeholder="e.g. mssw.rotaract"]');
  await page.type('input[placeholder="e.g. mssw.rotaract"]', 'mssw.rotaract');
  await page.type('input[placeholder="••••••••"]', 'K9#fA7$wQ2');
  
  console.log("Clicking login button...");
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button, a')).find(b => b.textContent.includes('Authenticate & Continue →'));
    if (btn) btn.click();
  });
  
  console.log("Waiting for page redirection...");
  await page.waitForSelector('button ::-p-text(Cancel)');
  
  // Inspect the switch span
  console.log("Inspecting 'Nominate in this category' switch...");
  const info = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'));
    const txtSpan = spans.find(s => s.textContent.trim() === 'Nominate in this category');
    if (!txtSpan) return { error: "Text span not found" };
    
    const parent = txtSpan.parentElement;
    if (!parent) return { error: "Parent not found", tagName: txtSpan.tagName };
    
    const switchSpan = parent.querySelector('span.relative');
    if (!switchSpan) return { error: "Switch span not found", parentHtml: parent.outerHTML };
    
    const rect = switchSpan.getBoundingClientRect();
    return {
      parentTagName: parent.tagName,
      parentClass: parent.className,
      switchTagName: switchSpan.tagName,
      switchClass: switchSpan.className,
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      },
      html: switchSpan.outerHTML
    };
  });
  
  console.log("Switch info:", JSON.stringify(info, null, 2));
  
  if (info.error) {
    await browser.close();
    return;
  }
  
  // Try to click programmatically and check if HTML changes
  console.log("Clicking switch programmatically via page.evaluate...");
  const clickResult = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'));
    const txtSpan = spans.find(s => s.textContent.trim() === 'Nominate in this category');
    const switchSpan = txtSpan.parentElement.querySelector('span.relative');
    switchSpan.click();
    return {
      classAfterClick: switchSpan.className,
      htmlAfterClick: switchSpan.outerHTML
    };
  });
  
  console.log("After programmatic click:", JSON.stringify(clickResult, null, 2));
  
  // Wait 1 second
  await new Promise(r => setTimeout(r, 1000));
  
  // Try to click via Puppeteer click on coordinates
  // console.log("Clicking switch via Puppeteer native click...");
  // await page.click('span.relative');
  
  // Check if form fields like 'Project Name' appear
  await new Promise(r => setTimeout(r, 1000));
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, label')).map(el => ({
      tag: el.tagName,
      text: el.textContent || el.placeholder || '',
      visible: el.getBoundingClientRect().height > 0
    })).filter(x => x.text.toLowerCase().includes('project name'));
  });
  
  console.log("Project name inputs found:", inputs);
  
  // Take screenshot
  await page.screenshot({ path: path.join(__dirname, 'debug-switch.png') });
  console.log("Wrote debug-switch.png screenshot");
  
  await browser.close();
}

run();
