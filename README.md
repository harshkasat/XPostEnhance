# XPostEnhance: Enhance your Tweets with Gemini

**A Chrome extension that uses Google Gemini to improve your tweets before posting.**

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/harshkasat/XPostEnhance/workflows/Build/badge.svg)](https://github.com/harshkasat/XPostEnhance/actions)


## Project Overview

XPostEnhance is a Chrome extension designed to help you craft better tweets.  It leverages the power of Google Gemini's large language model to analyze and improve your text before you post it. The extension aims to make your tweets sound more natural and engaging, while maintaining a conversational tone.  It's particularly useful for those who want to refine their tweets for clarity and impact.

## Table of Contents

* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Configuration](#configuration)
* [Usage](#usage)
* [Contributing](#contributing)
* [License](#license)


## Prerequisites

* A Google Chrome browser.
* A Google Cloud Platform (GCP) account with access to the Gemini API.  You will need a Gemini API key.


## Installation

1. **Download:** Clone this repository or download the `.crx` file (if available).
2. **Install:** Open Chrome's extensions page (`chrome://extensions/`). Enable "Developer mode" in the top right corner.  Click "Load unpacked". Select the directory containing the extension's files.

## Configuration

1. **API Key:** After installation, the extension will prompt you to enter your Gemini API key.  You can access and manage your API key through your GCP console.  The key is stored securely in your Chrome browser's sync storage.

   The extension uses `chrome.storage.sync` to store the API key:

   ```javascript
   // background.js
   chrome.runtime.onInstalled.addListener(() => {
       chrome.storage.sync.get(['geminiApiKey'], (result) => {
           if (!result.geminiApiKey) {
               chrome.storage.sync.set({ geminiApiKey: '' });
               chrome.runtime.openOptionsPage(); // Open options page for first-time users
           }
       });
   });
   ```

## Usage

1. **Compose a Tweet:** Start composing a tweet on Twitter.
2. **Suggestion Button:** A small button will appear near your tweet's text area.  This button activates the extension.
3. **Analyze and Improve:** Click the button. The extension will send your tweet text to the Gemini API for analysis and improvement.  A popup will display the improved text.
4. **Apply Changes:** Click "Apply Suggestion" in the popup to replace your original tweet text with the improved version.  The extension handles different Twitter input types (DraftJS and standard text areas).  If application fails, the improved text will be copied to your clipboard.

   The core logic for improving text is in `content.js`:

   ```javascript
   async function improveText(text) {
       try {
           const prompt = `Generate a Twitter post... ${text}`; // ... (prompt construction)
           const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/...`, { ... }); // API call
           // ... (process response and update UI)
       } catch (error) {
           // ... (handle errors)
       }
   }
   ```

   The `applyTextSafely` function in `content.js` carefully handles applying the improved text to the Twitter input field, considering different input types.


## Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for details.


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
