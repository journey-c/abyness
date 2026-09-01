import { searchFiles, type SearchHit } from "./backend";
import { extractHeadings, buildOutline } from "./toc";

/** 文件树/大纲切换按钮的两种图标。 */
const ICON_OUTLINE =
  '<svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 6h12M4 10h12M4 14h12"/></svg>';
// 切回文件树:层级/树状图标
const ICON_TREE =
  '<svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="4" rx="1"/><rect x="9" y="9" width="7" height="4" rx="1"/><rect x="9" y="14.5" width="7" height="3" rx="1"/><path d="M5.5 7v8.5M5.5 11h3.5M5.5 16h3.5"/></svg>';

type View = "files" | "outline";

export interface SidebarDeps {
  /** 当前打开文件夹根路径(用于搜索)。 */
  getRoot: () => string | null;
  /** 当前文档 markdown(用于大纲)。 */
  getMarkdown: () => string;
  /** 点击大纲项:跳转到第 index 个标题。 */
  onGotoHeading: (index: number) => void;
  /** 点击搜索结果:打开文件。 */
  onOpenFile: (path: string) => void;
}

/**
 * 侧栏:文件树 / 大纲 / 搜索三视图管理。
 * - 头部左上角按钮:文件树 ⇄ 大纲 切换(图标随之变化)。
 * - 头部右上角按钮:进入搜索;搜索栏支持 区分大小写 / 整词 / 正则。
 */
export class Sidebar {
  private deps: SidebarDeps;
  private view: View = "files";
  private searching = false;

  // 头部与视图容器
  private header = document.querySelector<HTMLElement>(".sidebar-header")!;
  private title = document.querySelector<HTMLElement>(".sidebar-title")!;
  private viewToggle = document.querySelector<HTMLButtonElement>("#view-toggle")!;
  private searchBtn = document.querySelector<HTMLButtonElement>("#search-btn")!;
  private treeEl = document.querySelector<HTMLElement>("#filetree")!;
  private tocPanel = document.querySelector<HTMLElement>("#toc-panel")!;
  private tocList = document.querySelector<HTMLElement>("#toc-list")!;
  private resultsEl = document.querySelector<HTMLElement>("#search-results")!;

  // 搜索栏
  private searchBar = document.querySelector<HTMLElement>("#search-bar")!;
  private searchBack = document.querySelector<HTMLButtonElement>("#search-back")!;
  private searchInput = document.querySelector<HTMLInputElement>("#search-input")!;
  private optCase = document.querySelector<HTMLButtonElement>("#opt-case")!;
  private optWord = document.querySelector<HTMLButtonElement>("#opt-word")!;
  private optRegex = document.querySelector<HTMLButtonElement>("#opt-regex")!;

  private caseSensitive = false;
  private wholeWord = false;
  private regex = false;
  private searchTimer: number | null = null;

  constructor(deps: SidebarDeps) {
    this.deps = deps;

    this.viewToggle.addEventListener("click", () => this.toggleView());
    this.searchBtn.addEventListener("click", () => this.enterSearch());
    this.searchBack.addEventListener("click", () => this.exitSearch());

    const toggleOpt = (btn: HTMLButtonElement, get: () => boolean, set: (v: boolean) => void) => {
      btn.addEventListener("click", () => {
        set(!get());
        btn.classList.toggle("active", get());
        this.runSearch();
      });
    };
    toggleOpt(this.optCase, () => this.caseSensitive, (v) => (this.caseSensitive = v));
    toggleOpt(this.optWord, () => this.wholeWord, (v) => (this.wholeWord = v));
    toggleOpt(this.optRegex, () => this.regex, (v) => (this.regex = v));

    this.searchInput.addEventListener("input", () => {
      if (this.searchTimer !== null) clearTimeout(this.searchTimer);
      this.searchTimer = window.setTimeout(() => this.runSearch(), 200);
    });
    this.searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        this.exitSearch();
      } else if (e.key === "Enter") {
        e.preventDefault();
        this.runSearch();
      }
    });
  }

  /** 文档内容变化时,如果正处于大纲视图则刷新大纲。 */
  onDocChanged(): void {
    if (this.view === "outline" && !this.searching) this.renderOutline();
  }

  // ---- 视图切换 ----

  private toggleView(): void {
    this.view = this.view === "files" ? "outline" : "files";
    this.applyView();
  }

  private applyView(): void {
    const outline = this.view === "outline";
    this.viewToggle.innerHTML = outline ? ICON_TREE : ICON_OUTLINE;
    this.viewToggle.title = outline ? "切换文件树" : "切换大纲";
    this.title.textContent = outline ? "大纲" : "文件";
    this.treeEl.classList.toggle("hidden", outline);
    this.tocPanel.classList.toggle("hidden", !outline);
    if (outline) this.renderOutline();
  }

  private renderOutline(): void {
    const headings = extractHeadings(this.deps.getMarkdown());
    this.tocList.innerHTML = "";
    this.tocList.appendChild(buildOutline(headings, (i) => this.deps.onGotoHeading(i)));
  }

  // ---- 搜索 ----

  private enterSearch(): void {
    this.searching = true;
    this.header.classList.add("hidden");
    this.searchBar.classList.remove("hidden");
    this.treeEl.classList.add("hidden");
    this.tocPanel.classList.add("hidden");
    this.resultsEl.classList.remove("hidden");
    this.searchInput.value = "";
    this.resultsEl.innerHTML = "";
    this.searchInput.focus();
  }

  private exitSearch(): void {
    this.searching = false;
    this.searchBar.classList.add("hidden");
    this.header.classList.remove("hidden");
    this.resultsEl.classList.add("hidden");
    this.resultsEl.innerHTML = "";
    // 回到之前的视图
    this.applyView();
  }

  private async runSearch(): Promise<void> {
    const root = this.deps.getRoot();
    const q = this.searchInput.value.trim();
    if (!root) {
      this.resultsEl.innerHTML = '<div class="search-empty">请先打开一个文件夹</div>';
      return;
    }
    if (!q) {
      this.resultsEl.innerHTML = "";
      return;
    }
    try {
      const hits = await searchFiles(root, q, this.caseSensitive, this.wholeWord, this.regex);
      this.renderResults(hits, root);
    } catch (e) {
      this.resultsEl.innerHTML = `<div class="search-empty search-error">${escapeHtml(String(e))}</div>`;
    }
  }

  private renderResults(hits: SearchHit[], root: string): void {
    this.resultsEl.innerHTML = "";
    if (hits.length === 0) {
      this.resultsEl.innerHTML = '<div class="search-empty">无匹配结果</div>';
      return;
    }
    for (const hit of hits) {
      const group = document.createElement("div");
      group.className = "search-group";

      const head = document.createElement("div");
      head.className = "search-file";
      const rel = hit.path.startsWith(root) ? hit.path.slice(root.length).replace(/^\//, "") : hit.path;
      head.textContent = rel;
      head.title = hit.path;
      head.addEventListener("click", () => this.deps.onOpenFile(hit.path));
      group.appendChild(head);

      for (const ln of hit.lines) {
        const row = document.createElement("div");
        row.className = "search-line";
        const no = document.createElement("span");
        no.className = "search-lineno";
        no.textContent = String(ln.line);
        const txt = document.createElement("span");
        txt.className = "search-linetext";
        txt.textContent = ln.text;
        row.append(no, txt);
        row.addEventListener("click", () => this.deps.onOpenFile(hit.path));
        group.appendChild(row);
      }
      this.resultsEl.appendChild(group);
    }
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}
