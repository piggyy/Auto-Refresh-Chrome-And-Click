# Auto Refresh & Click

<p align="center">
  <img src="icons/icon128.png" alt="Auto Refresh & Click" width="128">
</p>

<p align="center">
  A Chrome extension that auto-refreshes pages at set intervals, monitors link text on the page,<br>
  and automatically opens matching links in new tabs with optional bookmark integration.
</p>

<p align="center">
  <a href="https://github.com/piggyy/Auto-Refresh-Chrome-And-Click/blob/main/LICENSE"><img src="https://img.shields.io/github/license/piggyy/Auto-Refresh-Chrome-And-Click" alt="License"></a>
  <a href="https://github.com/piggyy/Auto-Refresh-Chrome-And-Click"><img src="https://img.shields.io/badge/Manifest-V3-blue" alt="Manifest V3"></a>
  <a href="https://github.com/piggyy/Auto-Refresh-Chrome-And-Click"><img src="https://img.shields.io/badge/i18n-17%20languages-green" alt="17 Languages"></a>
</p>

## ✨ Features

- **⏱ Auto Refresh** — Configurable intervals in seconds, minutes, or hours; refreshes immediately on start
- **🔍 Smart Text Matching** — Monitors all link text on the page with wildcards, regex, case-sensitive, and whole-word match (VS Code-style)
- **🖱 Auto Open** — Opens matching links in background tabs (won't navigate current page), with ~1s random delay between each to avoid lag
- **📑 Bookmark Integration** — Optionally adds matched links to bookmarks with keyword-named folders; deduplicates globally
- **🔗 Flexible Actions** — Open links and/or add to bookmarks independently; either, both, or neither
- **🚫 Duplicate Prevention** — Visited links won't reopen; clear cache to re-trigger
- **📋 Match Log** — Real-time log of all match and click events
- **🎨 Theme Support** — Automatically adapts to browser light/dark theme
- **🌐 17 Languages** — Auto-detects browser language with manual override

### 🌐 Supported Languages

English, 简体中文, 繁體中文, 日本語, 한국어, Français, Deutsch, Español, हिन्दी, العربية, Português (BR), Русский, Bahasa Indonesia, Tiếng Việt, Türkçe, Italiano, ภาษาไทย

### Match Modes (VS Code-style)

| Mode | Description | Example |
|------|-------------|---------|
| **Plain Text** | Direct text match | `flash sale` |
| **Wildcard `*`** | Match any characters | `flash*sale` matches "flash big sale" |
| **Wildcard `?`** | Match exactly one char | `new??item` matches "new01item" |
| **Regex** | Full regex support | `\d+%\s*off` |
| **Case Sensitive** | Case-sensitive match | `Sale` won't match "sale" |
| **Whole Word** | Full word boundary match | `new` won't match "renewal" |

### Stop Monitoring

- Click **⏹ Stop** button in the popup

## 📁 Project Structure

```
Auto-Refresh-Chrome-And-Click/
├── manifest.json              # Extension manifest (Manifest V3)
├── background/
│   └── background.js          # Service Worker - timers, bookmarks, visited URL management
├── content/
│   └── content.js             # Content script - page scanning, link matching
├── popup/
│   ├── popup.html             # Popup UI with language selector & GitHub link
│   ├── popup.css              # Popup styles (light/dark theme support)
│   ├── popup.js               # Popup logic & config persistence
│   └── i18n.js                # Internationalization - 17 language translations
├── icons/
│   ├── icon16.png             # 16x16 icon (RGB three-arrow)
│   ├── icon48.png             # 48x48 icon
│   └── icon128.png            # 128x128 icon
├── LICENSE
└── README.md
```

## 🚀 Installation

1. Clone or download this repository
   ```bash
   git clone https://github.com/piggyy/Auto-Refresh-Chrome-And-Click.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select this project folder

## 📖 Usage

1. Click the extension icon in the toolbar to open the settings popup
2. Set the **refresh interval** (e.g., 30 seconds, 5 minutes)
3. Enter **keywords** in the text box, one per line
4. Configure match options:
   - **Case Sensitive** (Aa) — exact case matching
   - **Whole Word** ([ab]) — match complete words only
   - **Regex** (.\*) — enable regex mode
5. Choose match actions:
   - **🔗 Auto open link** — open matched links in background tabs
   - **📑 Add to bookmarks** — save matched links to bookmark bar
6. Select click behavior (first match only / all matches)
7. Click **▶ Start** to begin monitoring
8. To reopen previously visited links, click **🗑 Clear Cache**
9. Switch language via the dropdown in the top-right corner

## ⚠ Notes

- Extension won't work on `chrome://` system pages
- Chrome Alarms API minimum interval is 30 seconds
- Matched links open in background tabs without navigating the current page
- Links open with ~1s random delay between each to prevent browser lag
- Visited links are automatically skipped; clear cache to re-trigger
- Bookmark folders are created under the Bookmarks Bar
- Duplicate bookmarks with the same URL won't be added
- Monitoring persists even after closing the popup; only the Stop button stops it
- After extension reload, old content scripts silently become inactive

## 📄 License

This project is licensed under the [MIT](LICENSE) License.
