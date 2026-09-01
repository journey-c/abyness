use serde::Serialize;
use std::fs;
use std::path::Path;
use std::time::UNIX_EPOCH;

use crate::menu;
use crate::recent::{self, RecentEntry};

/// 文件树节点。目录含 children,文件的 children 为 None。
#[derive(Serialize)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileNode>>,
}

/// 读取磁盘上的文本文件,返回其内容。
#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("读取文件失败 {path}: {e}"))
}

/// 将文本内容写入磁盘文件。
#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| format!("写入文件失败 {path}: {e}"))
}

/// 重命名文件:在同一目录下把 `path` 改名为 `new_name`,返回新的完整路径。
/// 若 `new_name` 未带扩展名,则沿用原文件的扩展名。
#[tauri::command]
pub fn rename_file(path: String, new_name: String) -> Result<String, String> {
    let old = Path::new(&path);
    let parent = old
        .parent()
        .ok_or_else(|| format!("无法获取父目录: {path}"))?;

    // 若新名称不含扩展名,沿用原扩展名
    let trimmed = new_name.trim();
    if trimmed.is_empty() {
        return Err("文件名不能为空".to_string());
    }
    let has_ext = Path::new(trimmed).extension().is_some();
    let final_name = match (has_ext, old.extension().and_then(|e| e.to_str())) {
        (false, Some(ext)) => format!("{trimmed}.{ext}"),
        _ => trimmed.to_string(),
    };

    let new_path = parent.join(&final_name);
    if new_path.exists() {
        return Err(format!("目标已存在: {}", new_path.to_string_lossy()));
    }
    fs::rename(old, &new_path).map_err(|e| format!("重命名失败: {e}"))?;
    Ok(new_path.to_string_lossy().to_string())
}

/// 递归列出目录下的子目录与 Markdown 文件,构建文件树。
/// 仅保留目录和 .md/.markdown 文件;隐藏项(以 . 开头)跳过。
#[tauri::command]
pub fn list_dir(path: String) -> Result<Vec<FileNode>, String> {
    build_tree(Path::new(&path)).map_err(|e| format!("读取目录失败 {path}: {e}"))
}

fn build_tree(dir: &Path) -> std::io::Result<Vec<FileNode>> {
    let mut nodes: Vec<FileNode> = Vec::new();

    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        // 跳过隐藏项
        if name.starts_with('.') {
            continue;
        }

        let is_dir = path.is_dir();
        if is_dir {
            let children = build_tree(&path)?;
            nodes.push(FileNode {
                name,
                path: path.to_string_lossy().to_string(),
                is_dir: true,
                children: Some(children),
            });
        } else if is_markdown(&path) {
            nodes.push(FileNode {
                name,
                path: path.to_string_lossy().to_string(),
                is_dir: false,
                children: None,
            });
        }
    }

    // 目录在前,文件在后;各自按名称排序
    nodes.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    Ok(nodes)
}

pub(crate) fn is_markdown(path: &Path) -> bool {
    matches!(
        path.extension().and_then(|e| e.to_str()),
        Some("md") | Some("markdown")
    )
}

/// 返回文件的最后修改时间(Unix 毫秒)。用于检测外部改动。
#[tauri::command]
pub fn file_mtime(path: String) -> Result<u64, String> {
    let meta = fs::metadata(&path).map_err(|e| format!("读取元信息失败 {path}: {e}"))?;
    let mtime = meta
        .modified()
        .map_err(|e| format!("读取修改时间失败: {e}"))?;
    let ms = mtime
        .duration_since(UNIX_EPOCH)
        .map_err(|e| format!("时间换算失败: {e}"))?
        .as_millis() as u64;
    Ok(ms)
}

/// 在指定目录下新建一个空的 Markdown 文件,返回新文件完整路径。
/// 若同名已存在,自动追加序号(如 未命名 2.md)。
#[tauri::command]
pub fn create_file(dir: String, name: String) -> Result<String, String> {
    let base = Path::new(&dir);
    if !base.is_dir() {
        return Err(format!("不是有效目录: {dir}"));
    }
    let trimmed = name.trim();
    let raw = if trimmed.is_empty() { "未命名" } else { trimmed };
    // 补 .md 扩展名
    let with_ext = if Path::new(raw).extension().is_some() {
        raw.to_string()
    } else {
        format!("{raw}.md")
    };
    let target = unique_path(base, &with_ext);
    fs::write(&target, "").map_err(|e| format!("新建文件失败: {e}"))?;
    Ok(target.to_string_lossy().to_string())
}

/// 在指定目录下新建一个子目录,返回新目录完整路径。
#[tauri::command]
pub fn create_dir(dir: String, name: String) -> Result<String, String> {
    let base = Path::new(&dir);
    if !base.is_dir() {
        return Err(format!("不是有效目录: {dir}"));
    }
    let trimmed = name.trim();
    let raw = if trimmed.is_empty() {
        "新建文件夹"
    } else {
        trimmed
    };
    let target = unique_path(base, raw);
    fs::create_dir(&target).map_err(|e| format!("新建文件夹失败: {e}"))?;
    Ok(target.to_string_lossy().to_string())
}

/// 删除文件或目录(目录递归删除)。
#[tauri::command]
pub fn delete_path(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if p.is_dir() {
        fs::remove_dir_all(p).map_err(|e| format!("删除目录失败: {e}"))
    } else {
        fs::remove_file(p).map_err(|e| format!("删除文件失败: {e}"))
    }
}

/// 在系统文件管理器中显示该路径(macOS: Finder;Windows: 资源管理器;Linux: 打开所在目录)。
#[tauri::command]
pub fn reveal_in_explorer(path: String) -> Result<(), String> {
    use std::process::Command;
    let p = Path::new(&path);
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args(["-R", &path])
            .spawn()
            .map_err(|e| format!("打开 Finder 失败: {e}"))?;
    }
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| format!("打开资源管理器失败: {e}"))?;
    }
    #[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
    {
        let dir = if p.is_dir() {
            p.to_path_buf()
        } else {
            p.parent().map(|d| d.to_path_buf()).unwrap_or_default()
        };
        Command::new("xdg-open")
            .arg(dir)
            .spawn()
            .map_err(|e| format!("打开文件管理器失败: {e}"))?;
    }
    let _ = p; // 静默未使用告警(部分平台)
    Ok(())
}

/// 在 base 下为 name 生成不冲突的路径:若存在则在扩展名前追加 " 2"、" 3"…。
fn unique_path(base: &Path, name: &str) -> std::path::PathBuf {
    let candidate = base.join(name);
    if !candidate.exists() {
        return candidate;
    }
    let path = Path::new(name);
    let stem = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or(name)
        .to_string();
    let ext = path.extension().and_then(|e| e.to_str());
    for i in 2..10000 {
        let next_name = match ext {
            Some(e) => format!("{stem} {i}.{e}"),
            None => format!("{stem} {i}"),
        };
        let next = base.join(&next_name);
        if !next.exists() {
            return next;
        }
    }
    base.join(name) // 极端兜底
}

/// 记录一条“最近打开”(文件或文件夹),并刷新原生菜单的“打开最近”子菜单。
#[tauri::command]
pub fn add_recent(app: tauri::AppHandle, path: String, is_dir: bool) {
    recent::add(&app, RecentEntry { path, is_dir });
    let _ = menu::rebuild(&app);
}

/// 读取“最近打开”列表(供前端需要时使用)。
#[tauri::command]
pub fn get_recents(app: tauri::AppHandle) -> Vec<RecentEntry> {
    recent::load(&app)
}
