# XPostEnhance: Enhance your Tweets with Gemini

**A Chrome extension that uses Google Gemini to improve your tweets before posting.**

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/harshkasat/XPostEnhance/workflows/Build/badge.svg)](https://github.com/harshkasat/XPostEnhance/actions)


## Project Overview

XPostEnhance is a Chrome extension designed to help you craft better tweets.  It leverages the power of Google Gemini's large language model to analyze and improve your text before you post it. The extension aims to make your tweets sound more natural and engaging, while maintaining a conversational tone.  It's particularly useful for those who want to refine their tweets for clarity and impact.

## Demo

Watch our product demo to see XPostEnhance in action:

[https://github.com/harshkasat/XPostEnhance/blob/main/assets/product-demo.mkv](https://github.com/user-attachments/assets/732a78c6-7c7c-40a2-a0f8-39be8ce45911)

## Table of Contents

* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Usage](#usage)
* [Demo](#demo)
* [License](#license)


## Prerequisites

* A Google Chrome browser.
* A Google Cloud Platform (GCP) account with access to the Gemini API.  You will need a Gemini API key.


## Installation

1. **Download:** Clone this repository or download the `.zip` file.
2. **Install:** Open Chrome's extensions page (`chrome://extensions/`). Enable "Developer mode" in the top right corner.  Click "Load unpacked". Select the directory containing the extension's files.


## Usage

1. **Compose a Tweet:** Start composing a tweet on Twitter.
2. **Suggestion Button:** A small button will appear near your tweet's text area.  This button activates the extension.
3. **Analyze and Improve:** Click the button. The extension will send your tweet text to the Gemini API for analysis and improvement.  A popup will display the improved text.
4. **Apply Changes:** Click "Apply Suggestion" in the popup to replace your original tweet text with the improved version.  The extension handles different Twitter input types (DraftJS and standard text areas).  If application fails, the improved text will be copied to your clipboard.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
