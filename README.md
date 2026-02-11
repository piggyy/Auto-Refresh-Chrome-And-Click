# Auto Refresh & Click

<p align="center">
  <img src="icons/icon128.png" alt="Auto Refresh & Click" width="128">
</p>

<p align="center">
  一个 Chrome 浏览器扩展，按设定的时间间隔自动刷新页面，并监控页面中链接上的文字。<br>
  当发现匹配感兴趣关键词的链接时，自动在新标签页中打开该链接，并可选择将其加入收藏夹。
</p>

<p align="center">
  <a href="https://github.com/piggyy/Auto-Refresh-Chrome-And-Click/blob/main/LICENSE"><img src="https://img.shields.io/github/license/piggyy/Auto-Refresh-Chrome-And-Click" alt="License"></a>
  <a href="https://github.com/piggyy/Auto-Refresh-Chrome-And-Click"><img src="https://img.shields.io/badge/Manifest-V3-blue" alt="Manifest V3"></a>
</p>

## ✨ 功能特性

- **⏱ 定时自动刷新** — 支持秒/分钟/小时级别的刷新间隔
- **🔍 智能文字匹配** — 监控页面中所有链接的文字内容
- **🖱 自动打开** — 发现匹配关键词的链接自动在新标签页打开（不跳转当前页面），支持点击第一个或全部匹配
- **📑 收藏夹集成** — 可选将匹配的链接自动加入收藏夹，文件夹名为对应的关键词，已收藏的链接不会重复添加
- **🚫 防重复打开** — 已打开过的链接不会再次打开，可通过清除缓存按钮重置
- **📋 匹配日志** — 实时记录所有匹配和点击事件
- **🎨 主题跟随** — 自动适配浏览器亮色/暗色主题
- **🔗 GitHub 快捷入口** — 弹出面板右上角直达项目仓库

### 匹配模式（类似 VS Code 查找）

| 模式 | 说明 | 示例 |
|------|------|------|
| **普通文字** | 直接匹配文字 | `限时优惠` |
| **通配符 `*`** | 匹配任意多个字符 | `限时*优惠` 匹配 "限时特价优惠" |
| **通配符 `?`** | 匹配恰好一个字符 | `新品??上市` 匹配 "新品今日上市" |
| **正则表达式** | 完整正则支持 | `\d+%\s*off` |
| **区分大小写** | 大小写敏感匹配 | `Sale` 不匹配 "sale" |
| **全字匹配** | 仅匹配完整单词 | `new` 不匹配 "renewal" |

### 停止监控

支持以下三种方式停止监控：

- 点击弹出面板中的 **⏹ 停止监控** 按钮
- 在页面**空白处点击鼠标**
- 按下 **ESC** 键

## 📁 项目结构

```
Auto-Refresh-Chrome-And-Click/
├── manifest.json              # 扩展清单文件 (Manifest V3)
├── background/
│   └── background.js          # Service Worker - 定时器、收藏夹和已访问链接管理
├── content/
│   └── content.js             # 内容脚本 - 页面扫描、链接匹配和停止监控
├── popup/
│   ├── popup.html             # 弹出窗口界面（含 GitHub 图标链接）
│   ├── popup.css              # 弹出窗口样式（支持亮色/暗色主题）
│   └── popup.js               # 弹出窗口逻辑
├── icons/
│   ├── icon16.png             # 16x16 图标（RGB 三色箭头）
│   ├── icon48.png             # 48x48 图标
│   └── icon128.png            # 128x128 图标
├── LICENSE
└── README.md
```

## 🚀 安装方法

1. 下载或克隆本仓库
   ```bash
   git clone https://github.com/piggyy/Auto-Refresh-Chrome-And-Click.git
   ```
2. 打开 Chrome 浏览器，进入 `chrome://extensions/`
3. 开启右上角的 **开发者模式**
4. 点击 **加载已解压的扩展程序**
5. 选择本项目文件夹

## 📖 使用方法

1. 点击浏览器工具栏中的扩展图标打开设置面板
2. 设置 **刷新间隔**（如 30 秒、5 分钟等）
3. 在文本框中输入 **感兴趣的文字**，每行一个关键词
4. 根据需要勾选匹配选项：
   - **区分大小写** (Aa) — 精确匹配大小写
   - **全字匹配** ([ab]) — 仅匹配完整单词
   - **正则表达式** (.\*) — 启用正则表达式模式
5. 可选勾选 **📑 点击后加入收藏夹**（收藏夹文件夹名为匹配到的关键词）
6. 选择点击行为（仅点击第一个匹配 / 点击所有匹配）
7. 点击 **▶ 开始监控** 按钮
8. 如需重新打开已访问过的链接，点击 **🗑 清除缓存** 按钮

## ⚠ 注意事项

- 扩展不会在 `chrome://` 系统页面上工作
- Chrome Alarms API 最小间隔为 30 秒
- 匹配到的链接在新标签页（后台）打开，不影响当前页面
- 已打开过的链接会被自动跳过，清除缓存后可重新触发
- 收藏夹文件夹创建在「书签栏」下
- 已有相同 URL 的书签不会重复添加
- 在页面空白处点击或按 ESC 键可快速停止监控
- 扩展重载后旧页面的 content script 会自动静默失效，不会产生报错

## 📄 许可证

本项目基于 [MIT](LICENSE) 许可证开源。
