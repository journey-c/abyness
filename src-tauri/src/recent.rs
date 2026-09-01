use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// 一条“最近打开”记录:文件或文件夹。
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RecentEntry {
    pub path: String,
    pub is_dir: bool,
}

/// 最近列表最多保留的条数。
const MAX_RECENTS: usize = 12;

/// 最近列表持久化文件路径:<app_config_dir>/recents.json。
fn recents_file(app: &AppHandle) -> Option<PathBuf> {
    app.path().app_config_dir().ok().map(|d| d.join("recents.json"))
}

/// 读取最近列表(文件不存在或损坏时返回空)。
pub fn load(app: &AppHandle) -> Vec<RecentEntry> {
    let Some(path) = recents_file(app) else {
        return Vec::new();
    };
    let Ok(text) = std::fs::read_to_string(&path) else {
        return Vec::new();
    };
    serde_json::from_str(&text).unwrap_or_default()
}

/// 写回最近列表(自动创建配置目录)。
fn save(app: &AppHandle, list: &[RecentEntry]) {
    let Some(path) = recents_file(app) else {
        return;
    };
    if let Some(dir) = path.parent() {
        let _ = std::fs::create_dir_all(dir);
    }
    if let Ok(text) = serde_json::to_string_pretty(list) {
        let _ = std::fs::write(&path, text);
    }
}

/// 新增一条最近记录:去重后置顶,超出上限则截断。
pub fn add(app: &AppHandle, entry: RecentEntry) {
    let mut list = load(app);
    list.retain(|e| e.path != entry.path);
    list.insert(0, entry);
    list.truncate(MAX_RECENTS);
    save(app, &list);
}

/// 清空最近记录。
pub fn clear(app: &AppHandle) {
    save(app, &[]);
}

/// 从路径取用于菜单展示的名字(末段)。
pub fn display_name(path: &str) -> String {
    path.trim_end_matches('/')
        .rsplit('/')
        .next()
        .filter(|s| !s.is_empty())
        .unwrap_or(path)
        .to_string()
}
