const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 120000, // 2-minute test execution timeout
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    // Disable baseURL so page.goto() always uses absolute URLs from Jira tasks
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Custom Chrome User-Agent to bypass headless/bot detection
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    
    launchOptions: {
      headless: false, // WAFs heavily block headless mode
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-http2',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        // Do NOT spread devices['Desktop Chrome'] if you want launchOptions.args to take full effect
        viewport: { width: 1366, height: 768 },
      },
    },
  ],
});