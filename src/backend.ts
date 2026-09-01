import { invoke } from "@tauri-apps/api/core";

/** 与 Rust 后端 command 对应的文件树节点。 */
export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children: FileNode[] | null;
}

export function readFile(path: string): Promise<string> {
  return invoke("read_file", { path });
}

export function writeFile(path: string, content: string): Promise<void> {
  return invoke("write_file", { path, content });
}

/** 重命名文件,返回新的完整路径。 */
export function renameFile(path: string, newName: string): Promise<string> {
  return invoke("rename_file", { path, newName });
}

/** 文件最后修改时间(Unix 毫秒),用于检测外部改动。 */
export function fileMtime(path: string): Promise<number> {
  return invoke("file_mtime", { path });
}

/** 在目录下新建 Markdown 文件,返回新文件完整路径。 */
export function createFile(dir: string, name: string): Promise<string> {
  return invoke("create_file", { dir, name });
}

/** 在目录下新建子目录,返回新目录完整路径。 */
export function createDir(dir: string, name: string): Promise<string> {
  return invoke("create_dir", { dir, name });
}

/** 删除文件或目录(目录递归)。 */
export function deletePath(path: string): Promise<void> {
  return invoke("delete_path", { path });
}

/** 在系统文件管理器中显示该路径。 */
export function revealInExplorer(path: string): Promise<void> {
  return invoke("reveal_in_explorer", { path });
}

/** 记录一条“最近打开”(文件或文件夹),后端会刷新原生「打开最近」菜单。 */
export function addRecent(path: string, isDir: boolean): Promise<void> {
  return invoke("add_recent", { path, isDir });
}

/** 读取“最近打开”列表。 */
export function getRecents(): Promise<Array<{ path: string; is_dir: boolean }>> {
  return invoke("get_recents");
}

export function listDir(path: string): Promise<FileNode[]> {
  return invoke("list_dir", { path });
}

/** 搜索命中项。 */
export interface SearchHit {
  path: string;
  name: string;
  name_match: boolean;
  lines: Array<{ line: number; text: string }>;
}

/** 在 root 目录下搜索文件名/内容。regex=true 时把 query 当正则。 */
export function searchFiles(
  root: string,
  query: string,
  caseSensitive: boolean,
  wholeWord: boolean,
  regex: boolean
): Promise<SearchHit[]> {
  return invoke("search_files", {
    root,
    query,
    caseSensitive,
    wholeWord,
    regex,
  });
}
