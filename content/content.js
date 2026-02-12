/**
 * Content Script - 页面内容监控与链接点击
 * 注入到每个页面中，负责扫描链接文字并执行点击操作
 */

(function () {
  'use strict';

  // 防止重复注入
  if (window.__autoRefreshClickInjected) return;
  window.__autoRefreshClickInjected = true;

  /**
   * 将通配符模式转换为正则表达式
   * * 匹配任意多个字符（包括零个）
   * ? 匹配恰好一个字符
   */
  function wildcardToRegex(pattern) {
    // 先转义正则特殊字符，再将 \* 和 \? 转回通配符含义
    let escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    escaped = escaped.replace(/\\\*/g, '.*');  // * -> .*
    escaped = escaped.replace(/\\\?/g, '.');   // ? -> .
    return escaped;
  }

  /**
   * 根据配置构建匹配用的正则表达式
   * 类似 VS Code 的查找功能：
   *   - 普通模式：支持通配符 * 和 ?
   *   - 正则模式：直接使用用户输入的正则
   *   - 大小写敏感：可选
   *   - 全字匹配：可选（在两端加 \b）
   */
  function buildMatcher(keyword, config) {
    let pattern;

    if (config.useRegex) {
      // 正则模式：直接使用用户输入
      pattern = keyword;
    } else {
      // 普通模式：将通配符转换为正则
      pattern = wildcardToRegex(keyword);
    }

    // 全字匹配：添加单词边界
    if (config.wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }

    // 构建标志
    const flags = config.caseSensitive ? 'g' : 'gi';

    try {
      return new RegExp(pattern, flags);
    } catch (e) {
      console.warn('[Auto Refresh & Click] 无效的匹配模式:', keyword, e.message);
      return null;
    }
  }

  /**
   * 扫描页面中所有链接，查找匹配的文字
   * 会先从 storage 加载已访问列表，过滤掉已打开过的链接
   */
  async function scanAndClick(config) {
    const keywords = config.keywords
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keywords.length === 0) return;

    // 加载已访问链接列表
    const { visitedUrls = [] } = await chrome.storage.local.get({ visitedUrls: [] });
    const visitedSet = new Set(visitedUrls);

    const links = document.querySelectorAll('a[href]');
    const matched = [];

    for (const link of links) {
      const linkText = link.textContent.trim();
      if (!linkText) continue;

      // 跳过已访问过的链接
      if (visitedSet.has(link.href)) {
        continue;
      }

      for (const keyword of keywords) {
        const regex = buildMatcher(keyword, config);
        if (!regex) continue;

        if (regex.test(linkText)) {
          matched.push({
            element: link,
            text: linkText,
            href: link.href,
            keyword: keyword,
          });

          // 如果只点击第一个匹配，找到即可退出
          if (config.clickBehavior === 'first') break;
        }
      }

      // 如果只点击第一个匹配且已找到
      if (config.clickBehavior === 'first' && matched.length > 0) break;
    }

    if (matched.length === 0) {
      console.log('[Auto Refresh & Click] 未找到新的匹配链接（已访问的已过滤）');
      return;
    }

    console.log(`[Auto Refresh & Click] 找到 ${matched.length} 个新匹配链接`);

    // 发送匹配结果到 background
    const matchResults = matched.map(m => ({
      text: m.text.substring(0, 100),
      href: m.href,
      keyword: m.keyword,
      title: document.title,
    }));

    chrome.runtime.sendMessage({
      action: 'matched',
      matches: matchResults,
      addToBookmarks: config.addToBookmarks,
    });

    // 根据配置决定打开链接和/或加入收藏夹
    // 每个链接间隔约 1 秒（800~1200ms 随机延时），避免同时打开大量链接导致卡顿
    let cumulativeDelay = 0;
    matchResults.forEach((m) => {
      const randomDelay = 800 + Math.floor(Math.random() * 400); // 800~1200ms
      cumulativeDelay += randomDelay;
      setTimeout(() => {
        if (config.autoOpenTab) {
          console.log(`[Auto Refresh & Click] 新标签页打开: "${m.text}" -> ${m.href}`);
          chrome.runtime.sendMessage({
            action: 'openTab',
            url: m.href,
            keyword: m.keyword,
            text: m.text,
            addToBookmarks: config.addToBookmarks,
          });
        } else if (config.addToBookmarks) {
          console.log(`[Auto Refresh & Click] 仅收藏: "${m.text}" -> ${m.href}`);
          chrome.runtime.sendMessage({
            action: 'addBookmarkOnly',
            url: m.href,
            keyword: m.keyword,
            text: m.text,
          });
        }
      }, cumulativeDelay);
    });
  }

  /**
   * 监听来自 background 的消息
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'scan') {
      console.log('[Auto Refresh & Click] 收到扫描指令');
      scanAndClick(message.config);
      sendResponse({ status: 'scanned' });
    }
    return true;
  });

  // 页面加载完成后，检查是否需要立即扫描
  try {
    chrome.storage.local.get({
      isRunning: false,
      keywords: '',
      caseSensitive: false,
      wholeWord: false,
      useRegex: false,
      autoOpenTab: true,
      addToBookmarks: false,
      clickBehavior: 'first',
    }, (config) => {
      if (chrome.runtime.lastError) return;
      if (config.isRunning && config.keywords.trim()) {
        // 延迟 1 秒扫描，确保页面完全加载
        setTimeout(async () => {
          console.log('[Auto Refresh & Click] 页面加载完成，开始扫描...');
          await scanAndClick(config);
        }, 1000);
      }
    });
  } catch (e) {
    // 扩展上下文已失效，忽略
  }
})();
