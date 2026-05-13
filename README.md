# 浮事 FloatThings

一个轻量灵动的 Windows 桌面待办事项应用，悬浮于所有窗口之上，随时记录与追踪。

## 特性

- **悬浮胶囊** — 收为小胶囊浮在桌面，点击展开完整面板
- **玻璃拟态面板** — 毛玻璃 + 焦散光效，亮色/暗色双主题
- **三级紧急度** — 🔵 不紧急 / 🟡 中等 / 🔴 紧急，点击灯泡切换
- **滑动手势** — 右滑完成、左滑删除，流畅的弹性动画
- **废纸篓** — 已删除待办可恢复或彻底删除
- **已完成归档** — 按日期分组展示
- **本地持久化** — 数据自动保存到 localStorage，无需登录

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Tauri v2 (Rust) |
| 前端 | React 19 + TypeScript |
| 构建 | Vite 6 |
| 动画 | GSAP + @gsap/react |
| 状态管理 | Zustand v5 |
| 样式 | Tailwind CSS 4 |
| 图标 | Lucide React |

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run tauri dev

# 构建发布
npm run tauri build
```

## 许可

MIT License