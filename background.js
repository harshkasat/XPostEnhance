// background.js
chrome.runtime.onInstalled.addListener(() => {
    // Initialize default settings
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
      if (!result.geminiApiKey) {
        chrome.storage.sync.set({ geminiApiKey: '' });
        // Open options page for first-time users
        chrome.runtime.openOptionsPage();
      }
    });
  });
  
  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkApiKey") {
      chrome.storage.sync.get(['geminiApiKey'], (result) => {
        sendResponse({ hasApiKey: !!result.geminiApiKey });
      });
      return true; // Required for async response
    }
  });