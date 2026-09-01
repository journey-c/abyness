import { extractHeadings, buildOutline } from "./toc";

/** TocPopup 依赖注入:提供当前文档与跳转能力。 */
export interface TocPopupDeps {
  /** 当前文档 markdown(用于提取标题)。 */
  getMarkdown: () => string;
  /** 点击大纲项:跳转到第 index 个标题(0-based)。 */
  onGotoHeading: (index: number) => void;
}

/**
 * 大纲悬浮窗:点击顶栏「大纲」按钮时,浮在正文右上角展示标题列表。
 * - 与侧栏大纲共用 `buildOutline` 渲染,保证外观一致。
 * - 打开时点击窗口外部自动关闭;文档变化时若开着则实时刷新。
 */
export class TocPopup {
  private deps: TocPopupDeps;
  private popup = document.querySelector<HTMLElement>("#toc-popup")!;
  private list = document.querySelector<HTMLElement>("#toc-popup-list")!;
  private trigger: HTMLElement;

  constructor(trigger: HTMLElement, deps: TocPopupDeps) {
    this.trigger = trigger;
    this.deps = deps;

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggle();
    });
    // 点击悬浮窗与触发按钮之外的区域时关闭
    document.addEventListener("mousedown", (e) => {
      if (this.isHidden()) return;
      const t = e.target as Node;
      if (!this.popup.contains(t) && !this.trigger.contains(t)) this.hide();
    });
  }

  /** 文档内容变化时调用:窗口开着才刷新,避免无谓渲染。 */
  onDocChanged(): void {
    if (!this.isHidden()) this.render();
  }

  private isHidden(): boolean {
    return this.popup.classList.contains("hidden");
  }

  private toggle(): void {
    if (this.isHidden()) {
      this.render();
      this.popup.classList.remove("hidden");
    } else {
      this.hide();
    }
  }

  private hide(): void {
    this.popup.classList.add("hidden");
  }

  private render(): void {
    const headings = extractHeadings(this.deps.getMarkdown());
    this.list.innerHTML = "";
    this.list.appendChild(
      buildOutline(
        headings,
        (i) => {
          this.deps.onGotoHeading(i);
          this.hide();
        },
        "暂无标题",
        10
      )
    );
  }
}
