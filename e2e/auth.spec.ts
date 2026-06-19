import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('认证 - 登录流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('应该显示登录页面', async ({ page }) => {
    await expect(page.locator('text=文章管理系统 - 登录')).toBeVisible();
    await expect(page.locator('input[id="login_username"]')).toBeVisible();
    await expect(page.locator('input[id="login_password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('应该成功登录并跳转首页', async ({ page }) => {
    await page.fill('input[id="login_username"]', 'admin');
    await page.fill('input[id="login_password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/', { timeout: 15000 });
    await expect(page.locator('header')).toBeVisible();
  });

  test('登录失败 - 错误的密码', async ({ page }) => {
    await page.fill('input[id="login_username"]', 'admin');
    await page.fill('input[id="login_password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.ant-message-error')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('登录失败 - 不存在的用户', async ({ page }) => {
    await page.fill('input[id="login_username"]', 'nonexistent');
    await page.fill('input[id="login_password"]', 'password');
    await page.click('button[type="submit"]');

    await expect(page.locator('.ant-message-error')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('登录失败 - 空用户名', async ({ page }) => {
    await page.fill('input[id="login_password"]', 'admin123');
    await page.click('button[type="submit"]');

    await expect(page.locator('.ant-form-item-explain-error')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('登录失败 - 空密码', async ({ page }) => {
    await page.fill('input[id="login_username"]', 'admin');
    await page.click('button[type="submit"]');

    await expect(page.locator('.ant-form-item-explain-error')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('认证 - 访问保护', () => {
  test('未登录访问首页应重定向到登录页', async ({ page }) => {
    await page.goto('/');

    await page.waitForURL(/\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('未登录访问创建页应重定向到登录页', async ({ page }) => {
    await page.goto('/articles/create');

    await page.waitForURL(/\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('认证 - 登出流程', () => {
  test('登出后应跳转到登录页', async ({ page }) => {
    await loginAsAdmin(page);

    await expect(page.locator('header')).toBeVisible();

    await page.locator('.anticon-down').click();

    await page.locator('text=退出登录').click();

    await page.waitForURL(/\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('登出后访问受保护页面应重定向到登录页', async ({ page }) => {
    await loginAsAdmin(page);

    await page.locator('.anticon-down').click();
    await page.locator('text=退出登录').click();
    await page.waitForURL(/\/login/, { timeout: 15000 });

    await page.goto('/');

    await page.waitForURL(/\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
