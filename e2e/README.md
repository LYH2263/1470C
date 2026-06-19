# E2E测试文档

## 概述

本项目使用Playwright进行端到端(E2E)测试，覆盖完整的用户流程和交互场景。
所有需要认证的测试通过 Playwright `storageState` 机制复用登录态，无需每个用例重复登录。

## 认证体系

### 登录态复用 (storageState)

测试采用 Playwright 的 [storageState](https://playwright.dev/docs/auth) 机制：

1. `e2e/auth.setup.ts` 作为全局 setup 项目，先完成管理员登录
2. 登录成功后将 `localStorage` 中的 `auth_token` 和 `auth_user` 保存到 `e2e/.auth/admin.json`
3. 所有需要认证的测试项目 (`authenticated`) 依赖 setup 项目，自动加载 storageState

### 项目划分

| 项目名 | 用途 | 是否需要登录态 |
|--------|------|----------------|
| `setup` | 登录并保存 storageState | 否 |
| `authenticated` | 文章管理等受保护页面测试 | 是 (storageState) |
| `public` | 认证相关测试 (登录/登出) | 否 |

### loginAsAdmin helper

`e2e/helpers.ts` 导出 `loginAsAdmin(page)` 函数，用于需要手动登录的场景（如登出后重新登录）：

```typescript
import { loginAsAdmin } from './helpers';
await loginAsAdmin(page);
```

## 测试文件

### 1. auth.setup.ts
全局认证 setup，完成管理员登录并保存 `storageState`。

### 2. auth.spec.ts
认证流程测试（运行在 `public` 项目，无预置登录态）：
- ✅ 登录页面显示
- ✅ 成功登录并跳转首页
- ✅ 登录失败 - 错误密码
- ✅ 登录失败 - 不存在的用户
- ✅ 登录失败 - 空用户名/空密码
- ✅ 未登录访问受保护页面重定向到登录页
- ✅ 登出后跳转登录页
- ✅ 登出后无法访问受保护页面

### 3. article-management.spec.ts
完整的文章管理流程测试，包括：
- ✅ 首页和文章列表显示
- ✅ 创建新文章
- ✅ 查看文章详情
- ✅ 编辑文章
- ✅ 删除文章
- ✅ 搜索文章
- ✅ 分页浏览
- ✅ 表单验证（必填字段、标题长度、作者长度）
- ✅ 错误处理（网络错误、不存在的文章）
- ✅ 响应式设计

### 4. article-crud.spec.ts
使用 Page Object Model 模式的 CRUD 测试，包括：
- ✅ 完整的 CRUD 流程
- ✅ 创建多篇文章
- ✅ 表单取消操作
- ✅ 批量删除文章

### 5. article-create-rich-text.spec.ts
文章创建含富文本输入的端到端测试，包括：
- ✅ 通过富文本编辑器输入纯文本内容
- ✅ 通过工具栏加粗文本
- ✅ 通过工具栏插入有序列表
- ✅ 创建文章并在详情页验证富文本内容

### 6. helpers.ts
测试辅助工具，包括：
- `loginAsAdmin(page)` - 手动登录管理员
- `ADMIN_CREDENTIALS` - 管理员凭据常量
- Page Object Model 类（选择器已与实际 UI 对齐）
- 测试数据工厂
- 等待工具函数

## 运行测试

### 前提条件

1. 安装依赖：
```bash
pnpm install
```

2. 安装 Playwright 浏览器：
```bash
pnpm playwright install
```

3. 确保数据库已初始化并包含管理员账号：
```bash
pnpm prisma generate
pnpm prisma db push
pnpm tsx scripts/migrate-auth.ts
```

### 运行命令

```bash
# 运行所有 E2E 测试（含 setup 认证）
pnpm test:e2e

# 使用 UI 模式运行测试
pnpm test:e2e:ui

# 调试模式运行测试
pnpm test:e2e:debug

# 查看测试报告
pnpm test:e2e:report

# 运行特定测试文件
pnpm playwright test e2e/article-crud.spec.ts

# 仅运行认证相关测试
pnpm playwright test --project=public

# 仅运行需要认证的测试
pnpm playwright test --project=authenticated
```

## 测试配置

配置文件：`playwright.config.ts`

主要配置：
- **baseURL**: http://localhost:3000
- **timeout**: 30 秒
- **retries**: CI 环境重试 2 次
- **screenshot**: 失败时截图
- **video**: 失败时录制视频
- **trace**: 首次重试时记录追踪
- **项目划分**: setup → authenticated (storageState) / public (无登录态)

## Page Object Model

### ArticleListPage
文章列表页面对象，选择器与实际 UI 对齐：
- `goto()` - 访问首页并等待表格加载
- `clickNewArticle()` - 点击"新增"按钮
- `searchArticle(keyword)` - 搜索文章（placeholder="搜索标题"）
- `resetSearch()` - 重置搜索
- `getArticleCount()` - 获取文章数量
- `clickFirstArticleView()` - 查看第一篇文章（"详情"按钮）
- `clickFirstArticleEdit()` - 编辑第一篇文章
- `clickFirstArticleDelete()` - 删除第一篇文章
- `selectFirstArticle()` - 选择第一篇文章
- `clickDelete()` - 点击"批量删除"按钮
- `confirmDelete()` - 确认删除

### ArticleFormPage
文章表单页面对象：
- `fillTitle(title)` - 填写标题
- `fillAuthor(author)` - 填写作者
- `selectImportance(importance)` - 选择重要性（ant-select-item-option）
- `fillContent(content)` - 填写内容（.ql-editor）
- `fillRichContent(html)` - 通过键盘输入富文本
- `submit()` - 提交表单（"保存"按钮）
- `cancel()` - 取消操作（"返回"按钮）
- `fillForm(data)` - 填写完整表单

### ArticleDetailPage
文章详情页面对象：
- `getTitle()` - 获取标题
- `getAuthor()` - 获取作者
- `getContent()` - 获取内容（.article-content）
- `clickEdit()` - 点击编辑
- `clickBack()` - 返回

## 数据库隔离策略

### 本地开发

本地运行 E2E 测试时默认使用项目的主 SQLite 数据库。建议：

1. 测试前确保数据库有管理员账号（`pnpm tsx scripts/migrate-auth.ts`）
2. 测试创建的数据使用 `Date.now()` 等唯一标识，避免冲突
3. 如需完全隔离，可设置 `DATABASE_URL` 指向独立的测试数据库文件：

```bash
# PowerShell
$env:DATABASE_URL = "file:./test.db"
pnpm prisma db push
pnpm tsx scripts/migrate-auth.ts
pnpm test:e2e
```

### CI 环境

CI 中每次运行都在全新虚拟机上执行，天然隔离：

1. `prisma db push` 创建全新的 SQLite 数据库
2. `scripts/seed-e2e.ts` 种子脚本确保管理员账号存在
3. 每次运行后数据库随虚拟机销毁

## 测试数据

### testData.article
默认测试文章数据：
```typescript
{
  title: 'E2E测试文章',
  author: 'E2E测试作者',
  importance: 'high',
  content: '<p>这是E2E测试的文章内容</p>',
}
```

### testData.createRandomArticle()
创建随机测试文章数据，使用 `Date.now()` 和随机字符串避免数据冲突。

## 最佳实践

### 1. 认证优先
所有受保护页面的测试必须在已认证状态下运行。通过 `storageState` 机制自动处理，无需手动登录。

### 2. 使用 Page Object Model
将页面操作封装到 Page Object 中，选择器与实际 UI 对齐：

```typescript
const listPage = new ArticleListPage(page);
await listPage.goto();
await listPage.clickNewArticle();  // "新增" 按钮
```

### 3. 使用测试数据工厂
使用工厂函数创建测试数据，避免硬编码和数据冲突：

```typescript
const articleData = testData.createRandomArticle();
await formPage.fillForm(articleData);
```

### 4. 等待策略
优先使用语义化等待，避免 `waitForTimeout`：

```typescript
// 推荐
await page.locator('.ant-table').waitFor({ state: 'visible' });
await page.waitForLoadState('networkidle');

// 避免使用
await page.waitForTimeout(500);
```

### 5. 独立的测试用例
每个测试用例应独立运行，不依赖其他测试的状态。

## 调试技巧

### 1. 使用 UI 模式
```bash
pnpm test:e2e:ui
```

### 2. 使用调试模式
```bash
pnpm test:e2e:debug
```

### 3. 查看截图和视频
测试失败时，Playwright 自动保存截图和视频到 `test-results/` 目录。

### 4. 查看追踪
```bash
pnpm playwright show-trace test-results/trace.zip
```

## 测试覆盖范围

### 已覆盖 ✅
- 认证流程（登录成功/失败/登出/访问保护）
- 文章 CRUD 操作
- 搜索和分页
- 表单验证
- 错误处理
- 响应式设计
- 批量操作
- 富文本编辑器输入

### 待覆盖 ⏳
- 图片上传
- 键盘快捷键
- 导出功能

---

**最后更新**: 2026-06-19
**Playwright 版本**: 1.58.1
