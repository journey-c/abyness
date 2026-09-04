import { open } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";
import {
  listDir,
  readFile,
  writeFile,
  renameFile,
  createFile,
  createDir,
  deletePath,
  revealInExplorer,
  addRecent,
  getRecents,
} from "./backend";
import { Editor } from "./editor";
import { FileTree } from "./filetree";
import { ContextMenu } from "./contextmenu";
import { TableToolbar } from "./tabletoolbar";
import { FindBar } from "./findbar";
import { Sidebar } from "./sidebar";
import { TocPopup } from "./tocpopup";
import { FileWatcher } from "./filewatcher";
import { countWords } from "./toc";
import "./styles/app.css";

const app = document.querySelector<HTMLElement>("#app")!;
const treeEl = document.querySelector<HTMLElement>("#filetree")!;
const editorEl = document.querySelector<HTMLElement>("#editor")!;
const docTitle = document.querySelector<HTMLElement>("#doc-title")!;
const wordCount = document.querySelector<HTMLElement>("#word-count")!;
const sidebarToggle = document.querySelector<HTMLButtonElement>("#sidebar-toggle")!;
const tocToggle = document.querySelector<HTMLButtonElement>("#toc-toggle")!;
const reloadBar = document.querySelector<HTMLElement>("#reload-bar")!;
const reloadYes = document.querySelector<HTMLButtonElement>("#reload-yes")!;
const reloadNo = document.querySelector<HTMLButtonElement>("#reload-no")!;

// 当前打开文件的路径与根目录,以及是否有未保存修改
let currentFile: string | null = null;
let currentRoot: string | null = null;
let dirty = false;

const editor = new Editor(editorEl, () => {
  if (currentFile) {
    dirty = true;
  }
  refreshDoc();
});

// 正文右键菜单(替代 Crepe 悬浮块手柄/选区工具栏)
new ContextMenu(editorEl, editor);

// 表格编辑工具条(点击表格时在左上角显示:尺寸/对齐/删除)
new TableToolbar(editorEl, editor);

// 正文内查找/替换浮动面板(Cmd/Ctrl+F 打开)
const findBar = new FindBar(editorEl, () => editor.getView());

// 侧栏:文件树 / 大纲 / 搜索 三视图
const sidebar = new Sidebar({
  getRoot: () => currentRoot,
  getMarkdown: () => editor.getMarkdown(),
  onGotoHeading: (i) => editor.scrollToHeading(i),
  onOpenFile: (path) => void openFile(path),
});

// 顶栏「大纲」悬浮窗
const tocPopup = new TocPopup(tocToggle, {
  getMarkdown: () => editor.getMarkdown(),
  onGotoHeading: (i) => editor.scrollToHeading(i),
});

// 外部改动监视:被别的程序改动时弹出「重新加载」提示条
const watcher = new FileWatcher(() => showReloadBar());

const tree = new FileTree(treeEl, {
  onOpen: openFile,
  onNewFile: (dir) => void newFileIn(dir),
  onNewFolder: (dir) => void newFolderIn(dir),
  onRename: (path, newName, isDir) => void renamePath(path, newName, isDir),
  onDelete: (path, isDir) => void deleteEntry(path, isDir),
  onCopyPath: (path) => void copyPath(path),
  onReveal: (path) => void revealInExplorer(path),
});

/** 刷新词数、大纲、标题(内容变化时调用)。 */
function refreshDoc(): void {
  const md = editor.getMarkdown();
  wordCount.textContent = `${countWords(md)} 词`;
  sidebar.onDocChanged();
  tocPopup.onDocChanged();
  updateTitle();
}

/** 更新顶栏标题(文件名 + 未保存脏标记)。 */
function updateTitle(): void {
  if (!currentFile) {
    docTitle.textContent = "";
    return;
  }
  const name = currentFile.split("/").pop() ?? currentFile;
  docTitle.textContent = (dirty ? "● " : "") + name;
}

async function refreshTree(activePath?: string): Promise<void> {
  if (!currentRoot) return;
  const nodes = await listDir(currentRoot);
  tree.render(nodes, currentRoot);
  if (activePath) tree.setActivePath(activePath);
  else if (currentFile) tree.setActivePath(currentFile);
}

async function openFolder(path?: string): Promise<void> {
  const dir = path ?? (await open({ directory: true, multiple: false }));
  if (typeof dir !== "string") return;
  currentRoot = dir;
  const nodes = await listDir(dir);
  tree.render(nodes, dir);
  void addRecent(dir, true);
}

async function openFile(path: string): Promise<void> {
  if (dirty && !confirm("当前文件有未保存修改,确定放弃并打开新文件?")) {
    return;
  }
  const content = await readFile(path);
  findBar.close();
  await editor.load(content);
  currentFile = path;
  dirty = false;
  hideReloadBar();
  await watcher.watch(path);
  refreshDoc();
  void addRecent(path, false);
}

async function saveFile(): Promise<void> {
  if (!currentFile) return;
  await writeFile(currentFile, editor.getMarkdown());
  dirty = false;
  // 我们自己写入会更新 mtime,同步基准以免误报为外部改动
  await watcher.sync();
  hideReloadBar();
  updateTitle();
}

async function newFile(): Promise<void> {
  if (dirty && !confirm("当前文件有未保存修改,确定放弃并新建?")) {
    return;
  }
  findBar.close();
  await editor.load("");
  currentFile = null;
  dirty = false;
  watcher.clear();
  hideReloadBar();
  refreshDoc();
}

function toggleSidebar(): void {
  app.classList.toggle("sidebar-hidden");
}

/** 点击标题栏文件名 → 就地在标题栏弹出输入框重命名,提交后同步更新文件树。 */
function renameCurrent(): void {
  if (!currentFile) return;
  const path = currentFile;
  const oldName = path.split("/").pop() ?? path;

  const input = document.createElement("input");
  input.className = "doc-title-input";
  input.value = oldName;
  docTitle.style.display = "none";
  docTitle.after(input);
  input.focus();
  // 选中不含扩展名的部分
  const dot = oldName.lastIndexOf(".");
  if (dot > 0) input.setSelectionRange(0, dot);
  else input.select();

  let done = false;
  const finish = (commit: boolean) => {
    if (done) return;
    done = true;
    const next = input.value.trim();
    input.remove();
    docTitle.style.display = "";
    if (commit && next && next !== oldName) {
      void renamePath(path, next, false);
    }
  };
  input.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      finish(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      finish(false);
    }
  });
  input.addEventListener("blur", () => finish(true));
}

// ---- 文件树右键菜单操作 ----

async function newFileIn(dir: string): Promise<void> {
  try {
    const newPath = await createFile(dir, "未命名");
    tree.expand(dir);
    tree.pinLast(newPath);
    await refreshTree(newPath);
    await openFile(newPath);
    // 新建后立即进入重命名态,便于用户直接命名
    tree.beginRename(newPath, false);
  } catch (e) {
    alert(`新建文件失败:${e}`);
  }
}

async function newFolderIn(dir: string): Promise<void> {
  try {
    await createDir(dir, "新建文件夹");
    tree.expand(dir);
    await refreshTree();
  } catch (e) {
    alert(`新建文件夹失败:${e}`);
  }
}

async function renamePath(path: string, newName: string, _isDir: boolean): Promise<void> {
  const oldName = path.split("/").pop() ?? path;
  const next = newName.trim();
  if (!next || next === oldName) return;
  try {
    const newPath = await renameFile(path, next);
    if (currentFile === path) {
      currentFile = newPath;
      await watcher.watch(newPath);
      updateTitle();
    }
    await refreshTree(currentFile ?? undefined);
  } catch (e) {
    alert(`重命名失败:${e}`);
  }
}

async function deleteEntry(path: string, isDir: boolean): Promise<void> {
  const name = path.split("/").pop() ?? path;
  if (!confirm(`确定删除${isDir ? "文件夹" : "文件"}「${name}」?此操作不可撤销。`)) {
    return;
  }
  try {
    await deletePath(path);
    // 若删除的是当前打开文件,清空编辑器
    if (currentFile === path || (isDir && currentFile?.startsWith(path + "/"))) {
      findBar.close();
      await editor.load("");
      currentFile = null;
      dirty = false;
      watcher.clear();
      hideReloadBar();
      refreshDoc();
    }
    await refreshTree();
  } catch (e) {
    alert(`删除失败:${e}`);
  }
}

async function copyPath(path: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(path);
  } catch {
    // 剪贴板不可用时兜底:提示用户手动复制
    prompt("复制路径", path);
  }
}

// ---- 外部改动:重新加载提示条 ----

function showReloadBar(): void {
  reloadBar.classList.remove("hidden");
}

function hideReloadBar(): void {
  reloadBar.classList.add("hidden");
}

async function reloadCurrent(): Promise<void> {
  if (!currentFile) return;
  const content = await readFile(currentFile);
  findBar.close();
  await editor.load(content);
  dirty = false;
  await watcher.watch(currentFile);
  hideReloadBar();
  refreshDoc();
}

reloadYes.addEventListener("click", () => void reloadCurrent());
reloadNo.addEventListener("click", () => {
  // 记住当前磁盘 mtime 为「已忽略」,避免反复弹出
  void watcher.dismiss().then(() => hideReloadBar());
});

// 顶栏按钮
sidebarToggle.addEventListener("click", toggleSidebar);
docTitle.addEventListener("click", () => renameCurrent());

// 原生菜单事件(来自 Rust src-tauri/src/menu.rs)
void listen("menu:open_folder", () => void openFolder());
void listen("menu:save", () => void saveFile());
void listen("menu:new", () => void newFile());
void listen("menu:toggle_sidebar", () => toggleSidebar());
void listen<string>("menu:open_recent", async (e) => {
  const path = e.payload;
  // 事件仅携带路径,从最近列表反查它是文件还是文件夹
  const recents = await getRecents();
  const hit = recents.find((r) => r.path === path);
  if (hit?.is_dir) {
    await openFolder(path);
  } else {
    await openFile(path);
  }
});

// ⌘S 兜底(菜单已绑定,此处保证 WebView 内也生效)
window.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "s") {
    e.preventDefault();
    void saveFile();
  }
  // ⌘F / Ctrl+F:打开正文内查找面板
  if ((e.metaKey || e.ctrlKey) && (e.key === "f" || e.key === "F")) {
    e.preventDefault();
    findBar.open("find");
  }
});

// 原生菜单「查找 / 查找与替换」
void listen("menu:find", () => findBar.open("find"));
void listen("menu:replace", () => findBar.open("replace"));

// 启动时展示一个空白编辑器(可直接输入),不显示任何提示文字。
// 编辑器首帧渲染完成后才淡入整个界面,避免 FOUC(闪出未渲染文字)。
void editor.load("").then(() => {
  refreshDoc();
  requestAnimationFrame(() => app.classList.add("ready"));
});
