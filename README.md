# 浮事 FloatThings

轻量灵动的 Windows 桌面待办事项应用，浮于所有窗口之上，随时记录与追踪。

<img width="347" height="522" alt="image" src="https://github.com/user-attachments/assets/0a55194a-393c-4aeb-9a89-f2fa8e15379e" />

## 特性

### 悬浮胶囊
应用启动后默认以小胶囊形态悬浮在桌面上，点击展开为完整面板，双击空白区域折叠为胶囊。胶囊是一个精致的玻璃球体设计，带有呼吸辉光、镜面高光和棱镜边缘，展示当前待办数量。支持拖拽移动，切换到任意桌面角落。

<img width="80" height="76" alt="image" src="https://github.com/user-attachments/assets/5d87ef38-7e4c-418c-996d-1fcbfef00358" />


### 玻璃拟态面板
展开后的面板采用毛玻璃 + 焦散光效设计，亮色/暗色双主题一键切换。面板圆角裁剪、棱镜边框、多层反射，视觉上像一块悬浮的玻璃板。面板支持拖拽移动，双击空白区域收拢为胶囊。

### 三级紧急度
每条待办支持三种紧急程度，点击左侧灯泡循环切换：
- **蓝色** — 不紧急，轻松处理
- **黄色** — 中等优先级
- **红色** — 紧急优先

待办列表自动按紧急度排序（红 > 黄 > 蓝），重要事项始终在顶部。

### 滑动手势
在待办卡片上右滑标记完成，左滑删除。滑动带有弹性动画反馈，手感流畅自然。

<img width="347" height="522" alt="image" src="https://github.com/user-attachments/assets/095d5068-14b7-4188-bc51-9527883e2f59" />
<img width="347" height="522" alt="image" src="https://github.com/user-attachments/assets/a4656ce8-d36f-4859-9c0f-4f6a8d3e592e" />

### 废纸篓
删除的待办不会直接消失，而是进入废纸篓暂存。在废纸篓中可以恢复误删的待办，或彻底删除。废纸篓区域有独立的琥珀色视觉标识。

<img width="347" height="522" alt="image" src="https://github.com/user-attachments/assets/f2dc182e-8cae-4253-8d73-ad075d5e91a9" />

### 已完成归档
已完成的待办按日期分组展示，便于回顾每天完成的事项。完成状态下的卡片继承原紧急度颜色，保持视觉连贯。

<img width="347" height="522" alt="image" src="https://github.com/user-attachments/assets/c8c7f2e1-9f28-4043-8401-95db9b561ab8" />

### 系统托盘
应用在系统托盘中常驻，左键点击托盘图标可显示/隐藏窗口，右键菜单提供显示/隐藏和退出选项。关闭主窗口即可退出程序。

### 本地持久化
所有数据自动保存到本地 localStorage，无需登录或联网。主题偏好也会被记住，下次启动自动恢复。

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
| 打包 | NSIS (Windows 安装包) |

## 开发

```bash
# 安装依赖
npm install

# 开发模式（热更新）
npm run tauri dev

# 构建发布版本
npm run tauri build
```

构建产物：
- `src-tauri/target/release/floatthings.exe` — 可执行文件
- `src-tauri/target/release/bundle/nsis/浮事_*_x64-setup.exe` — Windows 安装包

## 快捷键

| 操作 | 方式 |
|---|---|
| 展开面板 | 点击胶囊 |
| 收拢胶囊 | 双击面板空白区域 |
| 添加待办 | 点击 + 按钮 |
| 切换紧急度 | 点击卡片左侧灯泡 |
| 右滑完成 | 在卡片上向右滑动 |
| 左滑删除 | 在卡片上向左滑动 |
| 切换主题 | 点击面板右上角太阳/月亮图标 |
| 拖拽移动 | 按住面板顶部或胶囊拖动 |
| 退出程序 | 关闭主窗口（任务栏关闭） |

## 许可

MIT License
