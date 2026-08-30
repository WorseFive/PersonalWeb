import "./style.css";
import { invoke } from "@tauri-apps/api/core";

type RepoStatus = {
  root: string;
  branch: string;
  remote: string;
  clean: boolean;
  changedFiles: string[];
};

type CommandResult = { ok: boolean; output: string };
type UploadedPdf = { public_path: string; metadata_path: string; size: number };

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Editor root element is missing.");

const savedRoot = localStorage.getItem("personalweb.editor.repoRoot") ?? "D:\\PersonalWeb";
app.innerHTML = `
  <main class="editor-shell">
    <header class="editor-header">
      <div>
        <p class="eyebrow">LOCAL PUBLISHING DESK</p>
        <h1>PersonalWeb 编辑器</h1>
        <p class="lede">在本地编辑公开内容，检查变更，再由你确认提交到 GitHub Pages。</p>
      </div>
      <div class="trust-badge"><span class="pulse"></span> 本地优先 · 不保存 Token</div>
    </header>

    <section class="panel repo-panel">
      <div class="section-heading"><div><p class="eyebrow">01 / WORKSPACE</p><h2>选择仓库</h2></div><span id="repo-state" class="state-pill">未连接</span></div>
      <div class="inline-form"><label class="grow">PersonalWeb 仓库目录<input id="repo-root" value="${escapeHtml(savedRoot)}" spellcheck="false" /></label><button id="inspect" class="primary" type="button">检查仓库</button></div>
      <div id="repo-summary" class="status-box muted">编辑器只会访问允许的公开内容目录。</div>
    </section>

    <section class="workspace-grid">
      <section class="panel editor-panel">
        <div class="section-heading"><div><p class="eyebrow">02 / CONTENT</p><h2>编辑内容</h2></div><span class="hint">Markdown + frontmatter</span></div>
        <div class="tabs" role="tablist" aria-label="内容类型"><button class="tab active" data-tab="article" role="tab" aria-selected="true" type="button">博客文章</button><button class="tab" data-tab="resource" role="tab" aria-selected="false" type="button">公开资源</button></div>
        <div id="article-editor" class="tab-panel" role="tabpanel">
          <div class="two-col"><label>文件名<input id="article-path" value="content/blog/new-article.md" spellcheck="false" /></label><button id="load-article" class="quiet" type="button">读取文件</button></div>
          <label>Markdown 内容<textarea id="article-content" rows="19" spellcheck="false">---
title: "新文章"
excerpt: "文章摘要"
date: "2026-08-30"
cover: "blue"
tags: "notes"
---

在这里写下文章正文。</textarea></label>
          <button id="save-article" class="primary" type="button">保存文章到仓库</button>
        </div>
        <div id="resource-editor" class="tab-panel hidden" role="tabpanel">
          <div class="two-col"><label>文件名<input id="resource-path" value="content/resources/new-resource.md" spellcheck="false" /></label><button id="load-resource" class="quiet" type="button">读取文件</button></div>
          <label>资源元数据<textarea id="resource-content" rows="19" spellcheck="false">---
title: "公开资源"
description: "资源说明"
sourceName: "WorseFive"
type: "PDF"
size: ""
href: "/resources/example.pdf"
---</textarea></label>
          <p class="warning">资源发布到 Pages 后任何人都可以查看或下载。请先确认文件和链接可以公开。</p>
          <button id="save-resource" class="primary" type="button">保存资源元数据</button>
        </div>
      </section>

      <aside class="panel release-panel">
        <div class="section-heading"><div><p class="eyebrow">03 / RELEASE</p><h2>检查与发布</h2></div></div>
        <label>复制公开资源文件（可选）<input id="asset-source" placeholder="D:\\path\\to\\approved-file.pdf" spellcheck="false" /></label>
        <label>目标文件名<input id="asset-name" placeholder="guide.pdf" spellcheck="false" /></label>
        <button id="copy-asset" class="quiet full" type="button">复制到 public/resources</button>
        <div class="upload-divider"><span>PDF → Library</span></div>
        <p class="field-help">选择本地 PDF 后，编辑器会同时复制公开文件并自动生成 content/resources 元数据。发布到 GitHub Pages 后任何人都可以下载。</p>
        <label>本地 PDF 路径<input id="pdf-source" placeholder="D:\path\to\approved-file.pdf" spellcheck="false" /></label>
        <label>Library 标题<input id="pdf-title" placeholder="留空则使用文件名" /></label>
        <label>Library 描述<textarea id="pdf-description" rows="3" placeholder="这份 PDF 的公开说明"></textarea></label>
        <label>来源名称<input id="pdf-source-name" value="本地编辑器" /></label>
        <button id="upload-pdf" class="primary full" type="button">上传 PDF 并生成 Library 条目</button>
        <div class="release-actions"><button id="verify" class="quiet full" type="button">运行 npm run verify</button><button id="diff" class="quiet full" type="button">查看允许目录 diff</button></div>
        <div id="output" class="output" aria-live="polite">完成仓库检查后再开始编辑。</div>
        <div class="confirm-box"><p>发布前确认</p><label><input id="confirm-public" type="checkbox" /> 我确认这些变更属于公开内容</label><label><input id="confirm-diff" type="checkbox" /> 我已检查 diff，允许提交和推送</label><label>提交说明<input id="commit-message" value="content: update public material" /></label><button id="commit" class="primary full" type="button" disabled>确认并提交</button><button id="push" class="danger full" type="button" disabled>确认推送到 GitHub</button></div>
      </aside>
    </section>

    <footer class="editor-footer">白名单：content/blog · content/resources · public/resources　|　禁止：密钥、.git、工作流、运行时数据、legacy/server-only</footer>
  </main>
`;

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

function el<T extends HTMLElement>(selector: string) {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing editor element: ${selector}`);
  return element;
}

const rootInput = el<HTMLInputElement>("#repo-root");
const repoState = el<HTMLSpanElement>("#repo-state");
const repoSummary = el<HTMLDivElement>("#repo-summary");
const output = el<HTMLDivElement>("#output");
const commitButton = el<HTMLButtonElement>("#commit");
const pushButton = el<HTMLButtonElement>("#push");
const publicCheck = el<HTMLInputElement>("#confirm-public");
const diffCheck = el<HTMLInputElement>("#confirm-diff");

function root() { return rootInput.value.trim(); }
function showOutput(message: string, error = false) {
  output.textContent = message;
  output.classList.toggle("error", error);
}
function setConnected(status: RepoStatus) {
  repoState.textContent = status.clean ? "已连接 · 干净" : "已连接 · 有修改";
  repoState.className = `state-pill ${status.clean ? "good" : "changed"}`;
  repoSummary.textContent = `${status.root} · 分支 ${status.branch} · ${status.remote || "未配置远程仓库"}${status.changedFiles.length ? ` · ${status.changedFiles.length} 个修改文件` : ""}`;
}
function setReleaseEnabled() {
  const enabled = publicCheck.checked && diffCheck.checked;
  commitButton.disabled = !enabled;
  pushButton.disabled = !enabled;
}
async function call<T>(command: string, args: Record<string, unknown>) {
  try { return await invoke<T>(command, args); }
  catch (error) { throw new Error(String(error)); }
}
async function inspect() {
  showOutput("正在检查仓库……");
  try {
    const status = await call<RepoStatus>("inspect_repository", { root: root() });
    localStorage.setItem("personalweb.editor.repoRoot", root());
    setConnected(status);
    showOutput("仓库可用。编辑器写入权限仍限制在公开内容白名单。 ");
  } catch (error) {
    repoState.textContent = "检查失败";
    repoState.className = "state-pill bad";
    showOutput((error as Error).message, true);
  }
}
async function readFile(path: string, target: HTMLTextAreaElement) {
  try { target.value = await call<string>("read_allowed_file", { root: root(), relativePath: path }); showOutput(`已读取 ${path}`); }
  catch (error) { showOutput((error as Error).message, true); }
}
async function saveFile(path: string, target: HTMLTextAreaElement) {
  try { await call("write_allowed_file", { root: root(), relativePath: path, content: target.value }); showOutput(`已保存 ${path}。请运行验证并检查 diff。`); await inspect(); }
  catch (error) { showOutput((error as Error).message, true); }
}

el<HTMLButtonElement>("#inspect").addEventListener("click", () => void inspect());
el<HTMLButtonElement>("#load-article").addEventListener("click", () => void readFile(el<HTMLInputElement>("#article-path").value, el<HTMLTextAreaElement>("#article-content")));
el<HTMLButtonElement>("#save-article").addEventListener("click", () => void saveFile(el<HTMLInputElement>("#article-path").value, el<HTMLTextAreaElement>("#article-content")));
el<HTMLButtonElement>("#load-resource").addEventListener("click", () => void readFile(el<HTMLInputElement>("#resource-path").value, el<HTMLTextAreaElement>("#resource-content")));
el<HTMLButtonElement>("#save-resource").addEventListener("click", () => void saveFile(el<HTMLInputElement>("#resource-path").value, el<HTMLTextAreaElement>("#resource-content")));
el<HTMLButtonElement>("#copy-asset").addEventListener("click", async () => {
  try { await call("copy_public_file", { root: root(), sourcePath: el<HTMLInputElement>("#asset-source").value, targetName: el<HTMLInputElement>("#asset-name").value }); showOutput("公开文件已复制，请在资源元数据中填写对应 href。 "); await inspect(); }
  catch (error) { showOutput((error as Error).message, true); }
});
el<HTMLButtonElement>("#upload-pdf").addEventListener("click", async () => {
  try {
    const result = await call<UploadedPdf>("upload_pdf", {
      root: root(),
      sourcePath: el<HTMLInputElement>("#pdf-source").value,
      title: el<HTMLInputElement>("#pdf-title").value,
      description: el<HTMLTextAreaElement>("#pdf-description").value,
      sourceName: el<HTMLInputElement>("#pdf-source-name").value
    });
    el<HTMLInputElement>("#resource-path").value = result.metadata_path;
    await readFile(result.metadata_path, el<HTMLTextAreaElement>("#resource-content"));
    showOutput("PDF 已发布到 " + result.public_path + "，Library 元数据已生成。请运行验证并检查 diff。");
    await inspect();
  } catch (error) { showOutput((error as Error).message, true); }
});
el<HTMLButtonElement>("#verify").addEventListener("click", async () => {
  try { showOutput("正在运行 npm run verify……"); const result = await call<CommandResult>("run_verify", { root: root() }); showOutput(result.output, !result.ok); }
  catch (error) { showOutput((error as Error).message, true); }
});
el<HTMLButtonElement>("#diff").addEventListener("click", async () => {
  try { const result = await call<CommandResult>("git_diff", { root: root() }); showOutput(result.output || "允许目录没有未提交 diff。", !result.ok); diffCheck.checked = result.ok; setReleaseEnabled(); }
  catch (error) { showOutput((error as Error).message, true); }
});
commitButton.addEventListener("click", async () => {
  try { const message = el<HTMLInputElement>("#commit-message").value.trim(); const result = await call<CommandResult>("git_commit", { root: root(), message }); showOutput(result.output, !result.ok); if (result.ok) { diffCheck.checked = false; setReleaseEnabled(); await inspect(); } }
  catch (error) { showOutput((error as Error).message, true); }
});
pushButton.addEventListener("click", async () => {
  try { const result = await call<CommandResult>("git_push", { root: root() }); showOutput(result.output, !result.ok); if (result.ok) await inspect(); }
  catch (error) { showOutput((error as Error).message, true); }
});
publicCheck.addEventListener("change", setReleaseEnabled);
diffCheck.addEventListener("change", setReleaseEnabled);
document.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((button) => button.addEventListener("click", () => {
  const tab = button.dataset.tab;
  document.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((item) => { const active = item === button; item.classList.toggle("active", active); item.setAttribute("aria-selected", String(active)); });
  el("#article-editor").classList.toggle("hidden", tab !== "article");
  el("#resource-editor").classList.toggle("hidden", tab !== "resource");
}));

void inspect();
