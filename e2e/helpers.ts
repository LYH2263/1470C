import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

export const test = base.extend({});
export { expect } from '@playwright/test';

export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[id="login_username"]', ADMIN_CREDENTIALS.username);
  await page.fill('input[id="login_password"]', ADMIN_CREDENTIALS.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/', { timeout: 15000 });
  await page.locator('header').waitFor({ state: 'visible' });
}

export const testData = {
  article: {
    title: 'E2E测试文章',
    author: 'E2E测试作者',
    importance: 'high' as const,
    content: '<p>这是E2E测试的文章内容</p>',
  },

  createRandomArticle: () => ({
    title: `测试文章-${Date.now()}`,
    author: `测试作者-${Math.random().toString(36).substring(7)}`,
    importance: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
    content: `<p>测试内容-${Date.now()}</p>`,
  }),
};

export class ArticleListPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
    await this.page.locator('.ant-table').waitFor({ state: 'visible' });
  }

  async clickNewArticle() {
    await this.page.click('button:has-text("新增")');
  }

  async searchArticle(keyword: string) {
    await this.page.fill('input[placeholder="搜索标题"]', keyword);
    await this.page.click('button:has-text("搜索")');
  }

  async resetSearch() {
    await this.page.click('button:has-text("重置")');
  }

  async getArticleCount() {
    return await this.page.locator('.ant-table-tbody tr').count();
  }

  async clickFirstArticleView() {
    await this.page.click('.ant-table-tbody tr:first-child button:has-text("详情")');
  }

  async clickFirstArticleEdit() {
    await this.page.click('.ant-table-tbody tr:first-child button:has-text("编辑")');
  }

  async clickFirstArticleDelete() {
    await this.page.click('.ant-table-tbody tr:first-child button:has-text("删除")');
  }

  async selectFirstArticle() {
    await this.page.click('.ant-table-tbody tr:first-child .ant-checkbox-input');
  }

  async clickDelete() {
    await this.page.click('button:has-text("批量删除")');
  }

  async confirmDelete() {
    await this.page.click('.ant-modal button:has-text("确定")');
  }
}

export class ArticleFormPage {
  constructor(private page: Page) {}

  async fillTitle(title: string) {
    await this.page.locator('.ant-form-item-label label:text("标题")').click();
    const input = this.page.locator('input[id*="title"]');
    await input.clear();
    await input.fill(title);
  }

  async fillAuthor(author: string) {
    const input = this.page.locator('input[id*="author"]');
    await input.clear();
    await input.fill(author);
  }

  async selectImportance(importance: 'low' | 'medium' | 'high') {
    await this.page.locator('.ant-select-selector').click();
    const importanceMap = { low: '低', medium: '中', high: '高' };
    await this.page.locator(`.ant-select-item-option:has-text("${importanceMap[importance]}")`).click();
  }

  async fillContent(content: string) {
    const editor = this.page.locator('.ql-editor').first();
    await editor.click();
    await editor.fill(content);
  }

  async fillRichContent(html: string) {
    const editor = this.page.locator('.ql-editor').first();
    await editor.click();
    await this.page.keyboard.type(html);
  }

  async submit() {
    await this.page.click('button:has-text("保存")');
  }

  async cancel() {
    await this.page.click('button:has-text("返回")');
  }

  async fillForm(data: {
    title: string;
    author: string;
    importance: 'low' | 'medium' | 'high';
    content: string;
  }) {
    await this.fillTitle(data.title);
    await this.fillAuthor(data.author);
    await this.selectImportance(data.importance);
    await this.fillContent(data.content);
  }
}

export class ArticleDetailPage {
  constructor(private page: Page) {}

  async getTitle() {
    return await this.page.locator('.ant-descriptions-item-label:text("标题") + .ant-descriptions-item-content').textContent();
  }

  async getAuthor() {
    return await this.page.locator('.ant-descriptions-item-label:text("作者") + .ant-descriptions-item-content').textContent();
  }

  async getContent() {
    return await this.page.locator('.article-content').textContent();
  }

  async clickEdit() {
    await this.page.click('button:has-text("编辑")');
  }

  async clickBack() {
    await this.page.click('button:has-text("返回")');
  }
}

export const waitFor = {
  navigation: async (page: Page) => {
    await page.waitForLoadState('networkidle');
  },

  message: async (page: Page, type: 'success' | 'error' | 'warning' | 'info') => {
    await page.waitForSelector(`.ant-message-${type}`);
  },

  table: async (page: Page) => {
    await page.waitForSelector('.ant-table-tbody tr');
  },
};
