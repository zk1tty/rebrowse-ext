// content.js
import JS_TEMPLATE from './js_template.js'; // webpack / vite asset

// 1. Inject JS_TEMPLATE as <script> so it runs inside the page
const s = document.createElement('script');
s.textContent = JS_TEMPLATE;
(document.head || document.documentElement).appendChild(s);
s.remove();

// 2. Listen for synthetic events posted from JS_TEMPLATE → window
window.addEventListener('__REBROWSE_EVENT__', e => {
  chrome.runtime.sendMessage({ type: 'ui', data: e.detail });
}); 