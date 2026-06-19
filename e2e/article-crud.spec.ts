import { test, expect } from '@playwright/test';
import { ArticleListPage, ArticleFormPage, testData } from './helpers';

test.describe('文章管理 - 核心流程 (POM)', () => {
  let listPage: ArticleListPage;
  let formPage: ArticleFormPage;

  test.beforeEach(async ({ page }) => {
    listPage = new ArticleListPage(page);
    formPage = new ArticleFormPage(page);
    await listPage.goto();
  });

  test('完整的CRUD流程', async ({ page }) => {
    await listPage.clickNewArticle();
    await expect(page).toHaveURL(/\/articles\/create/);

    const articleData = testData.createRandomArticle();
    await formPage.fillForm(articleData);
    await formPage.submit();

    await expect(page).toHaveURL('/');
    await expect(page.locator('.ant-message-success')).toBeVisible();

    await listPage.searchArticle(articleData.title);
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text=${articleData.title}`)).toBeVisible();

    await listPage.clickFirstArticleEdit();
    await expect(page.url()).toMatch(/\/articles\/[a-f0-9-]+\/edit/);

    await formPage.fillTitle(articleData.title + ' (已编辑)');
    await formPage.submit();

    await expect(page).toHaveURL('/');
    await expect(page.locator('.ant-message-success')).toBeVisible();

    await listPage.selectFirstArticle();
    await listPage.clickDelete();
    await listPage.confirmDelete();

    await expect(page.locator('.ant-message-success')).toBeVisible();
  });

  test('创建多篇文章', async ({ page }) => {
    const articlesToCreate = 3;

    for (let i = 0; i < articlesToCreate; i++) {
      await listPage.clickNewArticle();

      const articleData = testData.createRandomArticle();
      await formPage.fillForm(articleData);
      await formPage.submit();

      await expect(page).toHaveURL('/');
      await page.waitForLoadState('networkidle');
    }

    const count = await listPage.getArticleCount();
    expect(count).toBeGreaterThanOrEqual(articlesToCreate);
  });

  test('表单取消操作', async ({ page }) => {
    await listPage.clickNewArticle();
    await expect(page).toHaveURL(/\/articles\/create/);

    await formPage.fillTitle('测试取消');

    await formPage.cancel();

    await expect(page).toHaveURL('/');
  });
});

test.describe('文章管理 - 批量操作', () => {
  test('批量删除文章', async ({ page }) => {
    const listPage = new ArticleListPage(page);
    await listPage.goto();

    const initialCount = await listPage.getArticleCount();

    if (initialCount >= 2) {
      await page.locator('.ant-table-tbody tr:nth-child(1) .ant-checkbox-input').click();
      await page.locator('.ant-table-tbody tr:nth-child(2) .ant-checkbox-input').click();

      await listPage.clickDelete();
      await listPage.confirmDelete();

      await expect(page.locator('.ant-message-success')).toBeVisible();

      await page.waitForLoadState('networkidle');
      const finalCount = await listPage.getArticleCount();
      expect(finalCount).toBe(initialCount - 2);
    }
  });
});
