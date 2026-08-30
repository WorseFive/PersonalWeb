# PersonalWeb Editor

PersonalWeb Editor 是一个 Windows 本地优先内容编辑器。它把文章和公开资源写入本地 PersonalWeb Git 仓库，再由 GitHub Actions 构建并发布到 GitHub Pages。

## 使用方式

在 `D:\PersonalWeb` 根目录运行：

```powershell
npm run editor:install
npm run editor:check
npm run editor:build
```

如果已安装 Rust、Visual Studio Build Tools、WebView2 和 Tauri CLI，在 `D:\PersonalWeb\editor` 运行：

```powershell
cargo tauri dev
cargo tauri build
```

构建产物位于 `editor/src-tauri/target/release/`：

- `personalweb-editor.exe`：应用本体；
- `bundle/nsis/PersonalWeb Editor_0.1.0_x64-setup.exe`：NSIS 安装包；
- `bundle/msi/PersonalWeb Editor_0.1.0_x64_en-US.msi`：MSI 安装包。

## 发布流程

1. 选择并检查本地仓库；
2. 在博客或公开资源页编辑内容；
3. 保存到仓库；
4. 运行 `npm run verify`；
5. 查看允许目录的状态和 diff；
6. 勾选公开内容确认和 diff 确认；
7. 输入提交说明并点击提交；
8. 再次确认后点击推送；
9. 到 GitHub Actions 查看 Pages 构建结果。

## 上传 PDF 到 Library

在右侧“检查与发布”区域使用“PDF → Library”表单：

1. 填写本地 PDF 的绝对路径；
2. 填写公开标题、描述和来源名称；
3. 点击“上传 PDF 并生成 Library 条目”；
4. 编辑器会生成 public/resources/<slug>.pdf 和 content/resources/<slug>.md；
5. 运行验证、检查 diff，确认公开内容后再提交和推送。

只接受真实 PDF 文件头为 %PDF- 且不超过 5 MiB 的文件。GitHub Pages 是公开静态托管，上传的 PDF 会被任何获得网址的人下载；不要选择私人或敏感文件。当前 GitHub 仓库审计没有发现可同步的 PDF，因此 Library 仍可为空。

编辑器不会保存 GitHub Token，也不会把 token 写入 localStorage、项目文件或日志。推送使用本机 Git 已配置的凭据、SSH 或 Git Credential Manager。

## 文件安全边界

Rust 命令层只允许访问：

- `content/blog/**/*.md`；
- `content/resources/**/*.md`；
- `public/resources` 中的 `png`、`jpg`、`jpeg`、`webp`、`gif`、`pdf`。

`.git`、`.env*`、`.data`、`.vercel`、`supabase/.temp`、`.github/workflows`、`legacy/server-only`、任意应用代码和任意路径均被拒绝。文本上限为 2 MB，公开资源单文件上限为 5 MB。

这是未签名的本地构建程序，Windows SmartScreen 可能显示提示。使用前可核对构建文件的 SHA-256；不要从未知来源替换安装包。
