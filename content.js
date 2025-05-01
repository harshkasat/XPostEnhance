// content.js
let apiKey = "";
let debounceTimer;
let currentEditingElement = null;
let suggestionButton = null;
let suggestionPopup = null;
let isAnalyzing = false;
let lastAnalyzedText = "";

// Initialize extension
function init() {
  chrome.storage.sync.get(["geminiApiKey"], (result) => {
    if (result.geminiApiKey) {
      apiKey = result.geminiApiKey;
      setupTweetObserver();
      createSuggestionElements();
    } else {
      console.log("API key not found. Please set it in the extension popup.");
    }
  });
}

// Create the suggestion button and popup elements
function createSuggestionElements() {
  // Create suggestion button (small icon that appears in text area)
  suggestionButton = document.createElement("div");
  suggestionButton.className = "twitter-improver-button";
  suggestionButton.innerHTML = `
    <div class="twitter-improver-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 
                10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" 
              fill="#1DA1F2"/>
      </svg>
    </div>
  `;
  suggestionButton.style.display = "none";
  document.body.appendChild(suggestionButton);

  // Add click event to suggestion button
  suggestionButton.addEventListener("click", () => {
    toggleSuggestionPopup();
  });

  // Create suggestion popup
  suggestionPopup = document.createElement("div");
  suggestionPopup.className = "twitter-improver-popup";
  suggestionPopup.innerHTML = `
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <div class="twitter-improver-popup-header">
      <span class="twitter-improver-popup-title">Text Improver</span>
      <button class="twitter-improver-popup-close">×</button>
    </div>
    <div class="twitter-improver-popup-content">
      <div class="twitter-improver-loading">
        <div class="twitter-improver-spinner"></div>
        <span>Analyzing your text...</span>
      </div>
      <div class="twitter-improver-suggestion-content" style="display: none;">
        <h4>Improved Version:</h4>
        <p class="twitter-improver-suggested-text"></p>
        <button class="twitter-improver-apply">Apply Suggestion</button>
      </div>
    </div>
  `;
  suggestionPopup.style.display = "none";
  document.body.appendChild(suggestionPopup);

  // Add event listeners for popup
  suggestionPopup
    .querySelector(".twitter-improver-popup-close")
    .addEventListener("click", () => {
      suggestionPopup.style.display = "none";
    });

  // Fixed apply suggestion functionality
  suggestionPopup
    .querySelector(".twitter-improver-apply")
    .addEventListener("click", () => {
      const suggestedText = suggestionPopup
        .querySelector(".twitter-improver-suggested-text")
        ?.textContent?.trim();
      if (suggestedText) {
        console.log("@@ SUGGESTED TEXT " + suggestedText);
        applyTextSafely(suggestedText);
      } else {
        alert("No suggestion available to apply.");
      }
    });
}

// Safely apply text to Twitter input without breaking the UI
function applyTextSafely(text) {
  if (!currentEditingElement || !text) return;

  try {
    // Focus the element first
    currentEditingElement.focus();

    // For DraftJS editor (Twitter's contentEditable)
    if (currentEditingElement.isContentEditable) {
      // Get existing offset key pattern from the current content
      const existingSpan = currentEditingElement.querySelector(
        "span[data-offset-key]"
      );
      const offsetKeyBase = existingSpan
        ? existingSpan.getAttribute("data-offset-key").split("-")[0]
        : generateOffsetKey();

      // Clear existing content first while preserving the root structure
      const rootDiv = currentEditingElement.querySelector(
        '[data-contents="true"]'
      );
      if (rootDiv) {
        rootDiv.innerHTML = "";

        // Create block div with proper attributes
        const blockDiv = document.createElement("div");
        blockDiv.setAttribute("data-block", "true");
        blockDiv.setAttribute(
          "data-editor",
          currentEditingElement.getAttribute("data-editor") || ""
        );
        blockDiv.className =
          "public-DraftStyleDefault-block public-DraftStyleDefault-ltr";

        // Create outer span with offset key
        const outerSpan = document.createElement("span");
        outerSpan.setAttribute("data-offset-key", `${offsetKeyBase}-0-0`);

        // Create inner span with data-text
        const textSpan = document.createElement("span");
        textSpan.setAttribute("data-text", "true");
        textSpan.textContent = text;

        // Assemble the structure
        outerSpan.appendChild(textSpan);
        blockDiv.appendChild(outerSpan);
        rootDiv.appendChild(blockDiv);

        // Simulate realistic user input events
        simulateNaturalTyping(currentEditingElement, text);
      }
    }
    // For standard inputs and textareas (fallback)
    else if (
      currentEditingElement.tagName === "INPUT" ||
      currentEditingElement.tagName === "TEXTAREA"
    ) {
      currentEditingElement.value = text;
      currentEditingElement.dispatchEvent(
        new Event("input", { bubbles: true })
      );
      currentEditingElement.dispatchEvent(
        new Event("change", { bubbles: true })
      );
    }

    // Hide popup after successful application
    setTimeout(() => {
      suggestionPopup.style.display = "none";
    }, 500);
  } catch (error) {
    console.error("Error applying text:", error);
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert(
          "Cannot apply directly. Text copied to clipboard - please paste manually."
        );
        suggestionPopup.style.display = "none";
      })
      .catch((err) => {
        alert("Cannot apply text. Please try copying this manually: " + text);
      });
  }
}

// Generate a random offset key similar to DraftJS format
function generateOffsetKey() {
  return Math.random().toString(36).substring(2, 8);
}

// Simulate natural typing to better integrate with DraftJS
function simulateNaturalTyping(element, text) {
  // Find the parent Draft editor component
  const editorRoot = element.closest('[role="textbox"]');
  if (!editorRoot) return;

  // Create and dispatch necessary events
  const events = [
    new InputEvent("input", { bubbles: true, cancelable: true, data: text }),
    new Event("change", { bubbles: true }),
    new KeyboardEvent("keydown", { key: "Process", bubbles: true }),
    new CompositionEvent("compositionstart", { bubbles: true }),
    new CompositionEvent("compositionupdate", { bubbles: true, data: text }),
    new CompositionEvent("compositionend", { bubbles: true, data: text }),
    new KeyboardEvent("keyup", { key: "Process", bubbles: true }),
  ];

  // Dispatch events in sequence
  events.forEach((event) => {
    editorRoot.dispatchEvent(event);
  });

  // Additional DraftJS specific events
  const draftSpecificEvents = [
    new Event("selectionchange", { bubbles: true }),
    new CustomEvent("draft-js-selection-change", { bubbles: true }),
  ];

  draftSpecificEvents.forEach((event) => {
    document.dispatchEvent(event);
  });

  // Force update DraftJS internal state
  setTimeout(() => {
    editorRoot.dispatchEvent(new Event("input", { bubbles: true }));
    editorRoot.dispatchEvent(new Event("change", { bubbles: true }));
  }, 10);
}

// Toggle suggestion popup visibility
function toggleSuggestionPopup() {
  if (suggestionPopup.style.display === "none") {
    // Position the popup near the button
    const buttonRect = suggestionButton.getBoundingClientRect();
    suggestionPopup.style.top = `${buttonRect.bottom + window.scrollY + 5}px`;
    suggestionPopup.style.left = `${
      buttonRect.left + window.scrollX - 150 + buttonRect.width / 2
    }px`;
    suggestionPopup.style.display = "block";

    // If we already have a suggestion, show it
    if (lastAnalyzedText && lastAnalyzedText === getCurrentText()) {
      showSuggestionContent();
    } else {
      // Otherwise analyze the text
      analyzeCurrentText();
    }
  } else {
    suggestionPopup.style.display = "none";
  }
}

// Show suggestion button at the current cursor position
function showSuggestionButton() {
  if (!currentEditingElement) return;

  // Get element position
  const rect = currentEditingElement.getBoundingClientRect();

  // Position the button at the right edge of the input field
  suggestionButton.style.top = `${
    rect.top + window.scrollY + rect.height / 2 - 12
  }px`;
  suggestionButton.style.left = `${rect.right + window.scrollX - 30}px`;
  suggestionButton.style.display = "block";

  // If analyzing, show spinner on the button
  if (isAnalyzing) {
    suggestionButton.classList.add("twitter-improver-analyzing");
  } else {
    suggestionButton.classList.remove("twitter-improver-analyzing");
  }
}

// Hide suggestion button
function hideSuggestionButton() {
  if (suggestionButton) {
    suggestionButton.style.display = "none";
  }
}

// Get current text from the editing element
function getCurrentText() {
  if (!currentEditingElement) return "";

  if (
    currentEditingElement.tagName === "INPUT" ||
    currentEditingElement.tagName === "TEXTAREA"
  ) {
    return currentEditingElement.value || "";
  } else if (currentEditingElement.isContentEditable) {
    return currentEditingElement.textContent || "";
  }

  return "";
}

// Analyze current text with Gemini API
function analyzeCurrentText() {
  const text = getCurrentText();
  console.log("GET CURRENT TEXT " + getCurrentText);

  // Don't analyze if text is too short or already analyzing
  if (!text || text.length < 10 || isAnalyzing) return;

  isAnalyzing = true;
  lastAnalyzedText = text;

  // Show loading state
  suggestionPopup.querySelector(".twitter-improver-loading").style.display =
    "flex";
  suggestionPopup.querySelector(
    ".twitter-improver-suggestion-content"
  ).style.display = "none";
  suggestionButton.classList.add("twitter-improver-analyzing");

  // Call the API
  improveText(text);
}

// Call Gemini API to improve the text
async function improveText(text) {
  try {
    const prompt = `Generate a Twitter post that sounds like a casual conversation, with human-like imperfections. 
    Use short sentences, include some grammatical mistakes, and avoid over-polishing the text. Keep it punchy, natural, and easy to read. 
    The tone should feel conversational, not overly formal. Don't add too much grammar structure, just make it feel like a regular tweet from a person. 
    Keep it short like 8-11 words.  Add some grammar mistakes, don’t over-polish. Sound human — not like a bot or brand.
    Just rewrite this in that tone: "${text}"`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 280, // Twitter character limit
          },
        }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error?.message || "API request failed");
    }

    const data = await res.json();
    const suggestion =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No improvement available.";

    // Update popup with suggestion
    suggestionPopup.querySelector(
      ".twitter-improver-suggested-text"
    ).textContent = suggestion;

    showSuggestionContent();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    suggestionPopup.querySelector(
      ".twitter-improver-suggested-text"
    ).textContent = "Failed to generate suggestion. Please try again.";
    showSuggestionContent();
  } finally {
    isAnalyzing = false;
    suggestionButton.classList.remove("twitter-improver-analyzing");
  }
}

// Show suggestion content in popup
function showSuggestionContent() {
  suggestionPopup.querySelector(".twitter-improver-loading").style.display =
    "none";
  suggestionPopup.querySelector(
    ".twitter-improver-suggestion-content"
  ).style.display = "block";
}

// Identify Twitter text input fields - Improved with more Twitter-specific selectors
function isTweetInputField(element) {
  // Common Twitter input field identifiers
  if (element.getAttribute("data-text") === "true") return true;
  if (
    element.getAttribute("aria-label") === "Tweet text" ||
    element.getAttribute("aria-label") === "Post text"
  )
    return true;
  if (
    element.getAttribute("role") === "textbox" &&
    (element.closest('[data-testid="tweetTextarea_0"]') ||
      element.closest('[data-testid="tweetTextarea"]'))
  )
    return true;

  // Check for contentEditable divs in the tweet composer
  if (
    element.isContentEditable &&
    (element.closest('[data-testid="tweetTextarea_0"]') ||
      element.closest('[data-testid="tweetTextarea"]') ||
      element.closest('[aria-label="Tweet text"]') ||
      element.closest('[aria-label="Post text"]'))
  )
    return true;

  // More specific Twitter selectors
  if (
    element.matches(
      '[data-testid="tweetTextarea_0"] [contenteditable="true"]'
    ) ||
    element.matches('[data-testid="tweetTextarea"] [contenteditable="true"]')
  )
    return true;

  // Look for parent components that indicate we're in a tweet composer
  const parent = element.parentElement;
  if (
    parent &&
    (parent.getAttribute("data-testid") === "tweetTextarea_0" ||
      parent.getAttribute("data-testid") === "tweetTextarea" ||
      parent.getAttribute("role") === "textbox")
  )
    return true;

  return false;
}

// Setup observer for tweet inputs with improved event handling
function setupTweetObserver() {
  // Listen for clicks anywhere in the document
  document.addEventListener("click", (e) => {
    // Check if click is in a tweet input field
    const tweetInputs = document.querySelectorAll(
      '[data-testid="tweetTextarea_0"] [contenteditable="true"], [data-testid="tweetTextarea"] [contenteditable="true"], [aria-label="Tweet text"], [aria-label="Post text"], [role="textbox"]'
    );

    tweetInputs.forEach((input) => {
      // If any of these elements contain the click target
      if (input.contains(e.target) || e.target === input) {
        currentEditingElement = input;
        // Check if there's enough text to show button
        if (getCurrentText().length >= 10) {
          showSuggestionButton();
        }
      }
    });
  });

  // Use focus events to capture when user clicks into a text area
  document.addEventListener("focusin", (e) => {
    if (isTweetInputField(e.target)) {
      currentEditingElement = e.target;
      if (getCurrentText().length >= 10) {
        showSuggestionButton();
      }
    }
  });

  // Use blur events to hide our UI when focus is lost
  document.addEventListener("focusout", (e) => {
    if (isTweetInputField(e.target)) {
      // Only hide if not clicking on our UI elements
      const relatedTarget = e.relatedTarget;
      if (
        relatedTarget &&
        (relatedTarget.closest(".twitter-improver-button") ||
          relatedTarget.closest(".twitter-improver-popup"))
      ) {
        return;
      }

      // Short timeout to avoid race conditions
      setTimeout(() => {
        const activeElement = document.activeElement;
        if (
          !activeElement ||
          (!activeElement.closest(".twitter-improver-button") &&
            !activeElement.closest(".twitter-improver-popup"))
        ) {
          hideSuggestionButton();
        }
      }, 200);
    }
  });

  // Track input events to detect typing
  document.addEventListener("input", (e) => {
    if (isTweetInputField(e.target)) {
      currentEditingElement = e.target;

      // Clear previous timer
      clearTimeout(debounceTimer);

      const text = getCurrentText();
      // Show/hide button based on text length
      if (text.length >= 10) {
        showSuggestionButton();

        // Set debounce timer for analysis
        debounceTimer = setTimeout(() => {
          if (suggestionPopup.style.display !== "none") {
            analyzeCurrentText();
          }
        }, 1500); // 1.5 second debounce
      } else {
        hideSuggestionButton();
      }
    }
  });

  // Listen for keydown events to track Enter key (which may submit tweets)
  document.addEventListener("keydown", (e) => {
    // If Enter key is pressed while in a tweet input and we have currentEditingElement
    if (e.key === "Enter" && currentEditingElement && !e.shiftKey) {
      // Check if we're in a context where Enter might submit the tweet
      const submitButton = document.querySelector(
        '[data-testid="tweetButton"]'
      );
      if (submitButton) {
        // Make sure our suggested text is properly applied before any submission
        const suggestedText = suggestionPopup?.querySelector?.(
          ".twitter-improver-suggested-text"
        )?.textContent;
        if (suggestedText && suggestionPopup.style.display !== "none") {
          // Reapply the text to ensure it's in Twitter's state
          applyTextSafely(suggestedText);
        }
      }
    }
  });

  // Also observe DOM changes to catch dynamically created tweet inputs
  const observer = new MutationObserver((mutations) => {
    // Check if any tweet compose areas appeared
    let newComposeAreaFound = false;

    mutations.forEach((mutation) => {
      // Check added nodes
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          // Element node
          // Find tweet inputs in this node
          if (node.querySelector) {
            const inputs = node.querySelectorAll(
              '[data-testid="tweetTextarea_0"], [data-testid="tweetTextarea"], [contenteditable="true"], [aria-label="Tweet text"], [aria-label="Post text"]'
            );

            if (inputs.length > 0) {
              newComposeAreaFound = true;
            }
          }
        }
      });
    });

    // If we found new compose areas, try to initialize our button
    if (newComposeAreaFound) {
      setTimeout(() => {
        // Find the active compose area
        const activeInputs = document.querySelectorAll(
          '[data-testid="tweetTextarea_0"] [contenteditable="true"], [data-testid="tweetTextarea"] [contenteditable="true"]'
        );

        activeInputs.forEach((input) => {
          if (
            document.activeElement === input ||
            input.contains(document.activeElement)
          ) {
            currentEditingElement = input;
            if (getCurrentText().length >= 10) {
              showSuggestionButton();
            }
          }
        });
      }, 500); // Give Twitter time to fully initialize the component
    }
  });

  // Start observing document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial check for tweet inputs
  setTimeout(() => {
    const tweetInputs = document.querySelectorAll(
      '[data-testid="tweetTextarea_0"] [contenteditable="true"], [data-testid="tweetTextarea"] [contenteditable="true"], [aria-label="Tweet text"], [aria-label="Post text"], [role="textbox"]'
    );

    tweetInputs.forEach((input) => {
      input.dataset.improverObserved = "true";

      // If one is active, set it as current
      if (
        document.activeElement === input ||
        input.contains(document.activeElement)
      ) {
        currentEditingElement = input;
        if (getCurrentText().length >= 10) {
          showSuggestionButton();
        }
      }
    });
  }, 1000);
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", init);
// Also try to initialize immediately for pages that are already loaded
init();
