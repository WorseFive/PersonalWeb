#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::{
    fs,
    path::{Component, Path, PathBuf},
    process::Command,
};

const ALLOWED_PREFIXES: [&str; 3] = ["content/blog", "content/resources", "public/resources"];
const BLOCKED_PREFIXES: [&str; 6] = [
    ".git",
    ".github/workflows",
    ".data",
    ".vercel",
    "supabase/.temp",
    "legacy/server-only",
];
const ALLOWED_ASSET_EXTENSIONS: [&str; 6] = ["png", "jpg", "jpeg", "webp", "gif", "pdf"];
const MAX_TEXT_BYTES: usize = 2 * 1024 * 1024;
const MAX_ASSET_BYTES: u64 = 5 * 1024 * 1024;

#[derive(Serialize)]
struct RepoStatus {
    root: String,
    branch: String,
    remote: String,
    clean: bool,
    changed_files: Vec<String>,
}

#[derive(Serialize)]
struct CommandResult {
    ok: bool,
    output: String,
}

#[derive(Serialize)]
struct UploadedPdf {
    public_path: String,
    metadata_path: String,
    size: u64,
}

fn normalize_relative(relative: &str) -> Result<String, String> {
    let normalized = relative.replace('\\', "/");
    let path = Path::new(&normalized);
    if normalized.is_empty() || normalized.starts_with('/') || normalized.contains(':') {
        return Err("目标路径必须是仓库内的相对路径。".into());
    }
    for component in path.components() {
        if matches!(
            component,
            Component::ParentDir | Component::RootDir | Component::Prefix(_)
        ) {
            return Err("禁止路径穿越、绝对路径和盘符路径。".into());
        }
    }
    Ok(normalized.trim_start_matches("./").to_string())
}

fn canonical_repo(root: &str) -> Result<PathBuf, String> {
    let candidate = PathBuf::from(root.trim());
    if !candidate.is_absolute() {
        return Err("仓库目录必须是绝对路径。".into());
    }
    let resolved = candidate
        .canonicalize()
        .map_err(|_| "仓库目录不存在或无法访问。".to_string())?;
    if !resolved.join("package.json").is_file()
        || !resolved.join("next.config.ts").is_file()
        || !resolved.join(".git").exists()
    {
        return Err(
            "这不是可识别的 PersonalWeb Git 仓库（缺少 package.json、next.config.ts 或 .git）。"
                .into(),
        );
    }
    Ok(resolved)
}

fn path_is_under(root: &Path, path: &Path) -> bool {
    path == root || path.strip_prefix(root).is_ok()
}

fn allowed_path(root: &Path, relative: &str, for_write: bool) -> Result<PathBuf, String> {
    let normalized = normalize_relative(relative)?;
    if BLOCKED_PREFIXES
        .iter()
        .any(|prefix| normalized == *prefix || normalized.starts_with(&format!("{prefix}/")))
    {
        return Err("该目录属于受保护区域，编辑器拒绝访问。".into());
    }
    let is_allowed = ALLOWED_PREFIXES
        .iter()
        .any(|prefix| normalized == *prefix || normalized.starts_with(&format!("{prefix}/")));
    if !is_allowed {
        return Err("编辑器只允许访问公开内容白名单目录。".into());
    }
    let path = root.join(&normalized);
    if path.exists() {
        let canonical_path = path
            .canonicalize()
            .map_err(|_| "目标文件无法解析。".to_string())?;
        if !path_is_under(root, &canonical_path) {
            return Err("目标文件解析后超出仓库范围。".into());
        }
    }
    if for_write {
        if normalized.starts_with("content/") && !normalized.ends_with(".md") {
            return Err("内容元数据只能写入 .md 文件。".into());
        }
        if path
            .file_name()
            .and_then(|name| name.to_str())
            .is_some_and(|name| name.starts_with('.'))
        {
            return Err("隐藏文件不允许写入。".into());
        }
        let parent = path.parent().ok_or_else(|| "目标目录无效。".to_string())?;
        fs::create_dir_all(parent).map_err(|_| "无法创建公开内容目录。".to_string())?;
        let canonical_parent = parent
            .canonicalize()
            .map_err(|_| "目标目录无法解析。".to_string())?;
        if !path_is_under(root, &canonical_parent) {
            return Err("目标目录超出仓库范围。".into());
        }
    }
    Ok(path)
}

fn git(root: &Path, args: &[&str]) -> Result<CommandResult, String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(root)
        .output()
        .map_err(|error| format!("无法启动 Git：{error}"))?;
    let mut text = String::from_utf8_lossy(&output.stdout).to_string();
    text.push_str(&String::from_utf8_lossy(&output.stderr));
    Ok(CommandResult {
        ok: output.status.success(),
        output: text.trim().to_string(),
    })
}

fn allowed_git_paths() -> [&'static str; 3] {
    ["content/blog", "content/resources", "public/resources"]
}

#[tauri::command]
fn inspect_repository(root: String) -> Result<RepoStatus, String> {
    let root = canonical_repo(&root)?;
    let branch = git(&root, &["branch", "--show-current"])?;
    let remote = git(&root, &["remote", "get-url", "origin"])
        .map(|result| result.output)
        .unwrap_or_default();
    let status = git(&root, &["status", "--short"])?;
    let changed_files = status
        .output
        .lines()
        .filter_map(|line| line.get(3..))
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .map(str::to_string)
        .collect::<Vec<_>>();
    Ok(RepoStatus {
        root: root.display().to_string(),
        branch: branch.output.trim().to_string(),
        remote: remote.trim().to_string(),
        clean: changed_files.is_empty(),
        changed_files,
    })
}

#[tauri::command]
fn read_allowed_file(root: String, relative_path: String) -> Result<String, String> {
    let root = canonical_repo(&root)?;
    let path = allowed_path(&root, &relative_path, false)?;
    let bytes = fs::read(&path).map_err(|_| "文件不存在或无法读取。".to_string())?;
    if bytes.len() > MAX_TEXT_BYTES {
        return Err("文本文件超过 2 MB 限制。".into());
    }
    String::from_utf8(bytes).map_err(|_| "编辑器只读取 UTF-8 文本文件。".into())
}

#[tauri::command]
fn write_allowed_file(root: String, relative_path: String, content: String) -> Result<(), String> {
    let root = canonical_repo(&root)?;
    if content.len() > MAX_TEXT_BYTES {
        return Err("文本内容超过 2 MB 限制。".into());
    }
    if content.contains("SUPABASE_SERVICE_ROLE_KEY")
        || content.contains("SESSION_SECRET")
        || content.contains("ADMIN_PASSWORD")
    {
        return Err("内容疑似包含服务端密钥或密码，已拒绝写入。".into());
    }
    let path = allowed_path(&root, &relative_path, true)?;
    fs::write(path, content.as_bytes()).map_err(|_| "写入公开内容失败。".into())
}

#[tauri::command]
fn copy_public_file(root: String, source_path: String, target_name: String) -> Result<(), String> {
    let root = canonical_repo(&root)?;
    let source = PathBuf::from(source_path.trim())
        .canonicalize()
        .map_err(|_| "源文件不存在或无法访问。".to_string())?;
    if !source.is_file() {
        return Err("源路径必须是文件。".into());
    }
    let metadata = fs::metadata(&source).map_err(|_| "无法读取源文件信息。".to_string())?;
    if metadata.len() > MAX_ASSET_BYTES {
        return Err("公开资源单文件不得超过 5 MB。".into());
    }
    let filename = Path::new(target_name.trim())
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| "目标文件名无效。".to_string())?;
    if filename != target_name.trim() || filename.starts_with('.') {
        return Err("目标文件名必须是单层非隐藏文件名。".into());
    }
    let extension = Path::new(filename)
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    if !ALLOWED_ASSET_EXTENSIONS.contains(&extension.as_str()) {
        return Err("只允许 png、jpg、jpeg、webp、gif 和 pdf 文件。".into());
    }
    let target = allowed_path(&root, &format!("public/resources/{filename}"), true)?;
    fs::copy(source, target).map_err(|_| "复制公开资源失败。".to_string())?;
    Ok(())
}

fn clean_single_line(value: &str, field: &str, max_bytes: usize) -> Result<String, String> {
    let value = value.trim();
    if value.is_empty() {
        return Err(format!("{field} 不能为空。"));
    }
    if value.len() > max_bytes || value.chars().any(|character| character.is_control()) {
        return Err(format!("{field} 过长或包含换行/控制字符。"));
    }
    Ok(value.to_string())
}

fn slugify(value: &str) -> String {
    let mut slug = String::new();
    for character in value.chars() {
        if character.is_alphanumeric() {
            slug.push(if character.is_ascii() {
                character.to_ascii_lowercase()
            } else {
                character
            });
        } else if !slug.ends_with('-') {
            slug.push('-');
        }
    }
    let mut slug = slug.trim_matches('-').chars().take(80).collect::<String>();
    if slug.is_empty() {
        slug = "document".to_string();
    }
    if matches!(
        slug.as_str(),
        "con" | "prn" | "aux" | "nul" | "com1" | "lpt1"
    ) {
        slug.push_str("-file");
    }
    slug
}

fn yaml_quote(value: &str) -> String {
    format!("\"{}\"", value.replace('\\', "\\\\").replace('"', "\\\""))
}

fn human_size(bytes: u64) -> String {
    if bytes < 1024 {
        return format!("{bytes} B");
    }
    if bytes < 1024 * 1024 {
        return format!("{:.1} KB", bytes as f64 / 1024.0);
    }
    format!("{:.1} MB", bytes as f64 / (1024.0 * 1024.0))
}

#[tauri::command]
fn upload_pdf(
    root: String,
    source_path: String,
    title: String,
    description: String,
    source_name: String,
) -> Result<UploadedPdf, String> {
    let root = canonical_repo(&root)?;
    let source = PathBuf::from(source_path.trim())
        .canonicalize()
        .map_err(|_| "PDF 源文件不存在或无法访问。".to_string())?;
    if !source.is_file() {
        return Err("PDF 源路径必须是文件。".into());
    }
    let filename = source
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| "无法读取 PDF 文件名。".to_string())?;
    if source
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("")
        .to_ascii_lowercase()
        != "pdf"
    {
        return Err("只允许上传 .pdf 文件。".into());
    }
    let bytes = fs::read(&source).map_err(|_| "无法读取 PDF 源文件。".to_string())?;
    if bytes.len() as u64 > MAX_ASSET_BYTES {
        return Err("PDF 文件不得超过 5 MB。".into());
    }
    if !bytes.starts_with(b"%PDF-") {
        return Err("文件扩展名虽为 PDF，但文件头校验失败。".into());
    }

    let title = if title.trim().is_empty() {
        source
            .file_stem()
            .and_then(|value| value.to_str())
            .unwrap_or("未命名 PDF")
            .to_string()
    } else {
        clean_single_line(&title, "标题", 240)?
    };
    let description = if description.trim().is_empty() {
        format!("由本地编辑器上传：{filename}")
    } else {
        clean_single_line(&description, "描述", 500)?
    };
    let source_name = if source_name.trim().is_empty() {
        "本地编辑器".to_string()
    } else {
        clean_single_line(&source_name, "来源名称", 160)?
    };
    let slug = slugify(&title);
    let public_filename = format!("{slug}.pdf");
    let public_relative = format!("public/resources/{public_filename}");
    let metadata_relative = format!("content/resources/{slug}.md");
    let public_target = allowed_path(&root, &public_relative, true)?;
    let metadata_target = allowed_path(&root, &metadata_relative, true)?;
    if public_target.exists() || metadata_target.exists() {
        return Err(format!(
            "Library 中已存在同名资源：{slug}。请修改标题后重试。"
        ));
    }

    fs::copy(&source, &public_target)
        .map_err(|_| "复制 PDF 到 public/resources 失败。".to_string())?;
    let href = format!("/resources/{public_filename}");
    let metadata = format!(
        "---\ntitle: {}\ndescription: {}\nsourceName: {}\ntype: PDF\nsize: {}\nhref: {}\n---\n",
        yaml_quote(&title),
        yaml_quote(&description),
        yaml_quote(&source_name),
        yaml_quote(&human_size(bytes.len() as u64)),
        yaml_quote(&href)
    );
    if let Err(error) = fs::write(&metadata_target, metadata.as_bytes()) {
        let _ = fs::remove_file(&public_target);
        return Err(format!("生成 Library 元数据失败：{error}"));
    }
    Ok(UploadedPdf {
        public_path: public_relative,
        metadata_path: metadata_relative,
        size: bytes.len() as u64,
    })
}

#[tauri::command]
fn run_verify(root: String) -> Result<CommandResult, String> {
    let root = canonical_repo(&root)?;
    let output = Command::new(if cfg!(windows) { "npm.cmd" } else { "npm" })
        .args(["run", "verify"])
        .current_dir(root)
        .output()
        .map_err(|error| format!("无法启动 npm：{error}"))?;
    let mut text = String::from_utf8_lossy(&output.stdout).to_string();
    text.push_str(&String::from_utf8_lossy(&output.stderr));
    Ok(CommandResult {
        ok: output.status.success(),
        output: text.trim().to_string(),
    })
}

#[tauri::command]
fn git_diff(root: String) -> Result<CommandResult, String> {
    let root = canonical_repo(&root)?;
    let mut args = vec!["diff", "--no-ext-diff", "--"];
    args.extend(allowed_git_paths());
    let diff = git(&root, &args)?;
    let mut status_args = vec!["status", "--short", "--"];
    status_args.extend(allowed_git_paths());
    let status = git(&root, &status_args)?;
    let output = if status.output.is_empty() {
        diff.output
    } else {
        format!(
            "允许目录状态：\n{}\n\n工作树 diff：\n{}",
            status.output, diff.output
        )
    };
    Ok(CommandResult {
        ok: diff.ok && status.ok,
        output,
    })
}

#[tauri::command]
fn git_commit(root: String, message: String) -> Result<CommandResult, String> {
    let root = canonical_repo(&root)?;
    let message = message.trim();
    if message.is_empty() || message.len() > 120 || message.contains('\n') {
        return Err("提交说明必须是 1-120 个字符的一行文本。".into());
    }
    let mut add_args = vec!["add", "-A", "--"];
    add_args.extend(allowed_git_paths());
    let added = git(&root, &add_args)?;
    if !added.ok {
        return Ok(added);
    }
    let mut commit_args = vec!["commit", "-m", message, "--"];
    commit_args.extend(allowed_git_paths());
    git(&root, &commit_args)
}

#[tauri::command]
fn git_push(root: String) -> Result<CommandResult, String> {
    let root = canonical_repo(&root)?;
    let branch = git(&root, &["branch", "--show-current"])?;
    if !branch.ok || branch.output.trim().is_empty() {
        return Err("当前仓库没有可推送的分支。".into());
    }
    git(&root, &["push", "origin", branch.output.trim()])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            inspect_repository,
            read_allowed_file,
            write_allowed_file,
            copy_public_file,
            upload_pdf,
            run_verify,
            git_diff,
            git_commit,
            git_push
        ])
        .run(tauri::generate_context!())
        .expect("error while running PersonalWeb Editor");
}

fn main() {
    run();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn relative_paths_are_normalized_and_scoped() {
        assert_eq!(
            normalize_relative("content\\blog\\draft.md").unwrap(),
            "content/blog/draft.md"
        );
        assert!(normalize_relative("../outside.md").is_err());
        assert!(normalize_relative("C:\\outside.md").is_err());
        assert!(normalize_relative("/outside.md").is_err());
    }

    #[test]
    fn blocked_and_unlisted_paths_are_rejected() {
        let root = PathBuf::from(r"C:\PersonalWeb");
        assert!(allowed_path(&root, ".env.local", false).is_err());
        assert!(allowed_path(&root, ".git/config", false).is_err());
        assert!(allowed_path(&root, ".github/workflows/deploy.yml", false).is_err());
        assert!(allowed_path(&root, "app/page.tsx", false).is_err());
    }

    #[test]
    fn path_scope_helper_does_not_accept_sibling() {
        let root = PathBuf::from(r"C:\PersonalWeb");
        assert!(path_is_under(&root, &root.join("content")));
        assert!(!path_is_under(
            &root,
            &PathBuf::from(r"C:\PersonalWeb-archive")
        ));
    }

    #[test]
    fn slugify_creates_safe_stable_names() {
        assert_eq!(slugify("My Guide 2026.pdf"), "my-guide-2026-pdf");
        assert_eq!(slugify("中文资料"), "中文资料");
    }

    #[test]
    fn yaml_quote_escapes_metadata_values() {
        assert_eq!(yaml_quote("a\\b\"c"), "\"a\\\\b\\\"c\"");
    }

    #[test]
    fn upload_pdf_creates_public_file_and_library_metadata() {
        let root =
            std::env::temp_dir().join(format!("personalweb-editor-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(root.join(".git")).unwrap();
        fs::write(root.join("package.json"), "{}").unwrap();
        fs::write(root.join("next.config.ts"), "export default {};").unwrap();
        let source = root.join("source.pdf");
        fs::write(&source, b"%PDF-1.7\\nminimal test fixture").unwrap();

        let uploaded = upload_pdf(
            root.display().to_string(),
            source.display().to_string(),
            "Test Guide".into(),
            "A public test PDF.".into(),
            "Automated test".into(),
        )
        .unwrap();
        assert_eq!(uploaded.public_path, "public/resources/test-guide.pdf");
        assert!(root.join("public/resources/test-guide.pdf").is_file());
        let metadata = fs::read_to_string(root.join("content/resources/test-guide.md")).unwrap();
        assert!(metadata.contains("href: \"/resources/test-guide.pdf\""));
        assert!(metadata.contains("title: \"Test Guide\""));
        assert!(upload_pdf(
            root.display().to_string(),
            source.display().to_string(),
            "Test Guide".into(),
            "A second public PDF.".into(),
            "Automated test".into(),
        )
        .is_err());
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn upload_pdf_rejects_spoofed_extension() {
        let root =
            std::env::temp_dir().join(format!("personalweb-editor-spoof-{}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(root.join(".git")).unwrap();
        fs::write(root.join("package.json"), "{}").unwrap();
        fs::write(root.join("next.config.ts"), "export default {};").unwrap();
        let source = root.join("not-a-pdf.pdf");
        fs::write(&source, b"plain text").unwrap();
        assert!(upload_pdf(
            root.display().to_string(),
            source.display().to_string(),
            "Spoof".into(),
            "x".into(),
            "x".into()
        )
        .is_err());
        assert!(!root.join("public/resources/spoof.pdf").exists());
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn upload_pdf_rejects_oversized_files() {
        let root =
            std::env::temp_dir().join(format!("personalweb-editor-large-{}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(root.join(".git")).unwrap();
        fs::write(root.join("package.json"), "{}").unwrap();
        fs::write(root.join("next.config.ts"), "export default {};").unwrap();
        let source = root.join("large.pdf");
        let mut bytes = b"%PDF-1.7\n".to_vec();
        bytes.resize((MAX_ASSET_BYTES + 1) as usize, b'x');
        fs::write(&source, bytes).unwrap();
        assert!(upload_pdf(
            root.display().to_string(),
            source.display().to_string(),
            "Large".into(),
            "x".into(),
            "x".into()
        )
        .is_err());
        assert!(!root.join("public/resources/large.pdf").exists());
        let _ = fs::remove_dir_all(&root);
    }
}
