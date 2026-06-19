import { test as setup, expect } from '@playwright/test';

const AUTH_FILE = 'e2e/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');

  await page.fill('input[id="login_username"]', 'admin');
  await page.fill('input[id="login_password"]', 'admin123');

  await page.click('button[type="submit"]');

  await page.waitForURL('/', { timeout: 15000 });

  await expect(page.locator('header')).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
