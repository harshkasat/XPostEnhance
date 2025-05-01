// popup.js
document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKey');
    const saveButton = document.getElementById('saveButton');
    const statusDiv = document.getElementById('status');
    
    // Load saved API key
    chrome.storage.sync.get(['geminiApiKey'], function(result) {
      if (result.geminiApiKey) {
        apiKeyInput.value = result.geminiApiKey;
      }
    });
    
    // Save API key
    saveButton.addEventListener('click', function() {
      const apiKey = apiKeyInput.value.trim();
      
      if (!apiKey) {
        showStatus('Please enter a valid API key', 'error');
        return;
      }
      
      chrome.storage.sync.set({ geminiApiKey: apiKey }, function() {
        showStatus('API key saved successfully!', 'success');
      });
    });
    
    function showStatus(message, type) {
      statusDiv.textContent = message;
      statusDiv.className = 'status ' + type;
      statusDiv.style.display = 'block';
      
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
  });