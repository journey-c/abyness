import { Crepe, CrepeFeature } from "@milkdown/crepe";
import { EditorView } from "@codemirror/view";
import { callCommand } from "@milkdown/kit/utils";
import { editorViewCtx } from "@milkdown/kit/core";
import type { CmdKey } from "@milkdown/kit/core";
import type { EditorView as ProseView } from "@milkdown/kit/prose/view";

// Crepe 主题(接近 GitHub/Typora 的浅色外观)与通用样式
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
// Typora 保真微调(必须在 Crepe 主题之后导入以覆盖)
import "./styles/typora-tune.css";
// GitHub 主题(严格规范值,最后导入以确保正文与 GitHub 一模一样)
import "./styles/github.css";

/**
 * 编辑器封装:单一所见即所得编辑面(Milkdown Crepe / ProseMirror)。
 * 负责:创建实例、加载/替换文档内容、监听变更、导出 markdown。
 */
export class Editor {
  private crepe: Crepe | null = null;
  private root: HTMLElement;
  private onChange: (markdown: string) => void;

  constructor(root: HTMLElement, onChange: (markdown: string) => void) {
    this.root = root;
    this.onChange = onChange;
  }

  /** 用给定 markdown 初始化(或重建)编辑器。切换文件时调用。 */
  async load(markdown: string): Promise<void> {
    // Crepe 不支持热替换整篇文档,切文件时销毁重建最稳妥
    if (this.crepe) {
      await this.crepe.destroy();
      this.crepe = null;
    }
    this.root.innerHTML = "";
    // 重建期间隐藏编辑区,避免闪出未渲染的原始 markdown 文字
    this.root.style.visibility = "hidden";

    const crepe = new Crepe({
      root: this.root,
      defaultValue: markdown,
      features: {
        // 去掉悬浮块手柄(+/拖拽)与选区浮动工具栏,改用自建右键菜单
        [CrepeFeature.BlockEdit]: false,
        [CrepeFeature.Toolbar]: false,
      },
      featureConfigs: {
        // 代码块长行自动换行(而非横向滚动截断),贴近 Typora
        [CrepeFeature.CodeMirror]: {
          extensions: [EditorView.lineWrapping],
        },
      },
    });

    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, md) => {
        this.onChange(md);
      });
    });

    await crepe.create();
    this.crepe = crepe;
    // 渲染完成,恢复显示
    this.root.style.visibility = "";
  }

  /** 导出当前文档的 markdown 源码。 */
  getMarkdown(): string {
    return this.crepe ? this.crepe.getMarkdown() : "";
  }

  /** 编辑区根元素,供右键菜单判断事件是否发生在正文内。 */
  getRoot(): HTMLElement {
    return this.root;
  }

  /** 让编辑区重新聚焦(执行命令前调用,保证命令作用于当前选区)。 */
  focus(): void {
    this.root.querySelector<HTMLElement>(".ProseMirror")?.focus();
  }

  /** 滚动到第 index 个标题(0-based,按文档顺序)。供大纲点击跳转。 */
  scrollToHeading(index: number): void {
    const pm = this.root.querySelector<HTMLElement>(".ProseMirror");
    if (!pm) return;
    const headings = pm.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6");
    const el = headings[index];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** 执行一条 Milkdown 命令(供右键菜单接线)。 */
  runCommand<T>(key: CmdKey<T>, payload?: T): void {
    this.crepe?.editor.action(callCommand(key, payload));
  }

  /** 取底层 ProseMirror EditorView(供表格工具条读取选区/几何)。 */
  getView(): ProseView | null {
    if (!this.crepe) return null;
    let view: ProseView | null = null;
    this.crepe.editor.action((ctx) => {
      view = ctx.get(editorViewCtx);
    });
    return view;
  }
}
