// background.js
const NATIVE_PORT = chrome.runtime.connectNative('com.rebrowse.host');

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Rebrowse] background ready');
});

chrome.tabs.onActivated.addListener(({ tabId }) => attachDebugger(tabId));

async function attachDebugger(tabId) {
  try {
    await chrome.debugger.attach({ tabId }, '1.3');
    console.log('[Rebrowse] Attached CDP to tab', tabId);

    chrome.debugger.onEvent.addListener((_, method, params) => {
      NATIVE_PORT.postMessage({ type: 'cdp', method, params, tabId });
    });
  } catch (e) {
    console.error('Debugger attach failed:', e);
  }
}

// Relay messages BACK from python → content script if you need DOM exec.
NATIVE_PORT.onMessage.addListener(msg => {
  if (msg.type === 'inject') {
    chrome.tabs.sendMessage(msg.tabId, msg.payload);
  }
}); 