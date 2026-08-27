const { chromium } = require("playwright");

const BASE = "https://panel.dupez.uk";
const EMAIL = "admin@dupez.uk";
const PASSWORD = "admin123";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  // Listen to console and network
  page.on("console", (msg) => console.log("[BROWSER]", msg.type(), msg.text()));
  page.on("response", (res) => {
    if (res.url().includes("login") || res.url().includes("panel")) {
      console.log(`[NET] ${res.status()} ${res.url()}`);
    }
  });

  // 1. Go to login
  console.log("--- Going to login page ---");
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
  console.log("URL after goto:", page.url());
  
  // Wait for the form
  await page.waitForTimeout(2000);
  console.log("Page title:", await page.title());
  
  // Screenshot
  await page.screenshot({ path: "/tmp/dupez-login.png", fullPage: true });
  console.log("Screenshot saved to /tmp/dupez-login.png");
  
  // Check page content
  const bodyText = await page.locator("body").innerText().catch(() => "COULD NOT GET TEXT");
  console.log("Body text (first 1000 chars):", bodyText.substring(0, 1000));
  
  // Check form elements
  const emailInput = await page.locator('input[name="email"]').count();
  const passwordInput = await page.locator('input[name="password"]').count();
  const submitBtn = await page.locator('button[type="submit"]').count();
  console.log(`Form elements: email=${emailInput}, password=${passwordInput}, submit=${submitBtn}`);
  
  // Fill and submit
  if (emailInput > 0) {
    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="password"]', PASSWORD);
    
    // Click submit
    console.log("--- Submitting login ---");
    await Promise.all([
      page.waitForNavigation({ timeout: 20000 }).catch(e => console.log("Nav timeout:", e.message)),
      page.click('button[type="submit"]'),
    ]);
    
    console.log("URL after submit:", page.url());
    await page.waitForTimeout(3000);
    console.log("URL after wait:", page.url());
    
    await page.screenshot({ path: "/tmp/dupez-after-login.png", fullPage: true });
    console.log("Screenshot saved to /tmp/dupez-after-login.png");
    
    const bodyText2 = await page.locator("body").innerText().catch(() => "COULD NOT GET TEXT");
    console.log("Body text after login (first 2000 chars):", bodyText2.substring(0, 2000));
  }

  // Now try navigating to /panel
  console.log("--- Navigating to /panel ---");
  await page.goto(`${BASE}/panel`, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
  console.log("URL:", page.url());
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: "/tmp/dupez-panel.png", fullPage: true });
  const bodyText3 = await page.locator("body").innerText().catch(() => "COULD NOT GET TEXT");
  console.log("Panel body (first 2000 chars):", bodyText3.substring(0, 2000));
  
  // Check if we're on login page
  if (page.url().includes("/login")) {
    console.log("\n*** STILL ON LOGIN PAGE - Authentication failed ***");
    const errorEl = await page.locator('[role="alert"]').innerText().catch(() => "no error element");
    console.log("Error message:", errorEl);
  }

  await browser.close();
})();
