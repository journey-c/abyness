import { defineConfig } from "vite";

// Tauri 期望前端在固定端口上运行
export default defineConfig({
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 不监听 Rust 后端目录
      ignored: ["**/src-tauri/**"],
    },
  },
  // 生产构建输出
  build: {
    target: "es2021",
    minify: "esbuild",
    sourcemap: false,
  },
});
