chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!sender.tab || !sender.tab.id) {
    sendResponse({ success: false, error: 'Вкладка не найдена' });
    return true;
  }
  const tabId = sender.tab.id;
  if (request.action === 'captureVisible') {
    captureVisibleTab(request, tabId)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  return true;
});
async function captureVisibleTab(request, tabId) {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: request.format || 'png',
      quality: 95
    });
    await saveScreenshot(dataUrl, request.format || 'png', tabId);
    return { success: true, dataUrl: dataUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
async function saveScreenshot(dataUrl, format, tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const url = new URL(tab.url);
    const domain = url.hostname || 'screenshot';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `InkOverlay_${domain}_${timestamp}.${format}`;
    const downloadId = await chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: false
    });
    await saveToHistory(dataUrl, filename, tab.url, tab.title);
    return true;
  } catch (error) {
    throw error;
  }
}
async function saveToHistory(dataUrl, filename, pageUrl, pageTitle) {
  chrome.storage.local.get(['screenshotHistory'], (result) => {
    const history = result.screenshotHistory || [];
    history.unshift({
      id: Date.now(),
      dataUrl: dataUrl,
      filename: filename,
      pageUrl: pageUrl,
      pageTitle: pageTitle,
      timestamp: Date.now(),
      domain: new URL(pageUrl).hostname
    });
    if (history.length > 100) {
      history.pop();
    }
    chrome.storage.local.set({ screenshotHistory: history });
  });
}
try {
  chrome.runtime.onInstalled.addListener(() => {
    try {
      chrome.contextMenus.create({
        id: 'inkOverlay-activate',
        title: 'Активировать InkOverlay',
        contexts: ['page']
      });
      chrome.contextMenus.create({
        id: 'inkOverlay-screenshot',
        title: 'Сделать скриншот',
        contexts: ['page']
      });
    } catch (error) {
    }
  });
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'inkOverlay-activate') {
      chrome.tabs.sendMessage(tab.id, { action: 'toggleOverlay' });
    } else if (info.menuItemId === 'inkOverlay-screenshot') {
      captureVisibleTab({ format: 'png' }, tab.id);
    }
  });
} catch (error) {
}