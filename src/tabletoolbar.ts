import type { Editor } from "./editor";
import {
  setAlignCommand,
  selectColCommand,
  selectRowCommand,
  addColAfterCommand,
  addRowAfterCommand,
  deleteSelectedCellsCommand,
  selectTableCommand,
} from "@milkdown/kit/preset/gfm";
import { findTable } from "@milkdown/kit/prose/tables";

/**
 * 表格编辑工具条:点击进入某个表格时,在该表格左上角悬浮一条工具条。
 * 功能(对齐截图 #29):
 *  - 尺寸选择器(网格 + 行×列 输入):把当前表格调整到目标行列数。
 *  - 列对齐:左 / 中 / 右(作用于当前列)。
 *  - 删除整表。
 * 与 Crepe 自带的 hover 手柄不同:这是点击(选区落入表格)才出现,不占排版。
 */

// ---- 内联单色图标 ----
const ICONS = {
  size: '<svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/></svg>',
  alignLeft: '<svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 5h14M3 10h9M3 15h12"/></svg>',
  alignCenter: '<svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 5h14M5 10h10M4 15h12"/></svg>',
  alignRight: '<svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 5h14M8 10h9M5 15h12"/></svg>',
  trash: '<svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10"/></svg>',
};

const GRID_ROWS = 8;
const GRID_COLS = 8;

interface TableGeom {
  /** 表格在文档中的起始位置(getPos+1 语义,用于 select*Command 的 pos)。 */
  pos: number;
  rows: number;
  cols: number;
  /** 表格 DOM(用于定位工具条)。 */
  dom: HTMLElement;
}

export class TableToolbar {
  private editor: Editor;
  private bar: HTMLElement | null = null;
  private sizePanel: HTMLElement | null = null;
  private geom: TableGeom | null = null;

  constructor(root: HTMLElement, editor: Editor) {
    this.editor = editor;

    // 选区变化 / 点击 / 键盘移动都可能改变"是否在表格内",统一刷新
    const refresh = () => this.refresh();
    root.addEventListener("mouseup", refresh);
    root.addEventListener("keyup", refresh);
    root.addEventListener("focusout", () => {
      // 焦点移出编辑区(如点到工具条以外)时延迟收起
      setTimeout(() => {
        if (!this.isSelfFocused()) this.refresh();
      }, 0);
    });
    // 滚动时跟随位置
    root.addEventListener("scroll", () => this.reposition(), true);
    window.addEventListener("resize", () => this.reposition());
  }

  private isSelfFocused(): boolean {
    const a = document.activeElement;
    return !!a && (a === this.bar || this.bar?.contains(a) === true ||
      a === this.sizePanel || this.sizePanel?.contains(a) === true);
  }

  /** 读取当前选区所在表格的几何信息;不在表格内则返回 null。 */
  private currentTable(): TableGeom | null {
    const view = this.editor.getView();
    if (!view) return null;
    const { state } = view;
    const $pos = state.selection.$head;
    const found = findTable($pos);
    if (!found) return null;
    const table = found.node;
    const rows = table.childCount;
    let cols = 0;
    if (rows > 0) cols = table.child(0).childCount;
    // getPos 语义:found.pos 是 table 节点前的位置;命令里用的 pos 是 table 内部起点
    const pos = found.pos + 1;
    const dom = view.nodeDOM(found.pos) as HTMLElement | null;
    // nodeDOM 返回 table-block 容器;真正的内容表格是 <table class="children">,
    // 需避开隐藏的 .drag-preview 里的占位表格。
    let tableDom: HTMLElement | null = null;
    if (dom instanceof HTMLElement) {
      if (dom.matches("table.children")) tableDom = dom;
      else tableDom = dom.querySelector<HTMLElement>("table.children");
      // 兜底:退回容器本身或第一个可见 table
      if (!tableDom) tableDom = dom.querySelector<HTMLElement>(".table-wrapper table") ?? dom;
    }
    if (!tableDom) return null;
    return { pos, rows, cols, dom: tableDom };
  }

  /** 根据当前选区显示或隐藏工具条。 */
  private refresh(): void {
    const geom = this.currentTable();
    if (!geom) {
      this.hide();
      return;
    }
    this.geom = geom;
    if (!this.bar) this.buildBar();
    this.reposition();
  }

  private hide(): void {
    this.bar?.remove();
    this.bar = null;
    this.closeSizePanel();
    this.geom = null;
  }

  private buildBar(): void {
    const bar = document.createElement("div");
    bar.className = "tbl-toolbar";

    const mkBtn = (icon: string, title: string, onClick: () => void) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tbl-btn";
      b.title = title;
      b.innerHTML = icon;
      // 用 mousedown 触发,避免点击导致编辑区先失焦、选区丢失
      b.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      });
      return b;
    };

    const sizeBtn = mkBtn(ICONS.size, "调整表格尺寸", () => this.toggleSizePanel(sizeBtn));
    bar.appendChild(sizeBtn);

    const sep = document.createElement("span");
    sep.className = "tbl-sep";
    bar.appendChild(sep);

    bar.appendChild(mkBtn(ICONS.alignLeft, "左对齐", () => this.align("left")));
    bar.appendChild(mkBtn(ICONS.alignCenter, "居中对齐", () => this.align("center")));
    bar.appendChild(mkBtn(ICONS.alignRight, "右对齐", () => this.align("right")));

    const sep2 = document.createElement("span");
    sep2.className = "tbl-sep";
    bar.appendChild(sep2);

    bar.appendChild(mkBtn(ICONS.trash, "删除表格", () => this.deleteTable()));

    document.body.appendChild(bar);
    this.bar = bar;
  }

  /** 把工具条定位到当前表格左上角上方。 */
  private reposition(): void {
    if (!this.bar || !this.geom) return;
    const r = this.geom.dom.getBoundingClientRect();
    // 表格不在可视区域时隐藏工具条
    if (r.bottom < 0 || r.top > window.innerHeight) {
      this.bar.style.display = "none";
      this.closeSizePanel();
      return;
    }
    this.bar.style.display = "";
    const barH = this.bar.offsetHeight || 34;
    let top = r.top - barH - 6;
    if (top < 6) top = r.top + 6; // 顶部空间不足则贴在表格内上沿
    this.bar.style.left = `${Math.max(6, r.left)}px`;
    this.bar.style.top = `${top}px`;
    if (this.sizePanel) this.positionSizePanel();
  }

  // ---- 对齐 / 删除 ----

  private align(dir: "left" | "center" | "right"): void {
    // 若当前不是列选区,setAlignCommand 也会作用于当前单元格;直接调用即可
    this.editor.runCommand(setAlignCommand.key, dir);
    this.editor.focus();
  }

  private deleteTable(): void {
    // 选中整表后删除
    this.editor.runCommand(selectTableCommand.key);
    this.editor.runCommand(deleteSelectedCellsCommand.key);
    this.editor.focus();
    this.hide();
  }

  // ---- 尺寸选择器 ----

  private toggleSizePanel(anchor: HTMLElement): void {
    if (this.sizePanel) {
      this.closeSizePanel();
      return;
    }
    this.openSizePanel(anchor);
  }

  private closeSizePanel(): void {
    this.sizePanel?.remove();
    this.sizePanel = null;
  }

  private openSizePanel(anchor: HTMLElement): void {
    if (!this.geom) return;
    const panel = document.createElement("div");
    panel.className = "tbl-size-panel";
    panel.addEventListener("mousedown", (e) => e.preventDefault());

    const curRows = this.geom.rows;
    const curCols = this.geom.cols;

    const grid = document.createElement("div");
    grid.className = "tbl-size-grid";
    const cells: HTMLElement[][] = [];
    const paint = (r: number, c: number) => {
      for (let i = 0; i < GRID_ROWS; i++) {
        for (let j = 0; j < GRID_COLS; j++) {
          cells[i][j].classList.toggle("on", i <= r && j <= c);
        }
      }
    };
    for (let i = 0; i < GRID_ROWS; i++) {
      cells[i] = [];
      for (let j = 0; j < GRID_COLS; j++) {
        const cell = document.createElement("div");
        cell.className = "tbl-size-cell";
        cell.addEventListener("mouseenter", () => {
          paint(i, j);
          rowsInput.value = String(i + 1);
          colsInput.value = String(j + 1);
        });
        cell.addEventListener("mousedown", (e) => {
          e.preventDefault();
          this.resizeTo(i + 1, j + 1);
          this.closeSizePanel();
        });
        grid.appendChild(cell);
        cells[i].push(cell);
      }
    }
    panel.appendChild(grid);

    // 行×列 数字输入
    const nums = document.createElement("div");
    nums.className = "tbl-size-nums";
    const rowsInput = document.createElement("input");
    rowsInput.type = "number";
    rowsInput.min = "1";
    rowsInput.value = String(curRows);
    const x = document.createElement("span");
    x.textContent = "×";
    const colsInput = document.createElement("input");
    colsInput.type = "number";
    colsInput.min = "1";
    colsInput.value = String(curCols);
    const apply = () => {
      const rr = Math.max(1, parseInt(rowsInput.value || "1", 10));
      const cc = Math.max(1, parseInt(colsInput.value || "1", 10));
      this.resizeTo(rr, cc);
      this.closeSizePanel();
    };
    rowsInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") apply();
    });
    colsInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") apply();
    });
    nums.append(rowsInput, x, colsInput);
    panel.appendChild(nums);

    // 初始高亮映射到当前尺寸
    paint(Math.min(curRows, GRID_ROWS) - 1, Math.min(curCols, GRID_COLS) - 1);

    document.body.appendChild(panel);
    this.sizePanel = panel;
    this.sizeAnchor = anchor;
    this.positionSizePanel();
  }

  private sizeAnchor: HTMLElement | null = null;

  private positionSizePanel(): void {
    if (!this.sizePanel || !this.sizeAnchor) return;
    const ar = this.sizeAnchor.getBoundingClientRect();
    this.sizePanel.style.left = `${Math.max(6, ar.left)}px`;
    this.sizePanel.style.top = `${ar.bottom + 4}px`;
  }

  /**
   * 把当前表格调整到目标行列数:通过按当前列/行末尾增删来实现。
   * 增行:选中最后一行 → addRowAfter;删行:选中末行 → 删除。列同理。
   */
  private resizeTo(targetRows: number, targetCols: number): void {
    const g = this.geom;
    if (!g) return;

    // 逐步增删列
    let cols = g.cols;
    while (cols < targetCols) {
      this.editor.runCommand(selectColCommand.key, { pos: g.pos, index: cols - 1 });
      this.editor.runCommand(addColAfterCommand.key);
      cols++;
    }
    while (cols > targetCols && cols > 1) {
      this.editor.runCommand(selectColCommand.key, { pos: g.pos, index: cols - 1 });
      this.editor.runCommand(deleteSelectedCellsCommand.key);
      cols--;
    }

    // 逐步增删行(表头行 index 0 不删)
    let rows = g.rows;
    while (rows < targetRows) {
      this.editor.runCommand(selectRowCommand.key, { pos: g.pos, index: rows - 1 });
      this.editor.runCommand(addRowAfterCommand.key);
      rows++;
    }
    while (rows > targetRows && rows > 1) {
      this.editor.runCommand(selectRowCommand.key, { pos: g.pos, index: rows - 1 });
      this.editor.runCommand(deleteSelectedCellsCommand.key);
      rows--;
    }

    this.editor.focus();
    // 尺寸变化后重新读几何并复位工具条
    setTimeout(() => this.refresh(), 0);
  }
}
