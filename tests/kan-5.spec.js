const { test, expect } = require('@playwright/test');

test('Enter Delhi in from field', async ({ page }) => {
  await page.goto('https://www.makemytrip.com/flights');
  
  await page.waitForTimeout(3000);

  try {
    const closeIcon = page.locator('.commonModal__close');
    await closeIcon.click();
  } catch (error) {
    console.log('Popup did not appear');
  }

  await page.locator('label[for="fromCity"]').click();
  await page.getByPlaceholder('From').fill('Delhi');
  
  await page.waitForTimeout(1000);
  await page.keyboard.press('Enter');
});