# PersonalWeb 零费用 GitHub Pages 开发、发布与验收计划书

更新日期：2026-08-29

> 本计划已根据最新约束重写：第一原则是零付费，第一发布平台是 GitHub Pages。Vercel 和 Render 不再是第一版发布前提，Supabase 不再是第一版必需依赖。第一版只交付可在 GitHub Pages 静态托管的公开网站；需要服务器、数据库、登录、上传、私有文件和动态写入的功能暂时删除或降级为后续方案。

本文是 PersonalWeb 的唯一执行计划。每个阶段完成后必须更新 `docs/PROGRESS.md`；如果改变架构、安全边界、公开范围、仓库可见性或供应商，必须同步更新 `docs/ARCHITECTURE.md` 和 `docs/DECISIONS.md`。除明确属于所有者账户、公开授权或外部验证的事项外，所有任务必须持续推进，不能以阶段性结果代替最终验收。

## 1. 当前状态与重新规划原因

### 1.1 已有应用基础

当前仓库已经有：

- Next.js App Router + TypeScript；
- Wii 风格首页和导航；
- iBooks/早期 iPhone 风格博客与资源书架；
- `/`、`/about`、`/blog`、`/blog/[slug]`、`/library` 页面；
- Git 管理的 Markdown 博客内容；
- loading、error、empty、404 状态；
- favicon、Open Graph、robots、sitemap 和 metadata；
- 评论、管理员登录、上传、下载和 Supabase 生产适配代码。

但现有动态能力依赖 Node.js 服务端，不能原样部署到 GitHub Pages。当前计划不再强求这些动态能力。

### 1.2 最新外部约束

- Vercel 网页端登录卡在手机验证，并要求绑定当前 GitHub 本账号；
- Render 网页端目前可以登录；
- 第一原则改为不付费；
- 网站必须能够托管在 GitHub；
- 用户允许删除过于极端、与零费用 GitHub 静态托管冲突的要求；
- 不得为了保留所有功能而强行引入付费主机、付费数据库或账户验证绕过方案。

### 1.3 官方资料确认的事实

- [GitHub Pages 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)：GitHub Pages 是静态网站托管，发布 HTML、CSS、JavaScript 文件；GitHub Free 下可用于公开仓库，私有仓库需要 Pro、Team 或更高计划；
- [GitHub Pages 创建说明](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)：非 Jekyll 静态生成器可以通过 GitHub Actions 构建和发布；
- [GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)：可使用 `actions/configure-pages`、`actions/upload-pages-artifact` 和 `actions/deploy-pages`；
- [GitHub Pages 限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)：发布站点不超过 1 GB，软带宽限制为每月 100 GB，部署时间限制为 10 分钟，默认构建有频率限制；使用自定义 Actions 工作流时部分构建限制不同；
- [Next.js 静态导出](https://nextjs.org/docs/app/guides/static-exports)：配置 `output: 'export'` 后，`next build` 将静态文件生成到 `out`；需要 Node.js 服务或动态请求处理的能力不受静态导出支持；
- [Giscus](https://giscus.app/)：评论依赖公开 GitHub 仓库、开启 Discussions、安装 giscus App，访客通过 GitHub Discussions 参与评论。

### 1.4 当前仓库可见性风险

当前源仓库为私有仓库。按照 GitHub Free 的 GitHub Pages 规则，零费用发布通常需要：

- 将当前仓库公开；或
- 使用一个公开的 GitHub Pages 部署仓库。

公开仓库意味着源代码、Markdown 内容、页面结构和 Git 历史可能被任何人查看。公开仓库不是本计划自动执行的动作，必须由所有者明确授权。

默认优先方案：所有者明确允许后，将当前仓库改为公开并启用 GitHub Pages。若不允许公开源代码，则保留私有源仓库，并由所有者另外准备公开部署仓库；这条路线会增加 Actions、发布令牌和同步流程，不作为第一优先。

## 2. 零费用第一版目标

### 2.1 必须保留的功能

第一版只保留不需要运行时服务器的功能：

| 功能 | 第一版实现 |
| --- | --- |
| 首页 | 静态 HTML/CSS/JS |
| About | Git 中维护的公开资料；未提供资料时保持中性占位 |
| 博客 | Git 管理 Markdown，构建时生成静态文章页 |
| 资源库 | 静态资源目录和公开下载链接；只放允许公开的小文件或外部公开链接 |
| 导航 | 普通静态链接 |
| 视觉系统 | Wii 首页、iBooks 书架、移动端响应式布局 |
| SEO | 构建时生成 title、description、canonical、robots、sitemap、favicon、OG 图片 |
| 错误页 | 静态 404 页面 |
| 发布 | GitHub Actions 构建并部署到 GitHub Pages |

### 2.2 第一版删除或暂停的功能

下列功能依赖 Node.js、数据库、私密环境变量或服务端写入，暂时从第一版删除：

- 管理员密码登录；
- HMAC 管理员会话 Cookie；
- 评论 API；
- 评论审核队列；
- Supabase Postgres 运行时访问；
- Supabase service-role key；
- Supabase anon key；
- 私有 Storage bucket；
- 管理员上传；
- 服务端文件下载路由；
- 资源删除 API；
- rate-limit RPC；
- 跨源写入防护；
- 生产 live test；
- 需要服务器的实时数据读取。

这些能力不是永久禁止。将来如果需要动态功能，再恢复 Render/Railway/VPS + Supabase 架构；不能在 GitHub Pages 版本中留下看似可用但实际上失效的登录、上传或评论按钮。

### 2.3 评论处理决策

默认第一版不做评论，以确保完全静态、零费用、零服务端密钥和最少账户依赖。

如果所有者明确需要评论，允许后续增加 Giscus，前提是：

- GitHub Pages 仓库公开；
- 所有者允许开启 GitHub Discussions；
- 所有者允许安装 giscus App；
- 接受评论者需要 GitHub 账户；
- 接受评论内容存储在 GitHub Discussions，而不是 Supabase；
- 页面增加第三方脚本后重新进行隐私、控制台、键盘和移动端验收。

Giscus 不是第一版阻塞项，也不能冒充传统管理员审核系统。若需要严格人工审核、匿名评论、复杂限流或私有评论，必须回到可运行服务端方案。

### 2.4 资源处理决策

第一版资源库只允许：

- 已获所有者批准公开的资源；
- 小体积、非敏感、不可执行的文件；
- 通过 GitHub Pages 静态 URL 或明确的公开外部 URL 访问；
- 不包含密码、token、私人文档、数据库备份或内部配置。

删除动态上传能力后，资源更新改为 Git 提交。资源条目可使用 `content/resources` Markdown/JSON，文件可放在 `public/resources`；如果文件过大，则只提供外部公开链接或暂不发布。

## 3. 最终完成标准

只有以下条件全部满足，才可宣布“GitHub Pages 零费用第一版完成”：

1. 所有者确认仓库公开范围和 GitHub Pages 发布方式；
2. Next.js 静态导出成功，生成 `out`；
3. 构建结果只包含 HTML、CSS、JavaScript、图片、字体和公开资源；
4. 构建过程中没有依赖运行时 Node.js API、Cookie、POST API、数据库或生产 secret；
5. GitHub Actions 成功发布到 Pages；
6. GitHub Pages URL 返回网站，而不是 README、Actions 日志或构建错误；
7. 首页、About、博客列表、全部文章、资源库和 404 页面可访问；
8. 页面链接、静态资源路径和 project-site base path 正确；
9. canonical、robots、sitemap、favicon 和 OG 图片使用最终 GitHub Pages URL；
10. 桌面和 390px 移动视图无横向溢出；
11. 键盘 Tab、Enter、焦点可见性和 reduced-motion 检查通过；
12. 浏览器 Console 没有未处理异常、资源 404 或 hydration 错误；
13. 没有管理员登录、上传、动态评论或其他失效控件；
14. 没有密钥、私密资料、测试数据或运行时文件进入公开仓库/Pages 产物；
15. About 内容全部来自所有者批准资料，不能编造真实身份；
16. `docs/PLAN.md`、`docs/ARCHITECTURE.md`、`docs/DECISIONS.md`、`docs/PROGRESS.md` 与实际实现一致。

## 4. 零费用目标架构

### 4.1 目标数据流

```text
GitHub repository
      ↓ push
GitHub Actions
      ↓ npm ci && npm run build
Next.js static export: out/
      ↓ upload-pages-artifact
GitHub Pages
      ↓
访客浏览器
```

第一版没有以下运行时链路：

```text
浏览器 → Next.js server → Supabase API
浏览器 → 管理员登录 API
浏览器 → 上传 API → Private Storage
```

### 4.2 目标目录

计划目标：

```text
app/
  (public)/
    page.tsx
    about/page.tsx
    blog/page.tsx
    blog/[slug]/page.tsx
    library/page.tsx
  icon.svg
  not-found.tsx
  public/opengraph-image.svg
  robots.ts
  sitemap.ts
components/
  site-header.tsx
content/
  blog/
  resources/
public/
  resources/
.github/
  workflows/
    deploy-pages.yml
next.config.ts
package.json
docs/
```

第一版删除或移出静态构建范围：

```text
app/api/**
app/admin/**
app/uploads/**
components/admin-console.tsx
components/comment-section.tsx（除非改成 Giscus）
lib/auth.ts
lib/request-security.ts
lib/store.ts
lib/supabase.ts
scripts/run-live-production-tests.mjs
scripts/run-supabase-contract-tests.mjs
```

是否物理删除旧动态代码，需要根据 Git 历史和所有者意愿决定。最低要求是这些文件不能被静态导出构建引用，也不能在公开页面上产生失效入口。更稳妥的方式是先移动到明确的 `legacy/server-only/` 目录并从 Next.js 路由树移除，待第一版验收完成后再决定是否删除。

## 5. 页面与内容模型

### 5.1 页面清单

| 路径 | 目标 | 状态 |
| --- | --- | --- |
| `/` | 门户首页和入口 | 必须静态化 |
| `/about/` | 批准的个人资料和外链 | 必须静态化 |
| `/blog/` | 文章索引 | 必须静态化 |
| `/blog/[slug]/` | 构建时生成的文章页 | 必须提供 `generateStaticParams` |
| `/library/` | 静态资源目录 | 必须静态化 |
| `/404.html` | GitHub Pages 404 | 必须存在 |
| `/robots.txt` | 静态 robots | 必须存在 |
| `/sitemap.xml` | 静态 sitemap | 必须存在 |
| `/icon.svg` | 静态图标 | 必须存在 |
| `/opengraph-image.svg` | 静态分享图 | 必须存在 |

### 5.2 About 页

没有所有者批准资料前：

- 使用中性展示名；
- 不写真实姓名；
- 不写推测的职业、学校、所在地或履历；
- 不放未经批准的 GitHub、邮箱、社交账号；
- 可以显示“个人资料待所有者补充”；
- 不能用网络搜索结果拼接真实身份。

收到批准资料后：

1. 只写允许公开字段；
2. 外链逐个检查 HTTPS、目标和显示名称；
3. 邮箱只有在明确允许公开时才使用 `mailto:`；
4. 更新页面和 metadata；
5. 更新决策和进度记录，但不把未公开信息写进 Git。

### 5.3 博客内容

- 继续使用 `content/blog/*.md`；
- 构建时读取 Markdown；
- 不从 Supabase 读取文章；
- 删除或替换所有 `force-dynamic`；
- `blog/[slug]` 必须生成 `generateStaticParams`；
- 找不到 slug 时构建/访问显示静态 404；
- 文章正文只使用安全的静态 Markdown 转换方式；
- 不把评论区作为文章构建前的必要数据源；
- 文章中的外部链接必须明确标识为外部链接。

### 5.4 资源目录

建议新增：

```text
content/resources/
public/resources/
```

每个资源条目至少有：

- title；
- description；
- type；
- size（如果是本地文件）；
- href；
- visibility 固定为 public；
- source/attribution（如果适用）。

静态资源检查：

- 只放公开批准文件；
- 禁止可执行文件、含密码压缩包和私密资料；
- 服务器端 5 MB 校验不再存在，因此发布前由 Git/检查脚本限制大小；
- 不把 `.env`、`.data`、`.vercel`、`supabase/.temp`、研究快照放入公开 Pages 产物；
- 资源链接不能指向管理 API；
- 删除资源通过 Git 提交完成。

## 6. 阶段 A：冻结当前状态和确定公开边界

### A-1. 保存工作树基线

执行：

```powershell
git status --short
git diff --stat
git log -5 --oneline
git branch --show-current
```

要求：

- 保留现有用户修改；
- 不执行 `git reset --hard`、`git checkout --` 或宽范围删除；
- 不覆盖现有 Vercel/Render/Supabase 配置文件；
- 先完成静态迁移分支或明确的提交边界；
- 任何动态代码移除都要能从 Git 历史恢复。

### A-2. 所有者必须决定的事项

在实际启用 GitHub Pages 前，所有者必须决定：

1. 当前仓库是否公开；
2. 如果不公开，是否准备单独的公开 Pages 仓库；
3. GitHub Pages 使用 user site 还是 project site；
4. 最终 URL；
5. 是否保留评论；
6. 是否保留资源下载；
7. About 页哪些资料公开；
8. 是否接受 GitHub Discussions/Giscus；
9. 是否允许 GitHub Actions 修改 Pages 部署；
10. 是否接受 GitHub Pages 默认域名，是否已有自定义域名。

没有公开授权时，可以继续完成代码静态化和本地验收，但不能打开公开 Pages 或改变仓库可见性。

## 7. 阶段 B：静态化 Next.js 应用

### B-1. 读取当前 Next.js 指南

修改前重新读取：

- `AGENTS.md`；
- `docs/ARCHITECTURE.md`；
- `docs/DECISIONS.md`；
- `docs/PROGRESS.md`；
- `node_modules/next/dist/docs/` 中静态导出、路由、metadata 和图片相关指南；
- [Next.js Static Exports](https://nextjs.org/docs/app/guides/static-exports)。

### B-2. 配置静态导出

目标配置：

```ts
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
```

实际修改前要根据当前 Next.js 版本指南确认：

- `output: "export"` 的当前写法；
- `trailingSlash` 是否适合 GitHub Pages；
- 是否需要 `basePath`；
- `next/image` 是否需要 `unoptimized: true` 或自定义 loader；
- `app/opengraph-image.tsx` 是否能在静态导出阶段生成；
- 如果不能，将 OG 图转为仓库内的静态 SVG/PNG；
- 构建产物是否生成到 `out/`。

### B-3. project site base path

如果使用项目站点：

```text
仓库：WorseFive/PersonalWeb
URL：https://worsefive.github.io/PersonalWeb/
basePath：/PersonalWeb
```

必须验证：

- 导航链接不会丢失 `/PersonalWeb`；
- CSS、JS、favicon、OG、sitemap、robots 和资源路径带有正确前缀；
- 浏览器直接访问深层页面不会出现资源 404；
- metadata canonical 包含 project-site 前缀；
- 文章和资源链接在本地开发与 Pages 生产环境都可用。

如果使用 user site：

```text
仓库：<owner>.github.io
URL：https://<owner>.github.io/
basePath：空
```

只能在所有者拥有并授权使用相应仓库名称时采用。

### B-4. 移除服务器依赖

静态导出前必须审查并处理：

- `export const dynamic = "force-dynamic"`；
- `runtime = "nodejs"`；
- `cookies()`、`headers()`；
- 依赖 `Request` 的动态 Route Handler；
- POST、PATCH、DELETE API；
- Server Actions；
- `node:fs`、`node:crypto` 在页面运行时的依赖；
- Supabase service-role 初始化；
- 从 `process.env` 读取生产 secret；
- 依赖运行时数据库的 library/blog/comment 数据；
- 任何读取本地 `.data` 的页面；
- `ImageResponse` 不能静态生成时的 OG 路由。

处理结果必须是：构建期可以读取 Git 中的公开内容，发布后只需要浏览器加载静态文件。

### B-5. 清理失效入口

必须检查首页、导航、About、blog、library 和 footer：

- 删除或替换 admin 登录入口；
- 删除或替换 uploads 入口；
- 删除评论提交表单；
- 删除“控制室”“上传”“审核”等会让访客误以为功能可用的控件；
- 如果保留说明文字，明确写“第一版通过 Git 提交更新”；
- 任何按钮都必须是真实有效链接或真正可操作的静态 UI；
- 不保留返回 404/500 的管理 API 链接。

## 8. 阶段 C：内容与公开资源迁移

### C-1. 博客迁移

- 保留现有 3 篇 Markdown；
- 验证 frontmatter、slug、日期、标题、摘要和标签；
- 让列表页和正文页都只读取 Git 内容；
- 为所有 slug 生成静态参数；
- 添加一个不存在 slug 的 404 验收；
- 文章页不执行数据库查询；
- 文章页不渲染动态评论组件。

### C-2. About 内容

- 在资料未批准前保持中性占位；
- 收到资料后再进行小范围内容补丁；
- 不通过搜索推断真实姓名；
- 不把 `WorseFive` 自动当作真实姓名；
- 所有外链必须来自所有者批准输入；
- 更新 canonical/OG 文案前检查是否扩大公开范围。

### C-3. 静态资源

如果第一版保留资源下载：

1. 创建 `content/resources`；
2. 创建 `public/resources`；
3. 只复制已批准公开文件；
4. 为每个文件生成静态链接；
5. 在构建检查中限制单文件大小；
6. 检查文件名、Content-Type、路径和 URL 编码；
7. 使用公开 URL 访问时接受“任何人都能下载”；
8. 禁止把私有 Storage、管理员下载路由或 Supabase key 放入页面；
9. 在 Git 历史中检查没有误提交敏感文件。

如果所有者不需要下载，资源库改为公开资源链接目录，进一步降低仓库体积和风险。

## 9. 阶段 D：GitHub Pages 工作流

### D-1. 创建官方 Pages workflow

新增 `.github/workflows/deploy-pages.yml`，使用 GitHub 官方 Actions：

- `actions/checkout`；
- `actions/setup-node`；
- `actions/configure-pages`；
- `actions/upload-pages-artifact`；
- `actions/deploy-pages`。

工作流必须包含：

- push 到发布分支时触发；
- 可选的手动 `workflow_dispatch`；
- `permissions.contents: read`；
- `permissions.pages: write`；
- `permissions.id-token: write`；
- build 和 deploy 分离或明确有序；
- concurrency，避免并发部署覆盖；
- `npm ci` 使用 lockfile；
- `npm run build`；
- 上传 `out` 目录；
- 不上传工作树根目录；
- 不输出 secret；
- 失败时让 Actions 明确失败。

### D-2. 版本和依赖

- 固定 Actions major version；
- 固定 Node.js 主版本，和本地验证版本一致；
- 保留 `package-lock.json`；
- 删除静态版不需要的 `@supabase/supabase-js`，除非后续代码仍有合法构建用途；
- 删除或重命名仅服务端测试脚本；
- 增加静态测试脚本，例如 `npm run test:static`；
- 不把 Playwright、Supabase CLI 或 Render CLI 作为生产构建依赖；
- 依赖变化后重新执行 `npm ci`、typecheck、build 和静态测试。

### D-3. GitHub Pages 设置

所有者在 GitHub 页面确认：

1. 仓库可见性符合 GitHub Free Pages 资格；
2. Settings → Pages；
3. Source 选择 GitHub Actions；
4. workflow 权限允许 Pages 部署；
5. Actions 可以读取仓库；
6. 若使用 project site，URL 和 `basePath` 一致；
7. 若使用自定义域名，明确授权后再添加 DNS/CNAME；
8. 不启用任何未经确认的付费功能。

### D-4. 公共仓库安全

公开仓库启用 Pages 前检查：

- 没有 `.env.local`；
- 没有 `.env.*.local`；
- 没有 `.data/`；
- 没有 `.vercel/`；
- 没有 `supabase/.temp/`；
- 没有 service-role key、JWT、密码、Cookie secret；
- 没有私人 About 资料；
- 没有私人上传文件；
- 没有内部 IP、部署 token 或调试日志；
- Actions 日志不打印变量值；
- 静态 JS bundle 中没有服务端变量；
- `research/` 快照是否公开已由所有者决定。

## 10. 阶段 E：静态测试和本地验收

### E-1. 本地命令

第一版静态质量门：

```powershell
npm ci
npm run check:project
npm run check:release
npm run typecheck
npm run test
npm run build
npm run test:static
```

如果 `check:release` 仍然专门检查 Supabase/server boundary，应改为静态发布边界检查，或者明确把旧动态检查移到 legacy 分支，不让静态版检查产生误导。

### E-2. 静态产物检查

`npm run test:static` 至少检查：

- `out/index.html` 存在；
- `out/about/index.html` 存在；
- `out/blog/index.html` 存在；
- 每个 Markdown slug 都有 `out/blog/<slug>/index.html`；
- `out/library/index.html` 存在；
- `out/404.html` 或等价 404 产物存在；
- `out/robots.txt` 存在；
- `out/sitemap.xml` 存在；
- favicon 存在；
- OG SVG 存在并能被静态 URL 访问；
- HTML 不包含 `SUPABASE_SERVICE_ROLE_KEY`、`ADMIN_PASSWORD`、`SESSION_SECRET`、`RATE_LIMIT_SECRET`；
- HTML 不包含动态管理入口；
- 资源链接都在允许范围内；
- `out` 不包含 `.env`、`.data`、`.vercel`、`.git` 或研究私密目录；
- project-site URL 前缀一致；
- 文件大小没有超过 GitHub Pages 计划上限或项目自定义阈值。

### E-3. 本地静态服务器

不能只打开 `file://` 验收。使用静态服务器模拟 Pages：

```powershell
npx --yes serve out
```

或者使用仓库允许的等价静态服务器，然后验证：

- 首页；
- About；
- blog；
- 每篇文章；
- library；
- 404；
- robots；
- sitemap；
- favicon；
- OG image；
- 深层 URL；
- project-site base path。

### E-4. 浏览器验收

桌面至少使用 1440×900，移动端至少使用 390×844。

每个页面检查：

- HTTP/静态服务器返回成功；
- 没有页面空白；
- 没有 Next.js error boundary；
- 没有资源 404；
- 没有 hydration error；
- 没有 Console uncaught exception；
- `scrollWidth <= clientWidth`；
- 标题、正文、卡片和链接不被裁切；
- 长标题和长链接可换行；
- 图标和图片有正确路径；
- 404 页面可理解；
- 不出现失效登录、上传、审核或评论按钮。

### E-5. 键盘和可访问性

只用键盘检查：

- Tab 顺序合理；
- Shift+Tab 可逆；
- Enter 激活链接；
- 当前焦点清晰可见；
- 跳过链接能到达主内容；
- 导航有名称；
- 标题层级合理；
- 链接文本能说明目标；
- 外部链接有清晰提示；
- 不依赖 hover 才能使用；
- `prefers-reduced-motion: reduce` 下无必要动画；
- 文本对比度适合阅读；
- 390px 下无水平滚动。

## 11. 阶段 F：线上 GitHub Pages 验收

### F-1. 发布后公开路径

发布后确认：

```text
https://<owner>.github.io/<repository>/
```

如果使用 user site：

```text
https://<owner>.github.io/
```

必须记录：

- 仓库；
- 分支；
- Actions workflow run；
- commit SHA；
- Pages URL；
- 发布时间；
- 最终 `SITE_URL`；
- project-site `basePath`；
- 失败时的 Actions 日志摘要。

### F-2. 页面与资源

线上逐个打开：

```text
/
/about/
/blog/
/blog/the-library-is-a-user-interface/
/blog/notes-on-controlled-sharing/
/blog/a-shelf-is-not-a-dashboard/
/library/
/robots.txt
/sitemap.xml
/favicon.ico 或 /icon.svg
/opengraph-image.svg
/不存在的页面
```

如果实际 slug 与清单不同，以 `content/blog` 为准。

### F-3. 静态 SEO

确认：

- title；
- description；
- canonical；
- favicon；
- Open Graph title；
- Open Graph image；
- robots；
- sitemap；
- sitemap URL 和 canonical URL 都包含正确 project-site 前缀；
- 不出现 localhost、127.0.0.1、Vercel URL、Render URL 或 Supabase URL；
- 管理/上传/API 路径不出现在 sitemap；
- 404 返回 Pages 可接受的 404 页面内容。

### F-4. 无服务器功能验收

必须确认页面没有声称以下功能已上线：

- 管理员登录；
- 评论审核；
- 动态评论提交；
- 管理员上传；
- 私有下载；
- Supabase 数据库读写；
- 用户账户；
- 私有资源。

如果保留 Giscus：

- 公开仓库已开启 Discussions；
- giscus 配置对应正确仓库；
- 未登录访客看到正确提示；
- GitHub 登录后可发表评论；
- 评论区域在 390px 正常；
- Console 无脚本错误；
- 明确记录评论不由 PersonalWeb 自己的管理员 API 管理。

## 12. 阶段 G：安全与隐私验收

### G-1. 公开内容审查

发布前逐个检查：

- About 真实姓名是否获得批准；
- 所在地、学校、工作单位是否获得批准；
- 邮箱和社交账号是否获得批准；
- 博客是否包含私人信息；
- 资源是否允许公开下载；
- Git 历史是否有秘密；
- 图片 EXIF 是否包含不应公开的地理信息；
- 资源文件是否包含私人元数据；
- 公开仓库 Issues、Discussions 和 Actions 是否泄露内部信息。

### G-2. 静态站安全边界

- GitHub Pages 不承载密码输入；
- 不把 GitHub Pages 当作敏感交易站点；
- 不在前端放 service-role key；
- 不把任何“隐藏字段”当作权限；
- 不把私有文件放到 `public/`；
- 不依赖 URL 难猜来保护文件；
- 不保留失效的管理 API；
- 所有公开数据都视为任何人可下载；
- 若未来恢复动态功能，必须使用服务端主机和 Supabase RLS，不能在 Pages 上模拟权限。

### G-3. 依赖和 Actions

- Actions 使用官方或可信固定版本；
- 定期检查依赖安全告警；
- workflow 最小权限；
- 不把 token 写入 YAML；
- 不把 secret 传给不需要的步骤；
- Actions 日志不打印环境变量；
- pull request 来自不受信任分支时，不把高权限 secret 暴露给代码执行；
- 公开仓库开启必要的分支保护和审查规则；
- 不因部署失败而临时放宽权限到 `write-all)。

## 13. 阶段 H：回滚和故障处理

### H-1. Actions 构建失败

按顺序检查：

1. workflow YAML 语法；
2. Node 版本；
3. `npm ci`；
4. 静态导出配置；
5. 动态路由是否提供静态参数；
6. metadata/OG 是否包含运行时逻辑；
7. project-site base path；
8. `out` 目录是否生成；
9. 上传 artifact 路径；
10. Pages environment 权限。

修复后重新运行本地静态构建和 Actions，不能只重跑失败任务而跳过本地验证。

### H-2. 页面资源 404

检查：

- `basePath`；
- `trailingSlash)；
- 绝对路径和相对路径；
- CSS/JS/static image 引用；
- favicon/OG/robots/sitemap；
- project-site URL；
- 大小写；
- URL 编码；
- GitHub Pages 对不存在路由的回退行为。

### H-3. 版本回滚

- Pages 发布以 Git commit 为单位；
- 找到上一个已验收 commit；
- 使用 GitHub Actions 重新发布该 commit；
- 不删除 Git 历史；
- 不删除 Supabase 项目或旧 Vercel/Render 资源；
- 如需要回滚正式域名，必须由所有者授权 DNS 修改；
- 记录回滚原因、时间、commit 和影响。

### H-4. 动态功能恢复条件

只有在所有者重新确认以下事项后，才恢复 Render/Railway/VPS + Supabase：

- 愿意接受可能的付费或账户验证；
- 需要管理员、评论审核、上传或私有文件；
- 有合法的服务端运行环境；
- 接受重新配置 secrets；
- 接受再次运行 RLS、live test 和浏览器验收；
- 明确不把 service-role key 放入 Pages。

## 14. 外部阻塞与解除条件

### 阻塞一：仓库必须公开才能免费使用 Pages

现状：当前仓库为私有。GitHub Free 的 Pages 资格通常要求公开仓库。

解除方式：

- 所有者授权公开当前仓库；或
- 所有者准备公开部署仓库；或
- 所有者接受 GitHub Pro/Team（但这不符合零付费第一原则，不默认采用）。

代理不能擅自改变仓库可见性。

### 阻塞二：GitHub Pages 只能静态托管

现状：当前动态 API、管理员登录、Supabase 运行时访问和上传路由不能原样运行。

解除方式：

- 接受本计划的静态功能削减；或
- 改用 Render/Railway/VPS 等 Node.js 托管。

默认选择静态削减，以满足零费用第一原则。

### 阻塞三：About 内容缺失

解除方式：所有者提供批准的展示名、简介和外链。没有批准内容时保持中性占位。

### 阻塞四：Giscus 需要公开仓库和 GitHub Discussions

解除方式：所有者明确同意公开仓库、开启 Discussions、安装 giscus App，并接受 GitHub 登录评论。否则第一版不做评论。

## 15. 阶段状态总表

| 阶段 | 完成标准 | 当前状态 | 下一步 |
| --- | --- | --- | --- |
| A 基线/公开边界 | 工作树、安全和仓库可见性决定完成 | 本地完成；公开范围待所有者决定 | 确认 Pages 仓库路线 |
| B Next 静态化 | `output: export`、动态功能清理、静态构建通过 | 本地完成 | 固化公开内容并复核静态输出 |
| C 内容资源 | 博客/About/资源静态源完成 | 博客完成；About待批准；资源默认为空 | 补充批准资料/资源 |
| D Pages workflow | 官方 Actions 构建并发布 `out` | workflow 已添加；线上运行待授权 | 配置 Pages 并触发 workflow |
| E 本地验收 | 静态产物、链接、桌面/390px、键盘通过 | 构建与产物检查完成；浏览器 QA 待执行 | 启动静态服务器做浏览器验收 |
| F 线上验收 | GitHub Pages URL 全部页面和 metadata 通过 | 待 Pages 发布 | 发布后验收 |
| G 安全收口 | 无密钥、无私密内容、公开边界正确 | 本地静态边界检查完成；公开前审查待执行 | 审查公开仓库内容和历史 |
| H 回滚/文档 | 回滚方式和文档记录完成 | 文档已同步；Pages commit/URL 待记录 | 发布后写入 commit/URL |

## 16. 当前下一步执行清单

按以下顺序执行：

1. 所有者确认当前 `WorseFive/PersonalWeb` 是否允许公开；
2. 如果允许公开，确定使用 project site：`https://worsefive.github.io/PersonalWeb/`；
3. 如果不允许公开，确认是否准备单独公开 Pages 部署仓库；
4. 决定第一版是否完全删除评论，默认删除；
5. 决定资源库是静态下载还是仅公开链接，默认仅发布批准的小文件/链接；
6. 为当前 Next.js 版本确认静态导出配置和 project-site base path；
7. 移除动态 API、管理员、上传和 Supabase 运行时引用；
8. 将 blog、About 和 library 改为只读静态数据；
9. 将 OG 图片改为静态构建产物；
10. 添加 GitHub Actions Pages workflow；
11. 添加静态产物检查和链接检查；
12. 本地运行 `npm ci`、`npm run typecheck`、`npm run build` 和静态测试；
13. 所有者在 GitHub Settings → Pages 选择 GitHub Actions；
14. 发布到 GitHub Pages 临时/默认 URL；
15. 完成公开页面、404、SEO、桌面、390px、键盘、焦点、控制台和溢出验收；
16. 接收并写入 About 批准资料；
17. 重新构建并验收正式内容；
18. 检查公开仓库、Actions 日志和 `out` 产物没有秘密；
19. 更新全部连续性文档；
20. 只有所有完成标准满足后，才宣布零费用 GitHub Pages 版本完成。

## 16.1 已执行的静态迁移工作

截至 2026-08-29，以下本地任务已经执行并通过对应的构建验证：

- `next.config.ts` 已启用 `output: "export"`、`trailingSlash: true`、project-site `basePath` 配置和静态图片策略；
- 动态 API、管理员、上传页面、评论组件、Supabase 运行时适配器和相关类型已移入 `legacy/server-only/`，不再进入静态路由树；
- 首页、About、博客详情和资源库已改为只读静态内容；
- 首页和导航已移除 Admin/Control Room 失效入口；
- 博客详情使用 `generateStaticParams` 和 `dynamicParams = false`；
- OG 图片已改为仓库内的 `public/opengraph-image.svg`，不再依赖 `ImageResponse` 运行时路由；
- `robots.txt`、`sitemap.xml` 已明确使用静态生成模式，并按 project-site URL 生成；
- 新增 `lib/resources.ts`，资源列表默认为空，待所有者批准后通过 Git 添加公开资源；
- 新增 `scripts/test-static.mjs`，检查静态路由、文章、资源、base path、sitemap、秘密字符串和动态失效入口；
- 新增 `.github/workflows/deploy-pages.yml`，使用 GitHub 官方 Pages Actions 构建并发布 `out/`；
- `npm run verify` 已切换为静态版完整本地质量门。

本地静态构建已经生成 `out/`，包含首页、About、博客列表、3 篇文章、资源库、404、robots、sitemap、icon 和 OG SVG。尚未完成的不是本地代码主链路，而是所有者授权的 GitHub 仓库公开范围、GitHub Pages 设置、实际 Actions 运行和线上浏览器验收。

## 17. 以后可选升级

以下不是零费用第一版任务：

- Giscus GitHub Discussions 评论；
- Render/Railway/VPS 服务端；
- Supabase 数据库、RLS 和 private Storage；
- 管理员登录和评论审核；
- 服务器端上传；
- 私有资源下载；
- 自定义域名 DNS；
- 监控、备份、日志和防滥用系统。

任何升级都必须重新记录费用、账户、公开边界、数据处理、密钥和验收标准。
