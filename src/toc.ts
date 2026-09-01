/** 从 markdown 源码提取标题,构建 TOC 大纲。 */

export interface Heading {
  level: number;
  text: string;
}

/**
 * 提取 ATX 标题(# 到 ######)。跳过围栏代码块内的 # 行,避免误识别。
 */
export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  let inFence = false;
  for (const line of markdown.split("\n")) {
    const fence = line.match(/^\s*(```|~~~)/);
    if (fence) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(#{1,6})\s+(.*\S)\s*$/);
    if (m) {
      headings.push({ level: m[1].length, text: m[2].trim() });
    }
  }
  return headings;
}

/**
 * 词数统计:中文按字符计,英文按空白分词。贴近 Typora「词」的口径。
 */
export function countWords(markdown: string): number {
  // 去掉围栏代码块与行内代码,避免把代码算进词数
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ");
  const cjk = (text.match(/[一-鿿぀-ヿ]/g) ?? []).length;
  const words = (text.match(/[A-Za-z0-9]+/g) ?? []).length;
  return cjk + words;
}

/**
 * 从一组标题构建大纲 DOM 列表(供侧栏大纲视图与顶栏悬浮窗共用,避免重复)。
 * - `onSelect(i)`:点击第 i 个标题(0-based)时回调。
 * - `emptyText`:无标题时的占位文案。
 * 层级缩进:一级 `basePad`,每深一级 +14px。
 */
export function buildOutline(
  headings: Heading[],
  onSelect: (index: number) => void,
  emptyText = "暂无标题",
  basePad = 12
): DocumentFragment {
  const frag = document.createDocumentFragment();
  if (headings.length === 0) {
    const empty = document.createElement("div");
    empty.className = "toc-empty";
    empty.textContent = emptyText;
    frag.appendChild(empty);
    return frag;
  }
  headings.forEach((h, i) => {
    const item = document.createElement("div");
    item.className = `toc-item toc-h${h.level}`;
    item.style.paddingLeft = `${basePad + (h.level - 1) * 14}px`;
    item.textContent = h.text;
    item.addEventListener("click", () => onSelect(i));
    frag.appendChild(item);
  });
  return frag;
}
