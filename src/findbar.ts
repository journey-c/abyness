import type { EditorView as ProseView } from "@milkdown/kit/prose/view";
import {
  setFindQuery,
  gotoMatch,
  replaceCurrent,
  replaceAll,
  clearFind,
  type FindStatus,
} from "./findplugin";

type Mode = "find" | "replace";

/**
 * 正文内「查找 / 替换」浮动面板(编辑区右上角)。
 * - 查找 tab:输入框 + n/N 计数 + 上一处/下一处。
 * - 替换 tab:额外的替换输入框 + 替换/全部替换。
 * - Cmd/Ctrl+F 打开;Esc 关闭;Enter 下一处、Shift+Enter 上一处。
 * 高亮与跳转由 findplugin(ProseMirror 装饰)负责,本类只管 UI 与调用。
 */
export class FindBar {
  private getView: () => ProseView | null;
  private panel: HTMLElement;
  private tabFind: HTMLButtonElement;
  private tabReplace: HTMLButtonElement;
  private findInput: HTMLInputElement;
  private replaceInput: HTMLInputElement;
  private counter: HTMLElement;
  private replaceRow: HTMLElement;
  private prevBtn: HTMLButtonElement;
  private nextBtn: HTMLButtonElement;
  private replaceBtn: HTMLButtonElement;
  private replaceAllBtn: HTMLButtonElement;

  private open_ = false;
  private debounce: number | null = null;

  constructor(_root: HTMLElement, getView: () => ProseView | null) {
    this.getView = getView;

    this.panel = document.querySelector<HTMLElement>("#find-panel")!;
    this.tabFind = this.panel.querySelector<HTMLButtonElement>("#find-tab-find")!;
    this.tabReplace = this.panel.querySelector<HTMLButtonElement>("#find-tab-replace")!;
    this.findInput = this.panel.querySelector<HTMLInputElement>("#find-input")!;
    this.replaceInput = this.panel.querySelector<HTMLInputElement>("#find-replace-input")!;
    this.counter = this.panel.querySelector<HTMLElement>("#find-counter")!;
    this.replaceRow = this.panel.querySelector<HTMLElement>("#find-replace-row")!;
    this.prevBtn = this.panel.querySelector<HTMLButtonElement>("#find-prev")!;
    this.nextBtn = this.panel.querySelector<HTMLButtonElement>("#find-next")!;
    this.replaceBtn = this.panel.querySelector<HTMLButtonElement>("#find-replace")!;
    this.replaceAllBtn = this.panel.querySelector<HTMLButtonElement>("#find-replace-all")!;
    const closeBtn = this.panel.querySelector<HTMLButtonElement>("#find-close")!;

    this.tabFind.addEventListener("click", () => this.setMode("find"));
    this.tabReplace.addEventListener("click", () => this.setMode("replace"));
    closeBtn.addEventListener("click", () => this.close());

    this.findInput.addEventListener("input", () => {
      if (this.debounce !== null) clearTimeout(this.debounce);
      this.debounce = window.setTimeout(() => this.runQuery(), 120);
    });
    this.findInput.addEventListener("keydown", (e) => this.onFindKey(e));
    this.replaceInput.addEventListener("keydown", (e) => this.onReplaceKey(e));

    this.prevBtn.addEventListener("click", () => this.goto(-1));
    this.nextBtn.addEventListener("click", () => this.goto(1));
    this.replaceBtn.addEventListener("click", () => this.doReplace());
    this.replaceAllBtn.addEventListener("click", () => this.doReplaceAll());
  }

  /** 打开面板并切到指定 tab;预填当前选区文本并立即查询。 */
  open(mode: Mode = "find"): void {
    this.open_ = true;
    this.panel.classList.remove("hidden");
    this.setMode(mode);

    const sel = this.selectedText();
    if (sel) this.findInput.value = sel;
    this.findInput.focus();
    this.findInput.select();
    this.runQuery();
  }

  /** 关闭面板并清除正文高亮。 */
  close(): void {
    if (!this.open_) return;
    this.open_ = false;
    this.panel.classList.add("hidden");
    const view = this.getView();
    if (view) {
      clearFind(view);
      view.focus();
    }
  }

  isOpen(): boolean {
    return this.open_;
  }

  // ---- 内部 ----

  private setMode(mode: Mode): void {
    const replace = mode === "replace";
    this.tabFind.classList.toggle("active", !replace);
    this.tabReplace.classList.toggle("active", replace);
    this.replaceRow.classList.toggle("hidden", !replace);
    this.panel.classList.toggle("replace-mode", replace);
  }

  private selectedText(): string {
    const view = this.getView();
    if (!view) return "";
    const { from, to } = view.state.selection;
    if (from === to) return "";
    const text = view.state.doc.textBetween(from, to, "\n").trim();
    // 仅预填单行、较短的选区
    return text.includes("\n") ? "" : text.slice(0, 200);
  }

  private runQuery(): void {
    const view = this.getView();
    if (!view) return;
    const st = setFindQuery(view, this.findInput.value);
    this.render(st);
    this.refocus();
  }

  private goto(dir: 1 | -1): void {
    const view = this.getView();
    if (!view) return;
    this.render(gotoMatch(view, dir));
    this.refocus();
  }

  /**
   * 把焦点抢回查找框。跳到代码块内的匹配时,ProseMirror 会让对应 CodeMirror
   * 抢走焦点,导致 Enter/Shift+Enter 无法继续在匹配间跳转;故每次跳转后回夺焦点。
   */
  private refocus(): void {
    if (document.activeElement !== this.findInput) this.findInput.focus();
  }

  private doReplace(): void {
    const view = this.getView();
    if (!view) return;
    this.render(replaceCurrent(view, this.replaceInput.value));
  }

  private doReplaceAll(): void {
    const view = this.getView();
    if (!view) return;
    replaceAll(view, this.replaceInput.value);
    // 全部替换后按现查询词重新统计(通常归零)
    this.runQuery();
  }

  private onFindKey(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      e.preventDefault();
      this.close();
    } else if (e.key === "Enter") {
      e.preventDefault();
      this.goto(e.shiftKey ? -1 : 1);
    }
  }

  private onReplaceKey(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      e.preventDefault();
      this.close();
    } else if (e.key === "Enter") {
      e.preventDefault();
      this.doReplace();
    }
  }

  /** 根据状态更新计数与按钮可用态。 */
  private render(st: FindStatus): void {
    this.counter.textContent = `${st.index}/${st.count}`;
    const has = st.count > 0;
    this.prevBtn.disabled = !has;
    this.nextBtn.disabled = !has;
    this.replaceBtn.disabled = !has;
    this.replaceAllBtn.disabled = !has;
  }
}
