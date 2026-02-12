/**
 * Popup 控制脚本
 * 管理用户界面交互和配置存储
 */

document.addEventListener('DOMContentLoaded', async () => {
  // ===== DOM 元素 =====
  const elements = {
    intervalValue: document.getElementById('intervalValue'),
    intervalUnit: document.getElementById('intervalUnit'),
    keywords: document.getElementById('keywords'),
    caseSensitive: document.getElementById('caseSensitive'),
    wholeWord: document.getElementById('wholeWord'),
    useRegex: document.getElementById('useRegex'),
    autoOpenTab: document.getElementById('autoOpenTab'),
    addToBookmarks: document.getElementById('addToBookmarks'),
    startBtn: document.getElementById('startBtn'),
    stopBtn: document.getElementById('stopBtn'),
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    matchLog: document.getElementById('matchLog'),
    clearLog: document.getElementById('clearLog'),
    clearCacheBtn: document.getElementById('clearCacheBtn'),
    visitedCount: document.getElementById('visitedCount'),
    clickBehavior: document.querySelectorAll('input[name="clickBehavior"]'),
  };

  // ===== 加载配置 =====
  const config = await chrome.storage.local.get({
    intervalValue: 30,
    intervalUnit: 'minutes',
    keywords: '',
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
    autoOpenTab: true,
    addToBookmarks: false,
    clickBehavior: 'first',
    isRunning: false,
    matchLog: [],
  });

  // 填充 UI
  elements.intervalValue.value = config.intervalValue;
  elements.intervalUnit.value = config.intervalUnit;
  elements.keywords.value = config.keywords;
  elements.caseSensitive.checked = config.caseSensitive;
  elements.wholeWord.checked = config.wholeWord;
  elements.useRegex.checked = config.useRegex;
  elements.autoOpenTab.checked = config.autoOpenTab;
  elements.addToBookmarks.checked = config.addToBookmarks;

  // 设置点击行为
  elements.clickBehavior.forEach(radio => {
    radio.checked = (radio.value === config.clickBehavior);
  });

  // 更新状态显示
  updateStatus(config.isRunning);
  renderLog(config.matchLog);
  updateVisitedCount();

  // ===== 事件绑定 =====

  // 开始监控
  elements.startBtn.addEventListener('click', async () => {
    const keywords = elements.keywords.value.trim();
    if (!keywords) {
      showToast('请输入至少一个关键词');
      elements.keywords.focus();
      return;
    }

    // 验证正则表达式
    if (elements.useRegex.checked) {
      const lines = keywords.split('\n').filter(l => l.trim());
      for (const line of lines) {
        try {
          new RegExp(line.trim());
        } catch (e) {
          showToast(`正则表达式无效: ${line.trim()}\n${e.message}`);
          return;
        }
      }
    }

    await saveConfig();
    await chrome.storage.local.set({ isRunning: true });

    // 通知 background 开始
    chrome.runtime.sendMessage({ action: 'start' });
    updateStatus(true);
  });

  // 停止监控
  elements.stopBtn.addEventListener('click', async () => {
    await chrome.storage.local.set({ isRunning: false });
    chrome.runtime.sendMessage({ action: 'stop' });
    updateStatus(false);
  });

  // 清除日志
  elements.clearLog.addEventListener('click', async () => {
    await chrome.storage.local.set({ matchLog: [] });
    renderLog([]);
  });

  // 清除缓存（已访问链接记录）
  elements.clearCacheBtn.addEventListener('click', async () => {
    chrome.runtime.sendMessage({ action: 'clearCache' }, () => {
      updateVisitedCount();
      showToast('已清除访问缓存，链接可重新触发');
    });
  });

  // 自动保存配置（配置变更时）
  const autoSaveElements = [
    elements.intervalValue, elements.intervalUnit,
    elements.keywords, elements.caseSensitive,
    elements.wholeWord, elements.useRegex,
    elements.autoOpenTab, elements.addToBookmarks,
  ];

  autoSaveElements.forEach(el => {
    el.addEventListener('change', saveConfig);
  });

  elements.clickBehavior.forEach(radio => {
    radio.addEventListener('change', saveConfig);
  });

  elements.keywords.addEventListener('input', debounce(saveConfig, 500));

  // 监听日志更新
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.matchLog) {
        renderLog(changes.matchLog.newValue || []);
      }
      if (changes.isRunning !== undefined) {
        updateStatus(changes.isRunning.newValue);
      }
      if (changes.visitedUrls) {
        updateVisitedCount();
      }
    }
  });

  // ===== 辅助函数 =====

  async function saveConfig() {
    const selectedBehavior = document.querySelector('input[name="clickBehavior"]:checked');
    await chrome.storage.local.set({
      intervalValue: parseInt(elements.intervalValue.value) || 30,
      intervalUnit: elements.intervalUnit.value,
      keywords: elements.keywords.value,
      caseSensitive: elements.caseSensitive.checked,
      wholeWord: elements.wholeWord.checked,
      useRegex: elements.useRegex.checked,
      autoOpenTab: elements.autoOpenTab.checked,
      addToBookmarks: elements.addToBookmarks.checked,
      clickBehavior: selectedBehavior ? selectedBehavior.value : 'first',
    });
  }

  async function updateVisitedCount() {
    chrome.runtime.sendMessage({ action: 'getVisitedCount' }, (response) => {
      if (response && response.count !== undefined) {
        elements.visitedCount.textContent = response.count;
      }
    });
  }

  function updateStatus(isRunning) {
    elements.statusDot.classList.toggle('active', isRunning);
    elements.statusText.textContent = isRunning ? '监控中...' : '已停止';
    elements.statusText.style.color = isRunning
      ? 'var(--success)'
      : 'var(--text-muted)';
    elements.startBtn.disabled = isRunning;
    elements.stopBtn.disabled = !isRunning;
  }

  function renderLog(logs) {
    if (!logs || logs.length === 0) {
      elements.matchLog.innerHTML = '<div class="log-empty">暂无匹配记录</div>';
      return;
    }

    // 只显示最近 50 条
    const recent = logs.slice(-50);
    elements.matchLog.innerHTML = recent.map(log => `
      <div class="log-item">
        <span class="log-time">${log.time}</span>
        <span class="log-text" title="${escapeHtml(log.text)}">
          <span class="log-keyword">[${escapeHtml(log.keyword)}]</span>
          ${escapeHtml(log.text)}
        </span>
      </div>
    `).join('');

    // 滚动到底部
    elements.matchLog.scrollTop = elements.matchLog.scrollHeight;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  function showToast(message) {
    // 简单的提示效果
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
      background: #333; color: #fff; padding: 8px 16px; border-radius: 6px;
      font-size: 12px; z-index: 9999; white-space: pre-wrap; text-align: center;
      max-width: 340px;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
});
