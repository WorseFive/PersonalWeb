# PersonalWeb Wii UI 与本地编辑器 EXE 实现报告

更新日期：2026-08-30  
报告性质：方案分析、实施设计与已完成实现记录。

截至 2026-08-30，报告中的核心实施已完成：Wii 首页增强、CSS/Canvas 流体背景、公开资源目录、Tauri 2 编辑器工程、受限文件访问、Git 发布流程、Windows EXE/NSIS/MSI 构建均已落地并通过对应检查。WebGL L2 保留为可选增强，本次没有引入，以避免把高 GPU 占用和额外第三方代码变成发布依赖。

## 1. 执行摘要

本报告评估两个目标：

1. 将 PersonalWeb 的公共界面进一步改造成 Wii 风格，并加入流畅、可控、可降级的流体动画；
2. 增加一个运行在 Windows 本地的编辑器 EXE，用于编辑文章、添加公开资源、预览并发布新内容。

结论是：整体可行，而且可以继续满足“第一原则是不付费、网站托管在 GitHub”的约束，但不能把编辑器理解为“向 GitHub Pages 服务器上传文件”。GitHub Pages 只发布构建后的静态文件，不提供运行时写接口。正确的产品模型是：

```text
本地 Tauri 编辑器 EXE
        ↓ 写入
本地 PersonalWeb Git 仓库
        ↓ 用户确认 commit / push
GitHub Repository
        ↓ GitHub Actions
Next.js Static Export
        ↓
GitHub Pages
```

建议采用以下边界：

- 网站仍使用 Next.js 静态导出和 GitHub Pages；
- Wii 风格先用 CSS、DOM 和轻量 Canvas 完成，WebGL 流体作为增强层，而不是必需层；
- 编辑器第一版使用 Tauri 2 打包 Windows EXE；
- 编辑器默认只允许修改公开内容目录，不允许修改 `.git`、密钥、工作流、服务端遗留代码或任意路径；
- 第一版发布默认采用“预览 diff → 用户明确确认 → 调用本机 Git push”；
- 不在 EXE 中硬编码 GitHub PAT，不把密钥写进项目配置；优先复用本机 Git Credential Manager 或 GitHub CLI 登录状态；
- 暂不恢复评论、管理员登录、Supabase 运行时访问、私有上传和私有下载，因为这些功能与零费用 GitHub Pages 静态边界冲突。

本报告最初是分析阶段文档；在用户授权进入实施后，已按默认方案完成核心代码和本地构建。当前仍不包含 WebGL L2、动态评论、服务端登录、Supabase 运行时和私有上传，这些均不是零费用 GitHub Pages 方案的必要任务。

## 2. 当前基线

### 2.1 已经存在的系统

当前仓库为 `WorseFive/PersonalWeb`，已经公开，并已发布到：

<https://worsefive.github.io/PersonalWeb/>

当前发布链路：

```text
GitHub Repository → GitHub Actions → Next.js Static Export → GitHub Pages
```

现有公共页面包括：

- 首页；
- About；
- Git 管理的 Markdown 博客列表和文章页；
- Library 资源页；
- 404、robots、sitemap、favicon 和 Open Graph 静态资源；
- 响应式桌面端和 390px 移动端布局；
- 键盘焦点和 `prefers-reduced-motion` 支持。

原动态实现仍保存在 `legacy/server-only/`，其中包括管理员登录、评论、审核、上传、下载和 Supabase 适配器，但它不属于当前 GitHub Pages 运行时，也不应被新编辑器直接调用。

### 2.2 已知限制

GitHub Pages 的运行环境只服务静态 HTML、CSS、JavaScript、图片和其他公开静态文件，因此：

- 页面不能依赖 Node.js 服务器持续运行；
- 浏览器不能通过 Pages 向仓库写入文件；
- 不能把 Supabase service-role key 或 GitHub PAT 放入前端；
- 静态资源 URL 默认公开，不能被当成私有下载；
- 内容更新必须通过 Git 提交触发构建；
- 公开仓库中的代码、内容和 Git 历史都必须按公开数据审查。

因此，本报告的“上传”特指编辑器将新内容写入本地仓库并发布，而不是向线上 Pages 运行时执行文件上传。

## 3. 可行性分析

### 3.1 Wii UI：可行性高

Wii 风格主要是视觉系统和交互状态的改变，不要求服务端。可在现有 Next.js 静态页面中实现：

- 圆角频道卡片和网格入口；
- 白色、浅蓝色、玻璃/塑料质感；
- 柔和阴影、内高光、按下状态；
- Wii 风格底部状态栏和频道选择反馈；
- 面向键盘、鼠标和触摸的选中、聚焦、按压状态；
- CSS、Canvas 或 WebGL 背景动画。

主要工作量在于视觉重构、响应式布局、动效性能和可访问性，而不是后端架构。现有项目已经有 Wii/iBooks 基础视觉，因此可以增量改造，不需要推翻路由和内容模型。

### 3.2 流体动画：可行，但必须分级

流体效果可以通过三种层级实现：

| 层级 | 技术 | 适用范围 | 结论 |
| --- | --- | --- | --- |
| L0 | CSS 渐变、伪元素、波浪、光泽扫过 | 所有设备、reduced motion | 必须实现 |
| L1 | 轻量 Canvas 粒子/波纹 | 首页背景、指针/触摸反馈 | 推荐作为默认增强 |
| L2 | WebGL GPU 流体模拟 | 支持 WebGL 的桌面和高性能设备 | 可选增强，不得成为依赖 |

完整 WebGL 流体模拟视觉效果最好，但会带来 GPU 占用、移动端发热、低端设备掉帧、浏览器兼容和维护复杂度。合理设计后仍然可用：

- 只放在背景层，不覆盖正文、导航文字和焦点环；
- 限制设备像素比和模拟分辨率；
- 页面不可见时暂停 `requestAnimationFrame`；
- `prefers-reduced-motion: reduce` 时关闭持续动画；
- WebGL 初始化失败时退回 Canvas 或 CSS；
- 移动端默认使用更低质量或仅使用 CSS；
- 不用动画承载唯一信息，不让动画成为导航前提；
- 以 60 FPS 桌面、30 FPS 低端移动设备为目标，并允许动态降级。

### 3.3 本地编辑器 EXE：可行性高

编辑器运行在用户自己的 Windows 电脑上，可以直接访问用户授权的本地仓库，并调用 Git。它不需要购买服务器，也不需要把管理面板公开到网站上。

最适合当前目标的方案是 Tauri 2：

- 前端可以复用 React/TypeScript 思路；
- 使用系统 WebView，不需要捆绑完整 Chromium；
- 安装包和内存占用通常小于 Electron；
- Rust 命令可以限制文件访问范围；
- 可以打包 Windows `.exe` 或安装程序；
- 适合单用户、本地优先、内容编辑型工具。

Electron 也能实现，但会带来更大的安装包、更高的内存占用和更复杂的 Node.js 权限边界，因此不作为第一推荐。

### 3.4 “编辑后立即上线”：可行，但不是瞬时

编辑器可以完成：

1. 读取本地仓库；
2. 编辑 Markdown 和公开资源元数据；
3. 复制已允许的图片或文件；
4. 做 frontmatter、文件类型、大小和公开安全检查；
5. 显示变更摘要和完整 diff；
6. 用户确认后执行 Git commit 和 push；
7. 展示 GitHub Actions 构建状态和 Pages 发布地址。

GitHub Actions 和 Pages 是异步发布，编辑器应显示“已提交”“构建中”“发布成功”“构建失败”四种状态，不能假设 push 完成就代表线上已经更新。

## 4. 网上案例与版权边界

已下载的案例保存在临时目录：

`C:\Users\33406\AppData\Local\Temp\PersonalWeb-ui-references`

这些文件仅用于研究，当前没有复制到网站产物或仓库。

### 4.1 Wii 菜单案例

项目：[`cornetespoir/wii-menu-page`](https://github.com/cornetespoir/wii-menu-page)

参考内容：

- Wii 菜单式网格；
- 圆角频道卡片；
- 白蓝色界面、渐变和阴影；
- 基于锚点状态的弹窗思路；
- 底部 Wii 风格状态条。

GitHub API 未识别到明确 SPDX 许可证。因此只能把它当作设计灵感和交互研究，不应直接复制其中代码、图片、字体或其他资源进入 PersonalWeb，除非后续获得明确授权并记录来源。

### 4.2 WebGL 流体模拟案例

项目：[`PavelDoGreat/WebGL-Fluid-Simulation`](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation)

许可证：MIT，集成时需要保留版权和许可证声明。

参考内容：

- GPU 加速的流体模拟；
- 鼠标和触摸交互；
- `requestAnimationFrame` 渲染循环；
- 模拟分辨率、颜色、耗散、Bloom、Sunrays 等参数；
- WebGL 不可用时需要自行设计降级策略。

采用时不建议整仓库无审查复制。应先隔离所需算法，确认依赖、许可证和移动端性能，再以独立的 `components/fluid-background` 组件集成，并将 MIT 文本保存在第三方声明文件中。

### 4.3 Liquid Distortion 案例

项目：[`codrops/LiquidDistortion`](https://github.com/codrops/LiquidDistortion)

参考内容：

- PixiJS 位移图；
- 液态图片切换；
- 页面或封面转场；
- GSAP 时间线动画。

该项目采用自定义授权，并要求保留来源说明；示例图片还涉及 Unsplash 等单独版权边界。因此只作为转场思路参考，不直接把其整套资源打包进个人网站。若未来采用 PixiJS、GSAP 或其代码，必须为每个依赖单独审查许可证和打包体积。

### 4.4 实施中的版权规则

- 案例可以用于研究布局、运动规律和技术思路；
- 未确认许可证的代码不直接复制；
- 示例图片、字体、Logo 和音频不直接使用；
- MIT 代码保留原版权和许可证；
- 自定义授权项目保留署名并遵守再发布限制；
- 所有实际进入仓库的第三方代码和资源都登记到 `docs/SOURCE-LEDGER.md`；
- 目标是“受启发的原创实现”，不是克隆 Wii 系统素材或任天堂商标资产。

## 5. 目标产品形态

### 5.1 公共网站

公共网站继续承担阅读和展示：

- Wii 风格首页作为门户；
- Blog 和 Library 使用统一的频道/书架视觉；
- 流体动画只增强氛围，不承载正文信息；
- 所有内容由 Git 中的 Markdown、元数据和公开资源组成；
- 没有公开管理员入口、失效上传按钮或假装可用的评论表单。

### 5.2 本地编辑器

本地编辑器承担内容生产：

- 选择并记住已授权的 `D:\PersonalWeb` 仓库目录；
- 新建、打开、编辑、预览和删除本地草稿；
- 编辑博客标题、slug、日期、摘要、标签和正文；
- 添加公开资源条目和允许的静态文件；
- 本地执行项目检查和静态构建；
- 展示文件变更、Git diff 和构建结果；
- 由用户明确确认后提交并推送。

编辑器不是通用文件管理器，也不是远程服务器控制台。第一版不允许用户通过它修改任意项目文件。

## 6. Wii UI 详细实施设计

### 6.1 视觉方向

视觉关键词：柔和、明亮、圆润、频道化、轻塑料、蓝色光晕、低压迫感。

建议保留现有 iBooks 书架作为内容页语言，不把所有页面都变成高动态首页。首页负责发现和导航，博客正文负责阅读，Library 负责浏览资源。

### 6.2 组件分层

建议新增或重构为以下组件边界：

```text
components/
  wii-dashboard/
    dashboard-shell.tsx
    channel-grid.tsx
    channel-card.tsx
    status-bar.tsx
  motion/
    fluid-background.tsx
    pointer-ripple.tsx
    reduced-motion.ts
```

实际文件名可以调整，但应保持职责清晰：背景动画不能和导航状态、内容读取或文章渲染耦合。

### 6.3 交互状态

每个频道卡片至少要有：

- 默认状态；
- hover 状态；
- keyboard focus 状态；
- pressed 状态；
- disabled 或不可用状态（若真的存在）；
- reduced-motion 状态；
- 窄屏换行/堆叠状态。

所有卡片必须是真实链接或真实按钮。不能以动效装饰一个没有行为的控件。

### 6.4 动画设计

推荐动画组合：

- 页面进入：低幅度 opacity + transform；
- 频道卡片 hover：轻微上浮、光泽扫过、阴影变化；
- 点击：短促按压回弹；
- 背景：低速渐变漂移或流体光晕；
- 指针交互：局部弱波纹，不追踪或记录用户数据；
- 页面切换：仅使用短时转场，不阻塞导航。

应优先动画 `transform` 和 `opacity`，避免持续改变尺寸、位置和布局属性。动画参数集中为 CSS 变量，便于移动端和 reduced-motion 调整。

### 6.5 流体实现建议

第一轮实现建议使用“CSS + 轻量 Canvas”组合：

- CSS 提供无脚本基础背景；
- Canvas 提供少量粒子、波纹或渐变噪声；
- 使用 `ResizeObserver` 适应容器；
- 监听 `visibilitychange` 暂停和恢复；
- 监听媒体查询实时响应 reduced motion；
- 限制最大 Canvas 尺寸和 DPR；
- 清理事件监听器和动画帧。

只有在 CSS/Canvas 视觉不足且性能测试通过后，才增加 WebGL 流体层。WebGL 版至少需要：

- WebGL 能力检测；
- 初始化失败回退；
- 桌面/移动/低性能档位；
- 页面不可见暂停；
- reduced-motion 关闭；
- GPU 资源清理；
- 不影响文本和焦点可见性。

## 7. 编辑器 EXE 详细实施设计

### 7.1 技术选型

推荐：Tauri 2 + React/TypeScript 编辑器前端 + Rust 文件/Git 命令层。

最低开发环境：

- Node.js 与 npm；
- Rust toolchain；
- Windows WebView2 Runtime；
- Visual Studio Build Tools 的 C++/Windows SDK 组件；
- 本机 Git；
- 可选 GitHub CLI `gh`，用于复用登录状态和查询 Actions。

Tauri 官方参考：

- [Tauri 入门](https://tauri.app/start/)
- [Tauri 安全文档](https://tauri.app/security/)
- [Tauri 发布文档](https://tauri.app/distribute/)

### 7.2 第一版功能范围

第一版应包含：

1. 仓库选择与路径记忆；
2. 仓库状态检查；
3. 博客文章列表；
4. 新建/编辑 Markdown；
5. frontmatter 表单和原始 Markdown 双向编辑；
6. Markdown 预览；
7. 草稿和发布状态；
8. 公开资源元数据编辑；
9. 复制图片/小文件到白名单目录；
10. 本地路径、扩展名、大小和安全扫描；
11. `npm run verify` 检查；
12. Git diff 预览；
13. 用户确认后的 commit；
14. 用户确认后的 push；
15. 发布结果和失败原因展示；
16. 恢复未提交修改的安全提示。

第一版不包含：

- 远程任意文件浏览；
- 直接修改 GitHub Actions workflow；
- 直接修改 `.env` 或密钥；
- 修改 `legacy/server-only`；
- 管理 Supabase 数据库；
- 管理评论审核；
- 线上私有文件上传；
- 后台常驻服务；
- 无确认自动发布。

### 7.3 编辑流程

```text
选择仓库
  ↓
读取并检查仓库状态
  ↓
新建/编辑文章或公开资源
  ↓
实时 frontmatter / 文件安全校验
  ↓
预览页面和 Markdown
  ↓
npm run verify
  ↓
显示 diff、公开范围和构建摘要
  ↓
用户确认 commit
  ↓
用户确认 push
  ↓
轮询 GitHub Actions
  ↓
显示 Pages 发布状态
```

任何一步失败都必须保留本地编辑内容，并给出可执行的恢复建议。

### 7.4 内容模型

博客文章建议继续使用 `content/blog/*.md`，至少包含：

```yaml
title: "文章标题"
slug: "stable-slug"
date: "2026-08-30"
summary: "列表页摘要"
tags:
  - tag
status: draft
```

公开资源建议使用 `content/resources/` 中的结构化记录，并将实际公开文件限制在 `public/resources/`。所有字段都应有白名单和类型校验，slug、文件名和 URL 不能由不受控字符串直接拼接路径。

### 7.5 文件访问安全

Rust 文件层和前端都要执行限制，但真正的边界必须在 Rust 层：

- 规范化并解析仓库绝对路径；
- 目标路径必须位于指定仓库目录内；
- 禁止路径穿越和符号链接逃逸；
- 禁止 `.git`、`.env*`、`.data`、`.vercel`、`supabase/.temp`；
- 禁止 `legacy/server-only`；
- 禁止 `.github/workflows`；
- 第一版只允许 `content/blog`、`content/resources`、`public/resources`；
- 限制文件扩展名和单文件大小；
- 默认拒绝 `.exe`、`.js`、`.html`、`.svg`、`.zip`、`.7z`、数据库备份和凭据文件；
- 复制文件前检查实际字节数和最终目标；
- 不把文件内容上传到第三方服务做“在线预览”。

公开资源必须在提交前明确提示：“发布后任何人都可以下载”。

### 7.6 Git 身份与发布

推荐优先级：

1. 使用本机 Git Credential Manager 已保存的 HTTPS 凭据；
2. 使用用户已经登录的 `gh` CLI；
3. 用户手动配置 SSH key；
4. 只有用户明确选择时才提供临时 PAT 输入，并且不保存到项目文件、日志或 EXE 配置。

编辑器不应把 GitHub Token 写入 localStorage、JSON 配置、日志或 Git remote URL。push 前要展示：

- 当前分支；
- 目标远程仓库；
- 将提交的文件；
- diff 摘要；
- 公开内容警告；
- commit message。

GitHub Contents API 不作为第一版首选，因为它需要处理 token 存储、分支冲突、远程覆盖、Base64 文件传输和网络重试。直接使用本地 Git 更符合本地优先和可回滚目标。

## 8. 分阶段实施计划

### 阶段 0：方案确认与基线冻结

交付：

- 确认 Wii 风格的强度和页面范围；
- 确认编辑器第一版是否包含公开资源文件；
- 确认是否允许编辑器 push；
- 记录 Windows 开发环境；
- 维护当前 GitHub Pages 可用基线。

退出条件：用户确认本报告中的权限边界、零费用边界和第一版范围。

### 阶段 1：视觉系统和状态模型

交付：

- Wii 视觉 token；
- 频道卡片和状态样式；
- 首页布局草图/实现；
- 触摸、鼠标、键盘交互状态；
- reduced-motion 设计；
- 视觉回归截图基线。

退出条件：首页在桌面和 390px 视口中布局稳定，所有主入口可键盘到达。

### 阶段 2：流体动画 L0/L1

交付：

- CSS 降级背景；
- Canvas 轻量波纹或光晕；
- 页面不可见暂停；
- reduced-motion 关闭；
- WebGL 不可用时的回退；
- 性能测量和移动端档位。

退出条件：动画不遮挡内容，低端设备可降级，控制台无错误，持续使用不会明显造成页面卡顿或横向溢出。

### 阶段 3：WebGL 流体可选增强

进入条件：阶段 2 已通过验收，且确实需要更强的流体视觉。

交付：

- MIT 依赖与版权声明（如采用相关代码）；
- WebGL 能力检测；
- 分辨率和 DPR 限制；
- 桌面/移动/低性能配置；
- GPU 资源释放；
- 退回 CSS/Canvas 的完整路径。

退出条件：WebGL 开启和关闭都能完成主要导航和阅读任务，动画不是网站功能依赖。

### 阶段 4：Tauri 编辑器壳和仓库访问

交付：

- Tauri 2 Windows 工程；
- 仓库选择；
- 受限文件读取和写入；
- 路径穿越/符号链接测试；
- Git 状态读取；
- 不保存密钥的配置。

退出条件：编辑器只能访问授权仓库内白名单路径，越权测试全部拒绝。

### 阶段 5：博客和资源编辑

交付：

- frontmatter 表单；
- Markdown 编辑和预览；
- 草稿管理；
- 资源清单编辑；
- 文件类型/大小/公开边界检查；
- 失败时保留草稿。

退出条件：从新建文章到本地预览形成完整闭环，非法 frontmatter 和危险文件不能进入发布准备状态。

### 阶段 6：本地验证和发布

交付：

- 编辑器调用 `npm run verify`；
- diff 审查面板；
- 用户确认 commit/push；
- Actions 状态读取；
- 失败重试和本地恢复提示；
- 发布历史展示。

退出条件：用户可以明确知道哪些文件会公开，并能在 push 前取消；构建失败不会丢失草稿。

### 阶段 7：综合验收与打包

交付：

- 网站桌面/移动/键盘/动画验收；
- 编辑器安装、升级、卸载和重新打开测试；
- 发布成功和失败演练；
- 第三方许可证清单；
- 用户手册；
- EXE/安装包校验哈希。

退出条件：所有强制验收标准通过，且文档与实际代码一致。

## 9. 验收标准

### 9.1 网站功能

- 首页、About、Blog、文章详情、Library 和 404 均可访问；
- 所有站内链接在 `/PersonalWeb` project-site 前缀下正确；
- 深层 URL 直接刷新不丢失 CSS、JS、图标和图片；
- Markdown 文章标题、日期、摘要、标签和正文正确；
- 发布产物不包含后台入口、失效上传表单或伪动态控件；
- GitHub Actions 能从干净 checkout 完成构建并部署。

### 9.2 Wii 视觉

- 首页拥有统一的圆角频道、浅蓝/白色层次、选中/按压/焦点状态；
- 视觉效果不是截图，真实链接和按钮仍可操作；
- 文章正文保持高对比度和阅读优先；
- 书架/资源页不会因为首页动效而变成低可读性纹理页面；
- 1440×900 和 390×844 均无横向溢出；
- 触摸目标足够大，键盘焦点清晰可见。

### 9.3 动画与性能

- 支持 WebGL 时可启用增强效果；
- 不支持 WebGL 时页面仍完整可用；
- `prefers-reduced-motion: reduce` 下关闭持续流体和非必要转场；
- 页面切到后台后动画暂停；
- 动画 Canvas 不拦截正文、链接和键盘焦点；
- 无未处理异常、WebGL context 错误或资源 404；
- 桌面目标接近 60 FPS，移动/低性能档位不持续占满 CPU/GPU；
- 首屏动画不会阻塞主要文字和导航渲染；
- 页面连续打开 5 分钟不会出现明显内存持续增长。

### 9.4 编辑器功能

- EXE 可以选择正确的本地仓库；
- 可新建和编辑 Markdown 文章；
- 可预览最终文章结构；
- 可编辑公开资源元数据；
- 可以识别未提交修改和冲突风险；
- 可以执行本地验证并显示命令失败原因；
- push 前显示完整文件范围和 diff 摘要；
- 没有用户确认时不 commit、不 push；
- Actions 构建中、成功、失败状态显示明确；
- 构建失败时本地文件和草稿仍保留；
- 重启编辑器后未发布草稿不会无提示丢失。

### 9.5 编辑器安全

- 路径穿越、绝对路径越权、符号链接逃逸全部拒绝；
- `.git`、`.env*`、`.data`、`.vercel`、`supabase/.temp`、workflow 和 legacy server 路径不可写；
- 危险扩展名、过大文件、未知二进制和敏感文件默认拒绝；
- GitHub Token 不出现在仓库、日志、配置或前端包中；
- 公开发布前明确提示内容可被任何人查看和下载；
- 编辑器只使用用户当前授权的本地身份，不创建外部账户；
- 发生 Git 冲突、网络中断或构建失败时不自动覆盖远程文件。

### 9.6 发布和回滚

- `npm run verify` 在发布前通过；
- 产物检查确认无密钥、私密数据和禁止路径；
- GitHub Actions 构建失败时不会部署半成品；
- 可通过 Git revert 恢复上一版本；
- 编辑器能显示当前 commit 和最近发布状态；
- 新版动画出现兼容性问题时，可以通过配置或回滚关闭增强层。

## 10. 费用与外部依赖

在以下边界内，方案不需要新增付费服务：

- GitHub 公开仓库和 GitHub Pages；
- GitHub Actions 在个人额度内使用；
- 本地 Tauri 编辑器；
- 本机 Git、Rust、Node.js 和 WebView2；
- 不购买自定义域名；
- 不恢复 Render、Vercel 或 Supabase 生产运行时。

可能产生但不是本方案强制要求的成本：

- 自定义域名；
- GitHub 超出免费额度后的用量；
- 代码签名证书；
- 第三方付费素材或字体；
- 未来动态服务的数据库/服务器费用。

未签名 Windows EXE 可能触发 SmartScreen 警告。第一版可以提供 SHA-256 校验值和源码构建说明；如果未来需要面向更多用户分发，再单独评估代码签名证书。

## 11. 风险与应对

| 风险 | 影响 | 应对 |
| --- | --- | --- |
| WebGL 在旧设备不可用 | 动画缺失或报错 | CSS/Canvas 退回，内容不依赖 WebGL |
| 流体动画耗电/掉帧 | 移动体验下降 | 分档、限 DPR、暂停后台、reduced motion |
| Wii 案例无明确许可证 | 版权风险 | 只研究不复制，原创重写并记录来源 |
| 编辑器误写敏感文件 | 公开泄露 | Rust 层白名单、路径约束、提交前扫描 |
| Git push 失败 | 内容未上线 | 保留本地修改，显示可重试原因 |
| Actions 构建失败 | 线上不更新 | 发布前本地 verify，线上失败保留旧版 |
| Git 冲突 | 覆盖他人变更 | push 前 fetch/status，冲突时停止自动发布 |
| 未签名 EXE 被拦截 | 用户无法启动 | 发布哈希、源码和安装说明，后续再签名 |
| 静态资源被误认为私密 | 信息泄露 | 编辑器和页面明确“公开可下载” |
| 过度追求 Wii 仿真 | 可读性和版权下降 | 采用 Wii-inspired 原创视觉，不复制商标和系统素材 |

## 12. 本次有意不实施的事项

为保持零费用和 GitHub Pages 可部署性，以下不是遗漏，而是明确排除项：

- 直接把 WebGL 流体作为所有设备的必需依赖；
- 将编辑器做成公开在线后台；
- 让编辑器任意修改仓库文件；
- 将 GitHub Token 硬编码或保存到项目配置；
- 恢复 Supabase 运行时；
- 恢复公开评论、管理员登录或私有上传；
- 创建外部账户、购买服务或改变部署平台；
- 将临时下载案例复制到公开仓库；
- 编造 About 页真实姓名、简介和外链。

## 13. 待用户确认事项

开始编码前需要确认以下产品选择：

1. Wii 风格是否只应用于首页和导航，Blog/Library 是否保留 iBooks 书架语言；
2. 流体动画是否默认只做 CSS + Canvas，还是直接加入 WebGL 增强层；
3. 编辑器第一版是否允许添加图片和公开文件，单文件大小上限是否采用 5 MB；
4. 是否允许编辑器执行 Git commit；
5. 是否允许编辑器执行 Git push，还是仅生成修改并由用户在终端手动发布；
6. 是否接受未签名 Windows EXE 的 SmartScreen 提示；
7. About 页需要公开的真实资料和外链（如有）；
8. 是否继续坚持只使用 GitHub Pages，暂不恢复动态评论、认证和私有上传。

上述默认值已经用于本次实现：只改首页 Wii 视觉；CSS + Canvas 默认动画；支持 Markdown 和 5 MB 以内公开资源；编辑器在 diff 和公开内容确认后才允许 commit/push；不保存 token；旧动态代码继续隔离在 `legacy/server-only/`。

## 14. 最终结论

方案可行，且与当前零费用 GitHub Pages 架构兼容。技术上最重要的不是把所有功能塞进一个项目，而是明确两个边界：

- 网站是公开、静态、可回滚的发布产物；
- 编辑器是本地、受限、需确认的内容生产工具。

推荐按“阶段 0 → Wii 状态模型 → CSS/Canvas 动画 → Tauri 编辑器 → 本地 Git 发布 → 综合验收”的顺序实施。先完成可访问、可降级的 Wii 视觉，再逐步加入动画和编辑器；这样即使 WebGL、GitHub 登录或 EXE 分发出现问题，当前网站仍然可以正常访问和发布。

## 15. PDF 上传到 Library 的落地结果

本轮将“公开资源复制”升级为独立的 PDF 发布流程。编辑器的 PDF 表单接收本地路径、标题、描述和来源名称；Rust 命令会校验扩展名、%PDF- 文件头、5 MiB 上限、路径边界和目标冲突，然后同时生成：

- public/resources/<slug>.pdf
- content/resources/<slug>.md

因此 Library 不需要手工再填写 href。失败时不会留下半个发布结果；如果元数据写入失败，新复制的 PDF 会被清理。由于目标是静态 GitHub Pages，发布仍然必须经过 diff 检查、公开内容确认、commit、push 和 Actions 构建。

## 16. GitHub PDF 同步审计

通过 GitHub API 对 WorseFive/PersonalWeb 的 main 递归树进行审计，结果为 0 个 .pdf 文件；本地工作树同样为 0 个 PDF。因此本轮没有可同步的真实 PDF，也没有创建虚假占位文件。项目门禁已实现双向检查，未来只要仓库出现 PDF，就会要求它在 Library 中有对应元数据并在静态输出中存在。

## 17. 本轮验收标准

编辑器 TypeScript、Vite 构建、Rust 单元测试、网站静态检查和完整 npm verify 均应通过；Tauri release build 应继续生成 EXE/NSIS/MSI；部署后应检查 GitHub Actions、首页、Library、所有 PDF URL、桌面/390px、键盘焦点、控制台和横向溢出。真实 PDF 出现前，“全部 PDF 同步”验收以零条目审计证据为准。
