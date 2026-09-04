import { Decoration, EditorView, ViewPlugin, keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import type { DecorationSet, ViewUpdate } from "@codemirror/view";

/**
 * 代码块内的查找高亮(CodeMirror 装饰扩展)。
 *
 * 背景:代码块由 CodeMirror 接管 DOM,ProseMirror 的 inline 装饰无法在其中渲染,
 * 因此正文查找的黄色高亮不会出现在代码块里。此扩展把「同一个」查询词也画进
 * 每个代码块的 CodeMirror 视图,从而实现「搜索只有一个全局的,高亮能落到代码上」。
 *
 * 跳转仍由 ProseMirror 负责:选区落到代码块内部区间时,PM 会调用代码块 NodeView 的
 * setSelection → 聚焦 CodeMirror 并选中该段并滚动到可视区。
 */

/** 全局共享的查询词(与正文查找同一个)。 */
let sharedQuery = "";
/** 每次查询词变化自增;插件据此判断是否需要重算(即使是空事务)。 */
let queryGen = 0;
/** 所有存活的代码块 CodeMirror 视图,便于查询词变化时统一刷新。 */
const liveViews = new Set<EditorView>();

const matchMark = Decoration.mark({ class: "cm-find-match" });

/** 在当前可见区间内扫描查询词,构建高亮装饰(大小写不敏感)。 */
function computeDeco(view: EditorView): DecorationSet {
  const needle = sharedQuery.toLowerCase();
  if (!needle) return Decoration.none;
  const len = needle.length;
  const ranges = [];
  for (const { from, to } of view.visibleRanges) {
    const hay = view.state.doc.sliceString(from, to).toLowerCase();
    let idx = hay.indexOf(needle);
    while (idx !== -1) {
      const start = from + idx;
      ranges.push(matchMark.range(start, start + len));
      idx = hay.indexOf(needle, idx + len);
    }
  }
  return Decoration.set(ranges, true);
}

/** 注入到每个代码块 CodeMirror 的扩展:随全局查询词高亮匹配文本。 */
export const codeFindHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    private view: EditorView;
    private gen: number;

    constructor(view: EditorView) {
      this.view = view;
      this.gen = queryGen;
      liveViews.add(view);
      this.decorations = computeDeco(view);
    }

    update(update: ViewUpdate): void {
      if (update.docChanged || update.viewportChanged || this.gen !== queryGen) {
        this.gen = queryGen;
        this.decorations = computeDeco(update.view);
      }
    }

    destroy(): void {
      liveViews.delete(this.view);
    }
  },
  { decorations: (v) => v.decorations }
);

/** 设置全局查询词,并刷新所有存活代码块的高亮。 */
export function setCodeFindQuery(query: string): void {
  sharedQuery = query;
  queryGen++;
  // 空事务即可触发各 CodeMirror 的 update 重算(此调用不在任何 CM dispatch 内)。
  for (const view of liveViews) view.dispatch({});
}

/**
 * 屏蔽 CodeMirror 自带的搜索框(basicSetup 里的 @codemirror/search)。
 *
 * basicSetup 把 searchKeymap 的 Mod-f 绑到「打开代码块内搜索框」。本项目只要一个
 * 全局查找,故用最高优先级 keymap 吞掉 Mod-f / Mod-Alt-f,阻止 CodeMirror 打开自带搜索框。
 * 键盘事件仍会冒泡到 window,由全局监听打开统一的查找面板(见 main.ts),无需在此重复触发。
 * 用 Prec.highest 确保排在 basicSetup(先注册)之前生效。
 */
export const suppressCodeSearch = Prec.highest(
  keymap.of([
    { key: "Mod-f", run: () => true },
    { key: "Mod-Alt-f", run: () => true },
  ])
);
