import type { Editor } from "./editor";
import {
  wrapInHeadingCommand,
  turnIntoTextCommand,
  wrapInBlockquoteCommand,
  wrapInOrderedListCommand,
  wrapInBulletListCommand,
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  toggleLinkCommand,
  insertImageCommand,
  createCodeBlockCommand,
  insertHrCommand,
} from "@milkdown/kit/preset/commonmark";
import {
  toggleStrikethroughCommand,
  insertTableCommand,
} from "@milkdown/kit/preset/gfm";

/** 一段分隔线。 */
const SEP = Symbol("separator");
type MenuNode = MenuEntry | typeof SEP;

/** 单个菜单项:普通项(带命令)或带子菜单的父项。 */
interface MenuEntry {
  label: string;
  /** 右侧快捷键提示(仅展示,不绑定)。 */
  accel?: string;
  /** 左侧单色图标(内联 SVG)。 */
  icon?: string;
  /** 点击执行;不给则为纯父项(仅承载子菜单)。 */
  run?: () => void;
  /** 子菜单项。 */
  children?: MenuNode[];
}

// ---- 内联单色图标(跟随文字色) ----
const IC = {
  cut: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="4" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><path d="M5.5 10.5 13 3M2.5 3l8 8" stroke-linecap="round"/></svg>',
  copy: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="5" y="5" width="8" height="9" rx="1"/><path d="M3 11V3a1 1 0 0 1 1-1h6" stroke-linecap="round"/></svg>',
  paste: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="3" width="10" height="11" rx="1"/><path d="M6 3V2h4v1" stroke-linecap="round"/></svg>',
  paragraph: '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M4.5 3h7v1.4H9.9V13H8.5V4.4H7.3V13H5.9V8.2A2.6 2.6 0 0 1 4.5 3Z"/></svg>',
  format: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M4 12h8M6 4l-2 6M10 4l2 6M6.5 8h3M7 4h2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  insert: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>',
};

/**
 * 正文右键菜单:替代 Crepe 的悬浮块手柄/选区工具栏。
 * 结构对齐 Typora/系统右键:剪切/拷贝/粘贴 + 段落▸/格式▸/插入▸。
 * 子菜单在父项右侧展开,超出视口自动翻转。
 */
export class ContextMenu {
  private editor: Editor;

  constructor(host: HTMLElement, editor: Editor) {
    this.editor = editor;

    host.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.open(e.clientX, e.clientY);
    });
    document.addEventListener("click", () => this.close());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.close();
    });
    // 滚动时关闭,避免菜单错位
    window.addEventListener("scroll", () => this.close(), true);
  }

  /** 执行命令前先聚焦编辑区,保证作用于当前选区,然后关闭菜单。 */
  private exec(fn: () => void): void {
    this.editor.focus();
    fn();
    this.close();
  }

  private buildModel(): MenuNode[] {
    const ed = this.editor;
    return [
      { label: "剪切", accel: "⌘X", icon: IC.cut, run: () => this.exec(() => document.execCommand("cut")) },
      { label: "拷贝", accel: "⌘C", icon: IC.copy, run: () => this.exec(() => document.execCommand("copy")) },
      { label: "粘贴", accel: "⌘V", icon: IC.paste, run: () => this.exec(() => this.paste()) },
      SEP,
      {
        label: "段落",
        icon: IC.paragraph,
        children: [
          { label: "一级标题", accel: "⌘1", run: () => this.exec(() => ed.runCommand(wrapInHeadingCommand.key, 1)) },
          { label: "二级标题", accel: "⌘2", run: () => this.exec(() => ed.runCommand(wrapInHeadingCommand.key, 2)) },
          { label: "三级标题", accel: "⌘3", run: () => this.exec(() => ed.runCommand(wrapInHeadingCommand.key, 3)) },
          { label: "四级标题", accel: "⌘4", run: () => this.exec(() => ed.runCommand(wrapInHeadingCommand.key, 4)) },
          { label: "五级标题", accel: "⌘5", run: () => this.exec(() => ed.runCommand(wrapInHeadingCommand.key, 5)) },
          { label: "六级标题", accel: "⌘6", run: () => this.exec(() => ed.runCommand(wrapInHeadingCommand.key, 6)) },
          SEP,
          { label: "引用", run: () => this.exec(() => ed.runCommand(wrapInBlockquoteCommand.key)) },
          { label: "有序列表", run: () => this.exec(() => ed.runCommand(wrapInOrderedListCommand.key)) },
          { label: "无序列表", run: () => this.exec(() => ed.runCommand(wrapInBulletListCommand.key)) },
          SEP,
          { label: "段落", accel: "⌘0", run: () => this.exec(() => ed.runCommand(turnIntoTextCommand.key)) },
        ],
      },
      {
        label: "格式",
        icon: IC.format,
        children: [
          { label: "加粗", accel: "⌘B", run: () => this.exec(() => ed.runCommand(toggleStrongCommand.key)) },
          { label: "斜体", accel: "⌘I", run: () => this.exec(() => ed.runCommand(toggleEmphasisCommand.key)) },
          { label: "代码", run: () => this.exec(() => ed.runCommand(toggleInlineCodeCommand.key)) },
          { label: "删除线", run: () => this.exec(() => ed.runCommand(toggleStrikethroughCommand.key)) },
          SEP,
          { label: "超链接", accel: "⌘K", run: () => this.exec(() => ed.runCommand(toggleLinkCommand.key)) },
        ],
      },
      {
        label: "插入",
        icon: IC.insert,
        children: [
          { label: "图像", run: () => this.exec(() => ed.runCommand(insertImageCommand.key, {})) },
          { label: "代码块", run: () => this.exec(() => ed.runCommand(createCodeBlockCommand.key)) },
          { label: "表格", run: () => this.exec(() => ed.runCommand(insertTableCommand.key)) },
          SEP,
          { label: "水平分割线", run: () => this.exec(() => ed.runCommand(insertHrCommand.key)) },
        ],
      },
    ];
  }

  /** 尽力粘贴:WKWebView 下 execCommand('paste') 常被禁用,退化为读剪贴板 API。 */
  private paste(): void {
    const ok = document.execCommand("paste");
    if (ok) return;
    // 退化:异步读取剪贴板文本并插入
    if (navigator.clipboard?.readText) {
      void navigator.clipboard.readText().then((text) => {
        if (text) document.execCommand("insertText", false, text);
      });
    }
  }

  private open(x: number, y: number): void {
    this.close();
    const menu = this.renderLevel(this.buildModel());
    document.body.appendChild(menu);
    this.place(menu, x, y);
  }

  /** 渲染一级菜单容器(含其子菜单联动)。 */
  private renderLevel(nodes: MenuNode[]): HTMLElement {
    const box = document.createElement("div");
    box.className = "ctx-menu";
    let openSub: HTMLElement | null = null;
    let openParent: HTMLElement | null = null;
    let closeTimer: number | null = null;

    const cancelClose = () => {
      if (closeTimer !== null) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    };
    const closeSubNow = () => {
      cancelClose();
      if (openSub) openSub.remove();
      openSub = null;
      openParent = null;
    };
    // 延迟关闭:给鼠标从父项移动到子菜单留出空隙时间
    const scheduleClose = () => {
      cancelClose();
      closeTimer = window.setTimeout(() => {
        closeTimer = null;
        if (
          openSub &&
          !openSub.matches(":hover") &&
          !(openParent && openParent.matches(":hover"))
        ) {
          closeSubNow();
        }
      }, 180);
    };

    for (const node of nodes) {
      if (node === SEP) {
        const hr = document.createElement("div");
        hr.className = "ctx-sep";
        box.appendChild(hr);
        continue;
      }
      const entry = node as MenuEntry;
      const item = document.createElement("div");
      item.className = "ctx-item";
      if (entry.children) item.classList.add("has-sub");

      const icon = document.createElement("span");
      icon.className = "ctx-icon";
      icon.innerHTML = entry.icon ?? "";
      const label = document.createElement("span");
      label.className = "ctx-label";
      label.textContent = entry.label;
      const tail = document.createElement("span");
      tail.className = "ctx-tail";
      tail.textContent = entry.children ? "›" : entry.accel ?? "";

      item.append(icon, label, tail);
      box.appendChild(item);

      if (entry.children) {
        const children = entry.children;
        // hover 展开子菜单
        item.addEventListener("mouseenter", () => {
          cancelClose();
          // 已经是当前展开项则不重建,避免闪烁与竞态
          if (openParent === item && openSub) return;
          if (openSub) openSub.remove();
          const sub = this.renderLevel(children);
          document.body.appendChild(sub);
          this.placeSub(sub, item);
          openSub = sub;
          openParent = item;
          // 鼠标进入子菜单时取消关闭;离开子菜单时再延迟关闭
          sub.addEventListener("mouseenter", cancelClose);
          sub.addEventListener("mouseleave", scheduleClose);
        });
        item.addEventListener("mouseleave", scheduleClose);
      } else {
        // 移到无子菜单的兄弟项上:关闭当前子菜单
        item.addEventListener("mouseenter", () => {
          if (openParent && openParent !== item) closeSubNow();
        });
        if (entry.run) {
          item.addEventListener("click", (ev) => {
            ev.stopPropagation();
            entry.run!();
          });
        }
      }
    }
    return box;
  }

  /** 放置顶层菜单,纠正超出视口。 */
  private place(menu: HTMLElement, x: number, y: number): void {
    const r = menu.getBoundingClientRect();
    const px = Math.min(x, window.innerWidth - r.width - 6);
    const py = Math.min(y, window.innerHeight - r.height - 6);
    menu.style.left = `${Math.max(6, px)}px`;
    menu.style.top = `${Math.max(6, py)}px`;
  }

  /** 放置子菜单:默认在父项右侧,超出右边界则翻到左侧。 */
  private placeSub(sub: HTMLElement, parentItem: HTMLElement): void {
    const pr = parentItem.getBoundingClientRect();
    const sr = sub.getBoundingClientRect();
    let left = pr.right - 2;
    if (left + sr.width > window.innerWidth - 6) {
      left = pr.left - sr.width + 2;
    }
    let top = pr.top - 4;
    if (top + sr.height > window.innerHeight - 6) {
      top = window.innerHeight - sr.height - 6;
    }
    sub.style.left = `${Math.max(6, left)}px`;
    sub.style.top = `${Math.max(6, top)}px`;
  }

  private close(): void {
    // 移除所有已渲染的菜单层(顶层 + 子菜单都挂在 body 上)
    document.querySelectorAll(".ctx-menu").forEach((el) => el.remove());
  }
}
