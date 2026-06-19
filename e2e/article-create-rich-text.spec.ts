import { test, expect } from '@playwright/test';

test.describe('文章创建 - 富文本输入', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/articles/create');
    await page.locator('.ant-form').waitFor({ state: 'visible' });
  });

  test('应该通过富文本编辑器输入纯文本内容', async ({ page }) => {
    const uniqueTitle = `富文本测试-${Date.now()}`;

    await page.fill('input[id*="title"]', uniqueTitle);
    await page.fill('input[id*="author"]', 'E2E测试作者');

    await page.locator('.ant-select-selector').click();
    await page.locator('.ant-select-item-option:has-text("高")').click();

    const editor = page.locator('.ql-editor').first();
    await editor.click();
    await editor.fill('这是通过富文本编辑器输入的纯文本内容');

    const editorContent = await editor.textContent();
    expect(editorContent).toContain('这是通过富文本编辑器输入的纯文本内容');

    await page.click('button:has-text("保存")');

    await expect(page).toHaveURL('/');
    await expect(page.locator('.ant-message-success')).toBeVisible();
    await expect(page.locator(`text=${uniqueTitle}`)).toBeVisible();
  });

  test('应该通过工具栏加粗文本', async ({ page }) => {
    const uniqueTitle = `加粗测试-${Date.now()}`;

    await page.fill('input[id*="title"]', uniqueTitle);
    await page.fill('input[id*="author"]', 'E2E测试作者');

    await page.locator('.ant-select-selector').click();
    await page.locator('.ant-select-item-option:has-text("中")').click();

    const editor = page.locator('.ql-editor').first();
    await editor.click();

    await page.locator('.ql-toolbar button.ql-bold').click();

    await page.keyboard.type('加粗的文字');

    const htmlContent = await editor.innerHTML();
    expect(htmlContent).toContain('<strong>');

    await page.click('button:has-text("保存")');

    await expect(page).toHaveURL('/');
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });

  test('应该通过工具栏插入有序列表', async ({ page }) => {
    const uniqueTitle = `列表测试-${Date.now()}`;

    await page.fill('input[id*="title"]', uniqueTitle);
    await page.fill('input[id*="author"]', 'E2E测试作者');

    await page.locator('.ant-select-selector').click();
    await page.locator('.ant-select-item-option:has-text("低")').click();

    const editor = page.locator('.ql-editor').first();
    await editor.click();

    await page.locator('.ql-toolbar button.ql-list[value="ordered"]').click();

    await page.keyboard.type('第一项');
    await page.keyboard.press('Enter');
    await page.keyboard.type('第二项');

    const htmlContent = await editor.innerHTML();
    expect(htmlContent).toContain('<ol>');
    expect(htmlContent).toContain('<li>');

    await page.click('button:has-text("保存")');

    await expect(page).toHaveURL('/');
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });

  test('应该创建文章并在详情页查看富文本内容', async ({ page }) => {
    const uniqueTitle = `详情验证-${Date.now()}`;

    await page.fill('input[id*="title"]', uniqueTitle);
    await page.fill('input[id*="author"]', 'E2E验证作者');

    await page.locator('.ant-select-selector').click();
    await page.locator('.ant-select-item-option:has-text("高")').click();

    const editor = page.locator('.ql-editor').first();
    await editor.click();

    await page.locator('.ql-toolbar button.ql-bold').click();
    await page.keyboard.type('重要内容');
    await page.locator('.ql-toolbar button.ql-bold').click();
    await page.keyboard.type(' 普通内容');

    await page.click('button:has-text("保存")');

    await expect(page).toHaveURL('/');
    await expect(page.locator('.ant-message-success')).toBeVisible();

    await page.locator(`text=${uniqueTitle}`).click();

    await expect(page.url()).toMatch(/\/articles\/[a-f0-9-]+$/);
    await expect(page.locator('.article-content')).toBeVisible();

    const detailContent = await page.locator('.article-content').innerHTML();
    expect(detailContent).toContain('重要内容');
    expect(detailContent).toContain('普通内容');
  });
});
