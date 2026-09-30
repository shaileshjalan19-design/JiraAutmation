
const { test, expect, chromium } = require('@playwright/test');

test.setTimeout(120000);

test('Flight Search from Nagpur to Mumbai', async () => {
  // Launch installed Google Chrome instead of Playwright's default headless Chromium
  const browser = await chromium.launch({
    channel: 'chrome', // Uses system-installed Google Chrome
    headless: false,   // WAFs aggressively block headless mode; set false for reliable navigation
    args: [
      '--disable-http2',
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'en-US',
    timezoneId: 'Asia/Kolkata',
  });

  const page = await context.newPage();

  // Hide navigator.webdriver
  await page.addInitScript(() => {
    delete Object.getPrototypeOf(navigator).webdriver;
  });

  console.log('Navigating to MakeMyTrip...');

  // Navigate with DOMContentLoaded wait
  await page.goto('https://www.makemytrip.com/flights/', { 
    waitUntil: 'domcontentloaded', 
    timeout: 60000 
  });

  console.log('Successfully reached MakeMyTrip home page.');

  // Optional: Wait for main wrapper to confirm complete rendering
  await page.waitForTimeout(3000);

  await browser.close();
});
