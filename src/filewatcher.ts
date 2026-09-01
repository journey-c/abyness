import { fileMtime } from "./backend";

/** 检测到当前文件被外部程序改动时的回调。 */
export type OnExternalChange = () => void;

/**
 * 文件外部改动监视器(Observer 模式)。
 * 定时轮询当前文件的磁盘 mtime,并在窗口重新获得焦点时立即复查;
 * 一旦发现磁盘 mtime 与已知值不同(且未被用户忽略),触发 `onChange`。
 *
 * 状态全部内聚在此:调用方只需 watch(打开/保存后)、dismiss(用户点忽略)、
 * clear(新建/关闭文件),不再直接摆弄 mtime 变量。
 */
export class FileWatcher {
  private path: string | null = null;
  /** 打开/保存时记录的磁盘 mtime,作为「已知」基准。 */
  private knownMtime: number | null = null;
  /** 用户点「忽略」时记住的 mtime,避免同一改动反复提示。 */
  private dismissedMtime: number | null = null;
  private onChange: OnExternalChange;

  /** @param intervalMs 轮询间隔(毫秒),默认 2 秒。 */
  constructor(onChange: OnExternalChange, intervalMs = 2000) {
    this.onChange = onChange;
    // 监视器与应用同生命周期,无需保留 interval 句柄
    window.setInterval(() => void this.check(), intervalMs);
    // 切到别的编辑器改完再切回来:聚焦即复查一次
    window.addEventListener("focus", () => void this.check());
  }

  /** 开始监视某文件,并把当前磁盘 mtime 作为基准(打开/重新加载后调用)。 */
  async watch(path: string): Promise<void> {
    this.path = path;
    this.knownMtime = await FileWatcher.safeMtime(path);
    this.dismissedMtime = null;
  }

  /** 刷新已知基准 mtime(自己写盘保存后调用,避免把自己的写入误报为外部改动)。 */
  async sync(): Promise<void> {
    if (this.path) this.knownMtime = await FileWatcher.safeMtime(this.path);
  }

  /** 停止监视(新建空白文档 / 关闭文件时调用)。 */
  clear(): void {
    this.path = null;
    this.knownMtime = null;
    this.dismissedMtime = null;
  }

  /** 用户选择「忽略」本次外部改动:记住当前磁盘 mtime,不再重复提示。 */
  async dismiss(): Promise<void> {
    if (this.path) this.dismissedMtime = await FileWatcher.safeMtime(this.path);
  }

  private async check(): Promise<void> {
    if (!this.path || this.knownMtime === null) return;
    const mtime = await FileWatcher.safeMtime(this.path);
    if (mtime === null) return;
    if (mtime !== this.knownMtime && mtime !== this.dismissedMtime) {
      this.onChange();
    }
  }

  /** 读取 mtime,失败(文件被删/权限等)时返回 null 而非抛错。 */
  private static async safeMtime(path: string): Promise<number | null> {
    try {
      return await fileMtime(path);
    } catch {
      return null;
    }
  }
}
