/**
 * Background Service Worker
 * 管理定时刷新、收藏夹操作和消息协调
 */

// ===== 定时器管理 =====
const ALARM_NAME = 'auto-refresh-alarm';
const KEEPALIVE_ALARM = 'auto-refresh-keepalive';

/**
 * 将配置的间隔转换为毫秒
 */
function getIntervalMs(value, unit) {
  const v = parseInt(value) || 30;
  switch (unit) {
    case 'seconds': return v * 1000;
    case 'minutes': return v * 60 * 1000;
    case 'hours':   return v * 60 * 1000 * 60;
    default:        return 30 * 60 * 1000;
  }
}

/**
 * 启动定时刷新
 */
async function startMonitoring() {
  const config = await chrome.storage.local.get({
    intervalValue: 30,
    intervalUnit: 'minutes',
  });

  const intervalMs = getIntervalMs(config.intervalValue, config.intervalUnit);
  const intervalMinutes = intervalMs / 60000;

  // 清除旧的定时器
  await chrome.alarms.clear(ALARM_NAME);
  await chrome.alarms.clear(KEEPALIVE_ALARM);

  if (intervalMinutes >= 0.5) {
    // 使用 Chrome Alarms API（>= 30秒）
    await chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: intervalMinutes,
      periodInMinutes: intervalMinutes,
    });
    console.log(`[Background] 定时器已启动，间隔: ${intervalMinutes} 分钟`);
  } else {
    // 对于小于 30 秒的间隔，使用 keepalive alarm 保活
    // Chrome 最小 alarm 间隔为 0.5 分钟，用它作为保活机制
    // 实际刻新间隔存储在 storage 中，通过 keepalive 触发
    await chrome.storage.local.set({ shortIntervalMs: intervalMs, lastRefreshTime: Date.now() });
    await chrome.alarms.create(KEEPALIVE_ALARM, {
      delayInMinutes: 0.5,
      periodInMinutes: 0.5,
    });
    console.log(`[Background] 短间隔定时器已启动，间隔: ${intervalMs} 毫秒（keepalive 30秒）`);
  }

  // 立即执行第一次刷新扫描
  await refreshAndScan();
}

/**
 * 停止监控
 */
async function stopMonitoring() {
  await chrome.alarms.clear(ALARM_NAME);
  await chrome.alarms.clear(KEEPALIVE_ALARM);
  await chrome.storage.local.remove(['shortIntervalMs', 'lastRefreshTime']);
  console.log('[Background] 监控已停止');
}

/**
 * 刷新当前标签页并触发扫描
 */
async function refreshAndScan() {
  try {
    const config = await chrome.storage.local.get({ isRunning: false });
    if (!config.isRunning) return;

    // 获取当前激活的标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      console.log('[Background] 当前标签页不可操作，跳过');
      return;
    }

    console.log(`[Background] 刷新标签页: ${tab.url}`);
    await chrome.tabs.reload(tab.id);

    // content script 会在页面加载后自动扫描（document_idle）
  } catch (error) {
    console.error('[Background] 刷新出错:', error);
  }
}

// ===== 收藏夹管理 =====

/**
 * 获取「书签栏」文件夹 ID（更可靠）
 */
async function getBookmarkBarId() {
  try {
    const tree = await chrome.bookmarks.getTree();
    const root = tree[0];
    // children[0] 是书签栏，children[1] 是其他书签
    if (root.children && root.children.length >= 1) {
      return root.children[0].id;
    }
  } catch (e) {
    console.error('[Background] 获取书签树失败:', e);
  }
  return '1'; // 回退：书签栏默认 ID
}

/**
 * 获取或创建收藏夹文件夹
 */
async function getOrCreateBookmarkFolder(folderName) {
  console.log(`[Background] 查找收藏夹文件夹: "${folderName}"`);

  // 先搜索是否已存在
  const results = await chrome.bookmarks.search({ title: folderName });
  console.log(`[Background] 搜索结果:`, JSON.stringify(results));
  const folder = results.find(b => !b.url); // 文件夹没有 url 属性

  if (folder) {
    console.log(`[Background] 找到现有文件夹: id=${folder.id}`);
    return folder;
  }

  // 在「书签栏」下创建文件夹
  const parentId = await getBookmarkBarId();
  console.log(`[Background] 将在 parentId=${parentId} 下创建文件夹`);

  const newFolder = await chrome.bookmarks.create({
    parentId: parentId,
    title: folderName,
  });

  console.log(`[Background] 创建收藏夹文件夹成功: id=${newFolder.id}, title="${folderName}"`);
  return newFolder;
}

/**
 * 添加链接到收藏夹
 */
async function addToBookmarks(keyword, url, title) {
  console.log(`[Background] 准备添加收藏: keyword="${keyword}", url="${url}"`);

  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    console.log(`[Background] 无效的 URL，跳过收藏: ${url}`);
    return;
  }

  // 检查是否已被收藏（全局去重）
  const existing = await chrome.bookmarks.search({ url: url });
  if (existing && existing.length > 0) {
    console.log(`[Background] 链接已在收藏夹中，跳过: ${url}`);
    return;
  }

  const folder = await getOrCreateBookmarkFolder(keyword);

  const bookmark = await chrome.bookmarks.create({
    parentId: folder.id,
    title: title || url,
    url: url,
  });

  console.log(`[Background] 已添加到收藏夹 [${keyword}]: ${url}, id=${bookmark.id}`);
}

// ===== 已访问链接管理 =====

/**
 * 记录已访问的 URL，防止重复打开
 */
async function addVisitedUrl(url) {
  const { visitedUrls = [] } = await chrome.storage.local.get({ visitedUrls: [] });
  if (!visitedUrls.includes(url)) {
    visitedUrls.push(url);
    await chrome.storage.local.set({ visitedUrls });
  }
}

/**
 * 检查 URL 是否已访问过
 */
async function isUrlVisited(url) {
  const { visitedUrls = [] } = await chrome.storage.local.get({ visitedUrls: [] });
  return visitedUrls.includes(url);
}

// ===== 日志管理 =====

/**
 * 记录匹配日志
 */
async function addMatchLog(keyword, text, url) {
  const { matchLog = [] } = await chrome.storage.local.get({ matchLog: [] });

  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  matchLog.push({
    time,
    keyword,
    text: text.substring(0, 100),
    url,
    timestamp: Date.now(),
  });

  // 只保留最近 200 条
  const trimmed = matchLog.slice(-200);

  await chrome.storage.local.set({ matchLog: trimmed });
}

// ===== 消息处理 =====

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.action) {
        case 'start':
          await startMonitoring();
          sendResponse({ status: 'started' });
          break;

        case 'stop':
          await stopMonitoring();
          sendResponse({ status: 'stopped' });
          break;

        case 'matched':
          // Content script 报告匹配结果（仅记录日志）
          for (const match of message.matches) {
            await addMatchLog(match.keyword, match.text, match.href);
          }
          sendResponse({ status: 'logged' });
          break;

        case 'openTab':
          console.log(`[Background] openTab 收到: url=${message.url}, addToBookmarks=${message.addToBookmarks}, keyword=${message.keyword}`);
          // 防止重复打开：检查是否已访问过
          if (await isUrlVisited(message.url)) {
            console.log(`[Background] 链接已打开过，跳过: ${message.url}`);
            sendResponse({ status: 'skipped' });
          } else {
            // 记录到已访问列表
            await addVisitedUrl(message.url);
            // 在新标签页中打开链接（不激活），当前页面不跳转
            await chrome.tabs.create({ url: message.url, active: false });
            console.log(`[Background] 已打开新标签页: ${message.url}`);

            // 同时添加到收藏夹（如果开启）
            if (message.addToBookmarks && message.keyword) {
              try {
                await addToBookmarks(message.keyword, message.url, message.text || message.url);
              } catch (e) {
                console.error('[Background] 添加收藏夹失败:', e);
              }
            }

            sendResponse({ status: 'opened' });
          }
          break;

        case 'addBookmarkOnly':
          // 仅添加到收藏夹，不打开链接
          console.log(`[Background] addBookmarkOnly: url=${message.url}, keyword=${message.keyword}`);
          if (message.keyword) {
            try {
              await addToBookmarks(message.keyword, message.url, message.text || message.url);
            } catch (e) {
              console.error('[Background] 添加收藏夹失败:', e);
            }
          }
          // 记录到已访问列表，防止重复处理
          await addVisitedUrl(message.url);
          sendResponse({ status: 'bookmarked' });
          break;

        case 'clearCache':
          // 清除已访问链接缓存，恢复原始模式
          await chrome.storage.local.set({ visitedUrls: [] });
          console.log('[Background] 已清除访问缓存');
          sendResponse({ status: 'cleared' });
          break;

        case 'getVisitedCount':
          const { visitedUrls: urls = [] } = await chrome.storage.local.get({ visitedUrls: [] });
          sendResponse({ count: urls.length });
          break;

        default:
          sendResponse({ status: 'unknown' });
      }
    } catch (error) {
      console.error('[Background] 消息处理出错:', error);
      sendResponse({ status: 'error', message: error.message });
    }
  })();

  return true; // 保持消息通道
});

// ===== Alarm 事件 =====

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const config = await chrome.storage.local.get({ isRunning: false });
  if (!config.isRunning) {
    // 监控已停止，清除残留 alarm
    await chrome.alarms.clear(alarm.name);
    return;
  }

  if (alarm.name === ALARM_NAME) {
    console.log('[Background] 定时器触发刷新');
    await refreshAndScan();
  } else if (alarm.name === KEEPALIVE_ALARM) {
    // 短间隔模式：检查是否到达刷新时间
    const { shortIntervalMs = 30000, lastRefreshTime = 0 } = await chrome.storage.local.get({
      shortIntervalMs: 30000,
      lastRefreshTime: 0,
    });
    const elapsed = Date.now() - lastRefreshTime;
    if (elapsed >= shortIntervalMs) {
      console.log(`[Background] keepalive 触发刷新（已过 ${elapsed}ms）`);
      await chrome.storage.local.set({ lastRefreshTime: Date.now() });
      await refreshAndScan();
    }
  }
});

// ===== 安装/启动事件 =====

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background] 插件已安装');
  chrome.storage.local.get({ isRunning: false }, (config) => {
    if (!config.isRunning) {
      chrome.storage.local.set({ isRunning: false });
    }
  });
});

// ===== Service Worker 启动时恢复状态 =====
// 每次 Service Worker 被唤醒时都会执行顶层代码
// 检查是否有正在运行的监控任务，如果有则确保 alarm 存在
(async () => {
  try {
    const config = await chrome.storage.local.get({ isRunning: false });
    if (config.isRunning) {
      // 检查 alarm 是否存在
      const existingAlarm = await chrome.alarms.get(ALARM_NAME);
      const existingKeepalive = await chrome.alarms.get(KEEPALIVE_ALARM);
      if (!existingAlarm && !existingKeepalive) {
        console.log('[Background] Service Worker 重启，恢复监控定时器');
        await startMonitoring();
      } else {
        console.log('[Background] Service Worker 重启，定时器已存在，无需重建');
      }
    }
  } catch (e) {
    console.error('[Background] 恢复状态失败:', e);
  }
})();
