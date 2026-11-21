document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  loadScreenshots();
  loadSettings();
  initEventListeners();
});
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`${tabName}-вкладка`).classList.add('active');
    });
  });
}
function loadScreenshots() {
  chrome.storage.local.get(['screenshotHistory'], (result) => {
    const history = result.screenshotHistory || [];
    displayScreenshots(history);
    updateStats(history);
  });
}
function displayScreenshots(screenshots) {
  const list = document.getElementById('screenshots-list');
  const emptyState = document.getElementById('empty-state');
  if (screenshots.length === 0) {
    list.innerHTML = '';
    emptyState.classList.add('visible');
    return;
  }
  emptyState.classList.remove('visible');
  list.innerHTML = '';
  screenshots.forEach(screenshot => {
    const item = createScreenshotItem(screenshot);
    list.appendChild(item);
  });
}
function createScreenshotItem(screenshot) {
  const item = document.createElement('div');
  item.className = 'screenshot-item';
  const date = new Date(screenshot.timestamp);
  const formattedDate = formatDate(date);
  item.innerHTML = `
    <img src="${screenshot.dataUrl}" alt="Screenshot" class="screenshot-thumbnail">
    <div class="screenshot-info">
      <div class="screenshot-title">${screenshot.pageTitle || 'Без названия'}</div>
      <div class="screenshot-meta">🌐 ${screenshot.domain}</div>
      <div class="screenshot-date">📅 ${formattedDate}</div>
    </div>
    <div class="screenshot-actions">
      <button class="screenshot-action-btn open-btn" data-id="${screenshot.id}">
        Открыть
      </button>
      <button class="screenshot-action-btn download-btn" data-id="${screenshot.id}">
        Скачать
      </button>
      <button class="screenshot-action-btn delete" data-id="${screenshot.id}">
        Удалить
      </button>
    </div>
  `;
  item.querySelector('.open-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    openScreenshot(screenshot);
  });
  item.querySelector('.download-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    downloadScreenshot(screenshot);
  });
  item.querySelector('.delete').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteScreenshot(screenshot.id);
  });
  item.addEventListener('click', () => {
    openScreenshot(screenshot);
  });
  return item;
}
function formatDate(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Только что';
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} ч назад`;
  if (diffDays < 7) return `${diffDays} д назад`;
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}
function updateStats(screenshots) {
  const total = screenshots.length;
  const today = screenshots.filter(s => {
    const date = new Date(s.timestamp);
    const now = new Date();
    return date.toDateString() === now.toDateString();
  }).length;
  document.getElementById('total-screenshots').textContent = total;
  document.getElementById('today-screenshots').textContent = today;
}
function openScreenshot(screenshot) {
  chrome.tabs.create({ url: screenshot.dataUrl });
}
function downloadScreenshot(screenshot) {
  chrome.downloads.download({
    url: screenshot.dataUrl,
    filename: screenshot.filename,
    saveAs: true
  });
}
function deleteScreenshot(id) {
  if (!confirm('Удалить этот скриншот?')) return;
  chrome.storage.local.get(['screenshotHistory'], (result) => {
    let history = result.screenshotHistory || [];
    history = history.filter(s => s.id !== id);
    chrome.storage.local.set({ screenshotHistory: history }, () => {
      loadScreenshots();
    });
  });
}
function searchScreenshots(query) {
  chrome.storage.local.get(['screenshotHistory'], (result) => {
    const history = result.screenshotHistory || [];
    const filtered = history.filter(s => {
      const searchStr = `${s.pageTitle} ${s.domain} ${s.filename}`.toLowerCase();
      return searchStr.includes(query.toLowerCase());
    });
    displayScreenshots(filtered);
  });
}
function loadSettings() {
  chrome.storage.local.get(['settings'], (result) => {
    const settings = result.settings || getDefaultSettings();
    applySettings(settings);
  });
}
function getDefaultSettings() {
  return {
    defaultFormat: 'png',
    jpegQuality: 95,
    autoIncludeDrawings: true,
    saveAsDialog: false,
    defaultColor: '#ff0000',
    defaultWidth: 3,
    defaultFontSize: 16,
    autoSaveDrawings: true
  };
}
function applySettings(settings) {
  document.getElementById('default-format').value = settings.defaultFormat;
  document.getElementById('jpeg-quality').value = settings.jpegQuality;
  document.getElementById('quality-value').textContent = `${settings.jpegQuality}%`;
  document.getElementById('auto-include-drawings').checked = settings.autoIncludeDrawings;
  document.getElementById('save-as-dialog').checked = settings.saveAsDialog;
  document.getElementById('default-color').value = settings.defaultColor;
  document.getElementById('default-width').value = settings.defaultWidth;
  document.getElementById('width-value').textContent = `${settings.defaultWidth} пикселей`;
  document.getElementById('default-font-size').value = settings.defaultFontSize;
  document.getElementById('font-size-value').textContent = `${settings.defaultFontSize} пикселей`;
  document.getElementById('auto-save-drawings').checked = settings.autoSaveDrawings;
}
function saveSettings() {
  const settings = {
    defaultFormat: document.getElementById('default-format').value,
    jpegQuality: parseInt(document.getElementById('jpeg-quality').value),
    autoIncludeDrawings: document.getElementById('auto-include-drawings').checked,
    saveAsDialog: document.getElementById('save-as-dialog').checked,
    defaultColor: document.getElementById('default-color').value,
    defaultWidth: parseInt(document.getElementById('default-width').value),
    defaultFontSize: parseInt(document.getElementById('default-font-size').value),
    autoSaveDrawings: document.getElementById('auto-save-drawings').checked
  };
  chrome.storage.local.set({ settings });
}
function initEventListeners() {
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', (e) => {
    searchScreenshots(e.target.value);
  });
  document.getElementById('clear-search').addEventListener('click', () => {
    searchInput.value = '';
    loadScreenshots();
  });
  document.getElementById('new-screenshot-btn').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleOverlay' });
      window.close();
    });
  });
  document.getElementById('clear-history-btn').addEventListener('click', () => {
    if (confirm('Удалить всю историю скриншотов? Это действие нельзя отменить.')) {
      chrome.storage.local.set({ screenshotHistory: [] }, () => {
        loadScreenshots();
      });
    }
  });
  const settingsInputs = document.querySelectorAll('#settings-tab ввод, #settings-tab выбор');
  settingsInputs.forEach(input => {
    input.addEventListener('change', saveSettings);
  });
  document.getElementById('jpeg-quality').addEventListener('input', (e) => {
    document.getElementById('quality-value').textContent = `${e.target.value}%`;
  });
  document.getElementById('default-width').addEventListener('input', (e) => {
    document.getElementById('width-value').textContent = `${e.target.value} пикселей`;
  });
  document.getElementById('default-font-size').addEventListener('input', (e) => {
    document.getElementById('font-size-value').textContent = `${e.target.value} пикселей`;
  });
  document.getElementById('reset-settings-btn').addEventListener('click', () => {
    if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
      const defaultSettings = getDefaultSettings();
      chrome.storage.local.set({ settings: defaultSettings }, () => {
        applySettings(defaultSettings);
      });
    }
  });
}
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.screenshotHistory) {
    loadScreenshots();
  }
});