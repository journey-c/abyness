use serde::Serialize;
use std::fs;
use std::path::Path;

use crate::commands::is_markdown;

/// 搜索命中项:文件路径 + 若干上下文行(内容命中时)。
#[derive(Serialize)]
pub struct SearchHit {
    pub path: String,
    pub name: String,
    /// 文件名是否命中。
    pub name_match: bool,
    /// 内容命中的行(1-based 行号 + 该行文本,截断)。
    pub lines: Vec<SearchLine>,
}

#[derive(Serialize)]
pub struct SearchLine {
    pub line: usize,
    pub text: String,
}

/// 在 root 目录下递归搜索:按关键字匹配文件名与 Markdown 文件内容。
/// - `case_sensitive`:区分大小写
/// - `whole_word`:整词匹配(仅字母/数字边界)
/// - `regex`:把 query 当正则(此参数为 true 时忽略 whole_word 的自动加边界,除非用户自己写)
#[tauri::command]
pub fn search_files(
    root: String,
    query: String,
    case_sensitive: bool,
    whole_word: bool,
    regex: bool,
) -> Result<Vec<SearchHit>, String> {
    let q = query.trim();
    if q.is_empty() {
        return Ok(Vec::new());
    }
    let matcher = Matcher::build(q, case_sensitive, whole_word, regex)?;
    let mut hits: Vec<SearchHit> = Vec::new();
    search_dir(Path::new(&root), &matcher, &mut hits);
    Ok(hits)
}

/// 匹配器:普通("子串 / 整词",大小写可选)或正则(用 `regex` crate)。
enum Matcher {
    Plain {
        needle: String,
        case_sensitive: bool,
        whole_word: bool,
    },
    Regex(regex::Regex),
}

impl Matcher {
    fn build(
        query: &str,
        case_sensitive: bool,
        whole_word: bool,
        regex_mode: bool,
    ) -> Result<Self, String> {
        if regex_mode {
            let mut builder = regex::RegexBuilder::new(query);
            builder.case_insensitive(!case_sensitive);
            let re = builder
                .build()
                .map_err(|e| format!("正则表达式无效: {e}"))?;
            Ok(Matcher::Regex(re))
        } else {
            Ok(Matcher::Plain {
                needle: if case_sensitive {
                    query.to_string()
                } else {
                    query.to_lowercase()
                },
                case_sensitive,
                whole_word,
            })
        }
    }

    fn is_match(&self, haystack: &str) -> bool {
        match self {
            Matcher::Regex(re) => re.is_match(haystack),
            Matcher::Plain {
                needle,
                case_sensitive,
                whole_word,
            } => {
                let hay = if *case_sensitive {
                    haystack.to_string()
                } else {
                    haystack.to_lowercase()
                };
                if *whole_word {
                    whole_word_contains(&hay, needle)
                } else {
                    hay.contains(needle.as_str())
                }
            }
        }
    }
}

/// 整词匹配:needle 出现处两侧必须是非字母数字(或字符串边界)。
fn whole_word_contains(hay: &str, needle: &str) -> bool {
    if needle.is_empty() {
        return false;
    }
    let bytes = hay.as_bytes();
    let mut start = 0;
    while let Some(pos) = hay[start..].find(needle) {
        let idx = start + pos;
        let before_ok = idx == 0 || !is_word_byte(bytes[idx - 1]);
        let after = idx + needle.len();
        let after_ok = after >= bytes.len() || !is_word_byte(bytes[after]);
        if before_ok && after_ok {
            return true;
        }
        start = idx + needle.len();
        if start >= hay.len() {
            break;
        }
    }
    false
}

fn is_word_byte(b: u8) -> bool {
    b.is_ascii_alphanumeric() || b == b'_'
}

/// 递归搜索目录,收集命中项(最多 200 个文件命中即停,避免超大目录卡顿)。
fn search_dir(dir: &Path, matcher: &Matcher, hits: &mut Vec<SearchHit>) {
    if hits.len() >= 200 {
        return;
    }
    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };
    let mut list: Vec<_> = entries.flatten().collect();
    list.sort_by_key(|e| e.file_name());
    for entry in list {
        if hits.len() >= 200 {
            return;
        }
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') {
            continue;
        }
        if path.is_dir() {
            search_dir(&path, matcher, hits);
        } else if is_markdown(&path) {
            let name_match = matcher.is_match(&name);
            let mut lines: Vec<SearchLine> = Vec::new();
            if let Ok(content) = fs::read_to_string(&path) {
                for (i, line) in content.lines().enumerate() {
                    if matcher.is_match(line) {
                        lines.push(SearchLine {
                            line: i + 1,
                            text: truncate_line(line),
                        });
                        if lines.len() >= 20 {
                            break;
                        }
                    }
                }
            }
            if name_match || !lines.is_empty() {
                hits.push(SearchHit {
                    path: path.to_string_lossy().to_string(),
                    name,
                    name_match,
                    lines,
                });
            }
        }
    }
}

/// 把命中行裁到 200 字符,去掉首部空白,便于结果面板展示。
fn truncate_line(line: &str) -> String {
    let trimmed = line.trim_start();
    if trimmed.chars().count() > 200 {
        let s: String = trimmed.chars().take(200).collect();
        format!("{s}…")
    } else {
        trimmed.to_string()
    }
}
