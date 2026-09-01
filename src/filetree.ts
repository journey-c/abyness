import type { FileNode } from "./backend";

/** 简约单色填充图标(内联 SVG,避免字体缺字导致的乱码方块)。 */
const ICON_FOLDER =
  '<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M1.75 3.5A.75.75 0 0 1 2.5 2.75h3.29c.3 0 .58.13.78.35l.94 1.05H13.5a.75.75 0 0 1 .75.75V12a1 1 0 0 1-1 1H2.5a.75.75 0 0 1-.75-.75v-8.75Z"/></svg>';
const ICON_FILE =
  '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.25 2.5h4.25L11.75 5.75V13a.75.75 0 0 1-.75.75h-6a.75.75 0 0 1-.75-.75V3.25a.75.75 0 0 1 .75-.75Z"/><path d="M8.25 2.6v3.15h3.15"/><path d="M6 8.75h4"/><path d="M6 11h4"/></svg>';
/** 展开/折叠三角(内联 SVG,避免字体渲染差异)。 */
const ICON_CARET =
  '<svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M3.5 1.5 9 6l-5.5 4.5z"/></svg>';

/** 右键菜单要触发的操作。重命名由文件树内部内联编辑完成,故 onRename 直接给出新名字。 */
export interface TreeActions {
  onOpen: (path: string) => void;
  onNewFile: (dir: string) => void;
  onNewFolder: (dir: string) => void;
  onRename: (path: string, newName: string, isDir: boolean) => void | Promise<void>;
  onDelete: (path: string, isDir: boolean) => void;
  onCopyPath: (path: string) => void;
  onReveal: (path: string) => void;
}

/**
 * 递归文件树渲染。用 div 结构(非 ul/li),彻底避免 WebKit 在 li 上渲染列表圆点。
 * 目录可展开/折叠;点击文件触发 onOpen;右键弹出上下文菜单;重命名走内联输入框。
 */
export class FileTree {
  private container: HTMLElement;
  private actions: TreeActions;
  private activePath: string | null = null;
  private menu: HTMLElement | null = null;
  /** 已展开目录的路径集合(跨重渲染保留,保证新建/删除后折叠状态不变)。 */
  private expanded = new Set<string>();
  /** 需要在其所在层级末尾显示的路径(如刚新建的文件),渲染一次后清空。 */
  private pinLastPath: string | null = null;

  constructor(container: HTMLElement, actions: TreeActions) {
    this.container = container;
    this.actions = actions;
    // 点击别处 / Esc 关闭右键菜单
    document.addEventListener("click", () => this.closeMenu());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.closeMenu();
    });
  }

  /** 渲染文件树。rootPath 作为顶层文件夹显示(始终展开、无三角),其下为其内容。 */
  render(nodes: FileNode[], rootPath: string): void {
    this.container.innerHTML = "";
    const rootName = rootPath.split("/").filter(Boolean).pop() ?? rootPath;
    const root: FileNode = {
      name: rootName,
      path: rootPath,
      is_dir: true,
      children: nodes,
    };
    this.container.appendChild(this.buildItem(root, 0));
    // pin 仅对本次渲染生效
    this.pinLastPath = null;
  }

  /** 标记某目录为展开(如新建条目后,让其父目录展开以便看到新项)。 */
  expand(path: string): void {
    this.expanded.add(path);
  }

  /** 让某条目在其所在层级末尾显示(如刚新建的文件),仅对下一次渲染生效。 */
  pinLast(path: string): void {
    this.pinLastPath = path;
  }

  private buildList(nodes: FileNode[], depth: number): HTMLElement {
    const box = document.createElement("div");
    box.className = "tree-list";
    // 若本层含被 pin 的条目(如新建文件),把它排到末尾
    let ordered = nodes;
    if (this.pinLastPath && nodes.some((n) => n.path === this.pinLastPath)) {
      const pinned = nodes.filter((n) => n.path === this.pinLastPath);
      const rest = nodes.filter((n) => n.path !== this.pinLastPath);
      ordered = [...rest, ...pinned];
    }
    for (const node of ordered) {
      box.appendChild(this.buildItem(node, depth));
    }
    return box;
  }

  private buildItem(node: FileNode, depth: number): HTMLElement {
    const isRoot = depth === 0;
    // 顶层目录始终展开;其余目录读持久化的展开状态
    const expanded = node.is_dir && (isRoot || this.expanded.has(node.path));

    const item = document.createElement("div");
    item.className = "tree-item";

    const row = document.createElement("div");
    row.className = node.is_dir ? "tree-row tree-dir" : "tree-row tree-file";
    row.style.paddingLeft = `${depth * 16 + 12}px`;
    row.dataset.path = node.path;
    if (node.path === this.activePath) row.classList.add("active");

    // 展开/折叠三角(仅非顶层目录展示;顶层目录与文件用占位保持缩进对齐)
    const caret = document.createElement("span");
    caret.className = "tree-caret";
    if (node.is_dir && !isRoot) {
      caret.innerHTML = ICON_CARET;
      caret.classList.toggle("expanded", expanded);
    }

    // 类型图标:文件夹 / 文档(内联 SVG 单色图标,Typora 风格)
    const icon = document.createElement("span");
    icon.className = "tree-icon";
    icon.innerHTML = node.is_dir ? ICON_FOLDER : ICON_FILE;

    const label = document.createElement("span");
    label.className = "tree-label";
    label.textContent = node.name;

    row.appendChild(caret);
    row.appendChild(icon);
    row.appendChild(label);
    item.appendChild(row);

    // 右键菜单
    row.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openMenu(e.clientX, e.clientY, node);
    });

    if (node.is_dir) {
      const childBox = this.buildList(node.children ?? [], depth + 1);
      childBox.style.display = expanded ? "block" : "none";
      item.appendChild(childBox);

      if (!isRoot) {
        row.addEventListener("click", () => {
          const nowExpanded = !this.expanded.has(node.path);
          if (nowExpanded) this.expanded.add(node.path);
          else this.expanded.delete(node.path);
          childBox.style.display = nowExpanded ? "block" : "none";
          caret.classList.toggle("expanded", nowExpanded);
        });
      }
    } else {
      // 文件无三角,caret 作为占位保持缩进对齐
      row.addEventListener("click", () => {
        this.setActive(row);
        this.actions.onOpen(node.path);
      });
    }

    return item;
  }

  private setActive(row: HTMLElement): void {
    if (this.activePath) {
      this.container
        .querySelector<HTMLElement>(`.tree-row[data-path="${cssEscape(this.activePath)}"]`)
        ?.classList.remove("active");
    }
    row.classList.add("active");
    this.activePath = row.dataset.path ?? null;
  }

  /** 外部设置当前高亮文件(如重命名后重渲染)。 */
  setActivePath(path: string): void {
    this.activePath = path;
    this.container
      .querySelector<HTMLElement>(`.tree-row[data-path="${cssEscape(path)}"]`)
      ?.classList.add("active");
  }

  // ---- 内联重命名 ----

  /**
   * 就地把某行的名字替换为输入框进行重命名。
   * 之所以不用 window.prompt:macOS WKWebView 里 prompt() 被禁用,弹不出输入框。
   */
  beginRename(path: string, isDir: boolean): void {
    const row = this.container.querySelector<HTMLElement>(
      `.tree-row[data-path="${cssEscape(path)}"]`
    );
    if (!row) return;
    const label = row.querySelector<HTMLElement>(".tree-label");
    if (!label) return;
    const oldName = label.textContent ?? "";

    const input = document.createElement("input");
    input.className = "tree-rename-input";
    input.value = oldName;
    label.replaceWith(input);
    input.focus();

    // 文件:选中不含扩展名的部分;目录:全选
    const dot = oldName.lastIndexOf(".");
    if (!isDir && dot > 0) input.setSelectionRange(0, dot);
    else input.select();

    let done = false;
    const finish = (commit: boolean) => {
      if (done) return;
      done = true;
      const next = input.value.trim();
      // 还原 label(重命名成功后 main 会重渲染;这里先恢复以防取消)
      input.replaceWith(label);
      if (commit && next && next !== oldName) {
        void this.actions.onRename(path, next, isDir);
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
    // 阻止点击输入框触发行的展开/打开
    input.addEventListener("click", (e) => e.stopPropagation());
  }

  // ---- 右键上下文菜单 ----

  private openMenu(x: number, y: number, node: FileNode): void {
    this.closeMenu();
    const menu = document.createElement("div");
    menu.className = "tree-menu";

    const items: Array<{ label: string; run: () => void }> = [];
    const targetDir = node.is_dir
      ? node.path
      : node.path.split("/").slice(0, -1).join("/");

    items.push({ label: "新建文件", run: () => this.actions.onNewFile(targetDir) });
    items.push({ label: "新建文件夹", run: () => this.actions.onNewFolder(targetDir) });
    items.push({ label: "重命名", run: () => this.beginRename(node.path, node.is_dir) });
    items.push({ label: "删除", run: () => this.actions.onDelete(node.path, node.is_dir) });
    items.push({ label: "复制路径", run: () => this.actions.onCopyPath(node.path) });
    items.push({ label: revealLabel(), run: () => this.actions.onReveal(node.path) });

    for (const it of items) {
      const el = document.createElement("div");
      el.className = "tree-menu-item";
      el.textContent = it.label;
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this.closeMenu();
        it.run();
      });
      menu.appendChild(el);
    }

    document.body.appendChild(menu);
    // 防止超出视口右/下边界
    const rect = menu.getBoundingClientRect();
    const px = Math.min(x, window.innerWidth - rect.width - 4);
    const py = Math.min(y, window.innerHeight - rect.height - 4);
    menu.style.left = `${Math.max(4, px)}px`;
    menu.style.top = `${Math.max(4, py)}px`;
    this.menu = menu;
  }

  private closeMenu(): void {
    this.menu?.remove();
    this.menu = null;
  }
}

/** 在 Finder / 资源管理器中显示 —— 按平台给出文案。 */
function revealLabel(): string {
  const isWin = navigator.userAgent.includes("Windows");
  return isWin ? "在文件资源管理器中显示" : "在 Finder 中显示";
}

/** 转义 CSS 属性选择器中的路径值。 */
function cssEscape(value: string): string {
  return value.replace(/["\\]/g, "\\$&");
}
