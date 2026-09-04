import { $prose } from "@milkdown/kit/utils";
import { Plugin, PluginKey, TextSelection } from "@milkdown/kit/prose/state";
import { Decoration, DecorationSet } from "@milkdown/kit/prose/view";
import type { EditorState, Transaction } from "@milkdown/kit/prose/state";
import type { EditorView } from "@milkdown/kit/prose/view";
import type { Node as ProseNode } from "@milkdown/kit/prose/model";
import { setCodeFindQuery } from "./findcm";

/**
 * 正文内查找/替换:基于 ProseMirror 装饰(Decoration)。
 * - 遍历文档文本节点做大小写不敏感子串匹配,给命中区间加高亮装饰。
 * - 当前项额外高亮,可上一处/下一处跳转、替换当前、全部替换。
 * - 代码块由 CodeMirror 渲染,不在 ProseMirror 文本节点内,故不覆盖其内部文本。
 */

export interface FindMatch {
  from: number;
  to: number;
}

interface FindState {
  query: string;
  matches: FindMatch[];
  active: number; // 当前项索引;无匹配时为 -1
  deco: DecorationSet;
}

export const findPluginKey = new PluginKey<FindState>("abyness-find");

/** meta:重新设置查询词并把 active 归位到第一处。 */
interface SetQueryMeta {
  type: "setQuery";
  query: string;
}
/** meta:切换当前项索引(已归一化)。 */
interface SetActiveMeta {
  type: "setActive";
  active: number;
}
/** meta:清空查找状态(关闭面板)。 */
interface ClearMeta {
  type: "clear";
}
type FindMeta = SetQueryMeta | SetActiveMeta | ClearMeta;

/** 扫描整篇文档,返回所有匹配区间(文档绝对坐标)。 */
function computeMatches(doc: ProseNode, query: string): FindMatch[] {
  const matches: FindMatch[] = [];
  if (!query) return matches;
  const needle = query.toLowerCase();
  const len = query.length;

  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const text = node.text ?? "";
    const hay = text.toLowerCase();
    let idx = hay.indexOf(needle);
    while (idx !== -1) {
      const from = pos + idx;
      matches.push({ from, to: from + len });
      idx = hay.indexOf(needle, idx + len);
    }
    return false; // 文本节点无子节点,无需深入
  });
  return matches;
}

/** 由匹配集合与当前项构建装饰。 */
function buildDeco(doc: ProseNode, matches: FindMatch[], active: number): DecorationSet {
  if (matches.length === 0) return DecorationSet.empty;
  const decos = matches.map((m, i) =>
    Decoration.inline(m.from, m.to, {
      class: i === active ? "find-match find-match-current" : "find-match",
    })
  );
  return DecorationSet.create(doc, decos);
}

const EMPTY_STATE: FindState = {
  query: "",
  matches: [],
  active: -1,
  deco: DecorationSet.empty,
};

/** Milkdown 插件:注册到编辑器(在 crepe.create() 前 crepe.editor.use(...))。 */
export const findPlugin = $prose(
  () =>
    new Plugin<FindState>({
      key: findPluginKey,
      state: {
        init: () => EMPTY_STATE,
        apply(tr: Transaction, prev: FindState): FindState {
          const meta = tr.getMeta(findPluginKey) as FindMeta | undefined;

          if (meta?.type === "clear") return EMPTY_STATE;

          if (meta?.type === "setQuery") {
            const matches = computeMatches(tr.doc, meta.query);
            const active = matches.length > 0 ? 0 : -1;
            return {
              query: meta.query,
              matches,
              active,
              deco: buildDeco(tr.doc, matches, active),
            };
          }

          if (meta?.type === "setActive") {
            const active = prev.matches.length > 0 ? meta.active : -1;
            return {
              ...prev,
              active,
              deco: buildDeco(tr.doc, prev.matches, active),
            };
          }

          // 文档发生变化(如替换/编辑):按当前查询重算,尽量保持 active 落在附近。
          if (tr.docChanged && prev.query) {
            const matches = computeMatches(tr.doc, prev.query);
            let active = -1;
            if (matches.length > 0) {
              active = Math.min(prev.active < 0 ? 0 : prev.active, matches.length - 1);
            }
            return {
              query: prev.query,
              matches,
              active,
              deco: buildDeco(tr.doc, matches, active),
            };
          }

          return prev;
        },
      },
      props: {
        decorations(state: EditorState) {
          return findPluginKey.getState(state)?.deco ?? DecorationSet.empty;
        },
      },
    })
);

/** 读取当前查找状态。 */
function getState(view: EditorView): FindState {
  return findPluginKey.getState(view.state) ?? EMPTY_STATE;
}

export interface FindStatus {
  /** 匹配总数。 */
  count: number;
  /** 当前项序号(1-based);无匹配时为 0。 */
  index: number;
}

function status(s: FindState): FindStatus {
  return {
    count: s.matches.length,
    index: s.active >= 0 ? s.active + 1 : 0,
  };
}

/** 找到编辑区的滚动容器(#editor,overflow-y:auto)。 */
function scrollContainerOf(view: EditorView): HTMLElement | null {
  let el: HTMLElement | null = view.dom.parentElement;
  while (el) {
    const oy = getComputedStyle(el).overflowY;
    if (oy === "auto" || oy === "scroll") return el;
    el = el.parentElement;
  }
  return null;
}

/** 把当前项滚动到可视区中部,并将选区落到它上面(不抢焦点由调用方决定)。 */
function scrollToActive(view: EditorView): void {
  const s = getState(view);
  if (s.active < 0) return;
  const m = s.matches[s.active];
  const tr = view.state.tr.setSelection(
    TextSelection.create(view.state.doc, m.from, m.to)
  );
  // 不通过我们自己的 meta,避免触发重算;这是纯选区事务
  view.dispatch(tr);

  // 显式把匹配滚到编辑区中部:tr.scrollIntoView() 只做最小滚动,且代码块内的
  // 匹配位于 CodeMirror NodeView 中,常无法带动外层 #editor 滚动。改用坐标计算。
  // 延后一帧,等代码块(懒挂载/聚焦)完成布局后再测量坐标。
  requestAnimationFrame(() => {
    const container = scrollContainerOf(view);
    if (!container) {
      view.dispatch(view.state.tr.scrollIntoView());
      return;
    }
    let coords: { top: number; bottom: number };
    try {
      coords = view.coordsAtPos(m.from);
    } catch {
      return;
    }
    const box = container.getBoundingClientRect();
    const matchMid = (coords.top + coords.bottom) / 2;
    // 目标:把匹配放到容器可视高度中部
    const delta = matchMid - (box.top + box.height / 2);
    container.scrollBy({ top: delta, behavior: "smooth" });
  });
}

/** 设置查询词,重算匹配并高亮第一处。返回状态用于更新 UI 计数。 */
export function setFindQuery(view: EditorView, query: string): FindStatus {
  const tr = view.state.tr.setMeta(findPluginKey, { type: "setQuery", query } satisfies SetQueryMeta);
  view.dispatch(tr);
  // 同步到代码块内的高亮(CodeMirror 装饰),实现单一全局查询
  setCodeFindQuery(query);
  const s = getState(view);
  // 有匹配时把第一处滚动到可视区
  if (s.active >= 0) scrollToActive(view);
  return status(s);
}

/** 跳到下一处(dir=1)/上一处(dir=-1),循环。返回更新后的状态。 */
export function gotoMatch(view: EditorView, dir: 1 | -1): FindStatus {
  const s = getState(view);
  if (s.matches.length === 0) return status(s);
  const n = s.matches.length;
  const next = (s.active + dir + n) % n;
  view.dispatch(
    view.state.tr.setMeta(findPluginKey, { type: "setActive", active: next } satisfies SetActiveMeta)
  );
  scrollToActive(view);
  return status(getState(view));
}

/** 替换当前项为 replacement,并把当前项定位到下一处。 */
export function replaceCurrent(view: EditorView, replacement: string): FindStatus {
  const s = getState(view);
  if (s.active < 0 || s.matches.length === 0) return status(s);
  const m = s.matches[s.active];
  const keepIndex = s.active;

  const tr = view.state.tr.insertText(replacement, m.from, m.to);
  view.dispatch(tr); // docChanged 会触发重算,active 收敛到 keepIndex 附近

  // 重算后仍停在同一序号(即“下一处”已自然前移到该位置);越界则归 0
  const after = getState(view);
  if (after.matches.length > 0) {
    const active = Math.min(keepIndex, after.matches.length - 1);
    view.dispatch(
      view.state.tr.setMeta(findPluginKey, { type: "setActive", active } satisfies SetActiveMeta)
    );
    scrollToActive(view);
  }
  return status(getState(view));
}

/** 全部替换:倒序替换以免位置漂移,合并到一个事务。 */
export function replaceAll(view: EditorView, replacement: string): number {
  const s = getState(view);
  if (s.matches.length === 0) return 0;
  const n = s.matches.length;
  const tr = view.state.tr;
  for (let i = n - 1; i >= 0; i--) {
    const m = s.matches[i];
    tr.insertText(replacement, m.from, m.to);
  }
  view.dispatch(tr);
  return n;
}

/** 清空查找高亮(关闭面板时调用)。 */
export function clearFind(view: EditorView): void {
  view.dispatch(view.state.tr.setMeta(findPluginKey, { type: "clear" } satisfies ClearMeta));
  setCodeFindQuery(""); // 一并清除代码块内的高亮
}
