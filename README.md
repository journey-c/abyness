# Abyness

> 所见即所得(WYSIWYG)Markdown 编辑器。

Abyness 是一个用 **Tauri 2 + Rust** 构建的桌面 Markdown 编辑器,正文渲染基于
[Milkdown Crepe](https://milkdown.dev/)(ProseMirror 内核),主题严格对齐,力求所见即所得的编辑体验。界面语言为中文。

---

## ✨ 功能

- **所见即所得编辑**:标题、加粗/斜体/删除线、行内代码、引用、有序/无序列表、
  代码块、表格、图片、超链接、水平分割线。
- **右键菜单**:替代 Crepe 默认的悬浮块手柄与选区工具栏,提供
  剪切/拷贝/粘贴 + 段落▸ / 格式▸ / 插入▸ 三组子菜单。
- **文件树**:打开文件夹后递归展示目录与 `.md`/`.markdown` 文件,支持
  新建/重命名/删除/在访达中显示。
- **大纲**:侧栏大纲视图 + 顶栏悬浮大纲窗,点击标题快速跳转。
- **全文搜索**:按文件名与内容搜索,支持 区分大小写 / 整词 / 正则。
- **外部改动监视**:文件被别的程序改动时提示「重新加载」。
- **原生菜单 + 最近打开**:打开文件夹、保存、新建、切换侧栏、最近打开历史。
- **词数统计**:中文按字符、英文按分词,贴近 Typora 口径。

---

## 🧱 技术栈

| 层 | 技术 |
| --- | --- |
| 桌面外壳 | [Tauri 2](https://tauri.app/)(Rust) |
| WebView | 系统内置(macOS WKWebView / Windows WebView2) |
| 编辑器内核 | [@milkdown/crepe](https://milkdown.dev/) + @milkdown/kit(ProseMirror) |
| 代码块 | CodeMirror 6 |
| 前端构建 | Vite 6 + TypeScript 5(strict) |
| 包管理 | pnpm |

---

## 📁 目录结构

```
abyness/
├── index.html            # 应用外壳(顶栏 / 侧栏 / 编辑区 / 重载条)
├── src/                  # 前端(TypeScript,无框架)
│   ├── main.ts           # 组装:实例化各组件、接线原生菜单与快捷键
│   ├── backend.ts        # 对 Rust command 的类型化封装(invoke)
│   ├── editor.ts         # Crepe 编辑器封装(加载/取 Markdown/执行命令)
│   ├── contextmenu.ts    # 正文右键菜单(含子菜单交互)
│   ├── tabletoolbar.ts   # 表格编辑工具条
│   ├── filetree.ts       # 文件树视图 + 右键菜单
│   ├── sidebar.ts        # 侧栏:文件树 / 大纲 / 搜索 三视图
│   ├── tocpopup.ts       # 顶栏大纲悬浮窗
│   ├── filewatcher.ts    # 外部改动监视器(Observer,轮询 mtime)
│   ├── toc.ts            # 标题提取 / 词数统计 / 大纲 DOM 构建(共用)
│   └── styles/           # app.css / github.css / typora-tune.css
└── src-tauri/            # 后端(Rust)
    └── src/
        ├── lib.rs        # 应用入口:注册插件与 command
        ├── main.rs       # 二进制入口
        ├── commands.rs   # 文件操作 command(读写/增删改/列目录/mtime/reveal/recents)
        ├── search.rs     # 全文搜索(Matcher:子串/整词/正则)
        ├── menu.rs       # 原生菜单(含「打开最近」子菜单)
        └── recent.rs     # 「最近打开」持久化
```

### 架构要点

- **前后端契约集中在 `backend.ts`**:所有 `invoke` 封装在此,与 Rust 的
  `#[tauri::command]` 一一对应,是唯一的跨进程边界。
- **组件化**:侧栏、右键菜单、表格工具条、大纲悬浮窗、文件监视器各自成类,
  `main.ts` 只负责组装与状态(当前文件、根目录、脏标记)。
- **共用 `toc.ts`**:侧栏大纲与悬浮大纲共用 `buildOutline`,避免重复渲染逻辑。
- **Observer 模式**:`FileWatcher` 轮询磁盘 mtime + 窗口聚焦复查,发现外部改动回调宿主。

---

## 🚀 开发

前置:[Node.js](https://nodejs.org/) + [pnpm](https://pnpm.io/) +
[Rust 工具链](https://www.rust-lang.org/tools/install)(以及 Tauri 各平台的系统依赖,
见 [Tauri 前置要求](https://tauri.app/start/prerequisites/))。

```bash
# 安装依赖
pnpm install

# 启动开发(热更新;首次会编译 Rust,稍慢)
pnpm tauri dev
```

### 常用脚本

```bash
pnpm dev              # 仅前端 Vite 开发服务器
pnpm build            # 前端类型检查 + 打包(dist/)
pnpm exec tsc --noEmit  # 仅做 TypeScript 类型检查
pnpm tauri dev        # 桌面应用开发模式
pnpm tauri build      # 打包当前平台安装包
```

---

## 📦 打包

### macOS

```bash
pnpm tauri build
```

产物在 `src-tauri/target/release/bundle/`(`.app` 与 `.dmg`)。

### Windows

Tauri **不支持从 macOS 官方交叉编译** Windows 包。推荐两种方式:

1. **在 Windows 机器上**安装 Rust + Node + pnpm + WebView2,然后运行
   `pnpm tauri build`,产物为 `src-tauri/target/release/bundle/` 下的
   `.msi`(WiX)与 `.exe`(NSIS)。
2. **用 GitHub Actions**(推荐,免维护 Windows 环境):在
   `windows-latest` runner 上使用 [`tauri-apps/tauri-action`](https://github.com/tauri-apps/tauri-action):

   ```yaml
   jobs:
     build-windows:
       runs-on: windows-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: 20 }
         - run: corepack enable
         - uses: dtolnay/rust-toolchain@stable
         - run: pnpm install
         - uses: tauri-apps/tauri-action@v0
   ```

---

## 📝 许可

私有项目,暂未开源许可。
