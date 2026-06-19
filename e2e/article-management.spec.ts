import { test, expect } from '@playwright/test';

test.describe('文章管理系统 - 完整流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('.ant-table').waitFor({ state: 'visible' });
  });

  test('应该显示首页和文章列表', async ({ page }) => {
    await expect(page).toHaveTitle(/文章管理系统/);
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('.ant-layout-sider')).toBeVisible();
    await expect(page.locator('.ant-table')).toBeVisible();
  });

  test('应该能够创建新文章', async ({ page }) => {
    await page.click('button:has-text("新增")');
    await expect(page).toHaveURL(/\/articles\/create/);

    await page.fill('input[id*="title"]', 'E2E测试文章');
    await page.fill('input[id*="author"]', 'E2E测试作者');

    await page.locator('.ant-select-selector').click();
    await page.locator('.ant-select-item-option:has-text("高")').click();

    const editor = page.locator('.ql-editor').first();
    await editor.click();
    await editor.fill('这是E2E测试的文章内容');

    await page.click('button:has-text("保存")');

    await expect(page).toHaveURL('/');
    await expect(page.locator('.ant-message-success')).toBeVisible();
    await expect(page.locator('text=E2E测试文章')).toBeVisible();
  });

  test('应该能够查看文章详情', async ({ page }) => {
    await page.locator('.ant-table-tbody tr:first-child button:has-text("详情")').click();

    await expect(page.url()).toMatch(/\/articles\/[a-f0-9-]+$/);

    await expect(page.locator('.ant-descriptions')).toBeVisible();
    await expect(page.locator('.article-content')).toBeVisible();
  });

  test('应该能够编辑文章', async ({ page }) => {
    await page.locator('.ant-table-tbody tr:first-child button:has-text("编辑")').click();

    await expect(page.url()).toMatch(/\/articles\/[a-f0-9-]+\/edit/);

    const titleInput = page.locator('input[id*="title"]');
    await titleInput.clear();
    await titleInput.fill('E2E测试文章(已编辑)');

    await page.click('button:has-text("保存")');

    await expect(page).toHaveURL('/');
    await expect(page.locator('.ant-message-success')).toBeVisible();
    await expect(page.locator('text=E2E测试文章(已编辑)')).toBeVisible();
  });

  test('应该能够删除文章', async ({ page }) => {
    const rowsBefore = await page.locator('.ant-table-tbody tr').count();

    await page.locator('.ant-table-tbody tr:first-child button:has-text("删除")').click();

    await page.locator('.ant-popconfirm button:has-text("确定"), .ant-modal button:has-text("确定")').click();

    await expect(page.locator('.ant-message-success')).toBeVisible();

    const rowsAfter = await page.locator('.ant-table-tbody tr').count();
    expect(rowsAfter).toBe(rowsBefore - 1);
  });

  test('应该能够搜索文章', async ({ page }) => {
    await page.fill('input[placeholder="搜索标题"]', 'E2E');
    await page.click('button:has-text("搜索")');

    await page.waitForLoadState('networkidle');

    const rows = page.locator('.ant-table-tbody tr');
    const count = await rows.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const text = await rows.nth(i).textContent();
        expect(text?.toLowerCase()).toContain('e2e');
      }
    }
  });

  test('应该能够分页浏览文章', async ({ page }) => {
    const pagination = page.locator('.ant-pagination');
    const hasPagination = await pagination.isVisible();

    if (hasPagination) {
      const nextButton = page.locator('.ant-pagination-next:not(.ant-pagination-disabled)');
      if (await nextButton.isVisible()) {
        const firstArticleTitle = await page
          .locator('.ant-table-tbody tr:first-child')
          .textContent();

        await nextButton.click();

        await page.waitForLoadState('networkidle');

        const secondPageFirstArticle = await page
          .locator('.ant-table-tbody tr:first-child')
          .textContent();

        expect(secondPageFirstArticle).not.toBe(firstArticleTitle);
      }
    }
  });
});

test.describe('文章管理系统 - 表单验证', () => {
  test('应该验证必填字段', async ({ page }) => {
    await page.goto('/articles/create');

    await page.click('button:has-text("保存")');

    await expect(page.locator('.ant-form-item-explain-error')).toBeVisible();
  });

  test('应该验证标题长度', async ({ page }) => {
    await page.goto('/articles/create');

    await page.fill('input[id*="title"]', 'A'.repeat(201));

    await page.click('button:has-text("保存")');

    await expect(page.locator('text=/标题不能超过/')).toBeVisible();
  });

  test('应该验证作者长度', async ({ page }) => {
    await page.goto('/articles/create');

    await page.fill('input[id*="author"]', 'A'.repeat(51));

    await page.click('button:has-text("保存")');

    await expect(page.locator('text=/作者不能超过/')).toBeVisible();
  });
});

test.describe('文章管理系统 - 错误处理', () => {
  test('应该处理网络错误', async ({ page, context }) => {
    await context.setOffline(true);

    await page.goto('/');

    await page.click('button:has-text("新增")');
    await page.fill('input[id*="title"]', '测试文章');
    await page.fill('input[id*="author"]', '测试作者');
    await page.click('button:has-text("保存")');

    await expect(page.locator('.ant-message-error')).toBeVisible();

    await context.setOffline(false);
  });

  test('应该处理不存在的文章ID', async ({ page }) => {
    await page.goto('/articles/non-existent-id');

    await expect(page.locator('text=文章不存在')).toBeVisible();
  });
});

test.describe('文章管理系统 - 响应式设计', () => {
  test('应该在移动设备上正常显示', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
  });

  test('应该在平板设备上正常显示', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.locator('.ant-table')).toBeVisible();
  });
});
