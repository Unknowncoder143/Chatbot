(function () {
  "use strict";

  // Prevent the widget from being initialized more than once.
  if (window.__webvibeWidgetLoaded) return;
  window.__webvibeWidgetLoaded = true;

  const script = document.currentScript;
  const widgetId = script?.dataset.widgetId || "demo123";

  // Your actual Netlify backend URL.
  const API_URL =
    "https://llmaichatbot.netlify.app/.netlify/functions/chat";

  // ---------- Styles ----------
  const style = document.createElement("style");
  style.textContent = `
    #wv-chat-button {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 2147483647;
      border: 0;
      border-radius: 30px;
      padding: 14px 20px;
      background: #4f8cff;
      color: #fff;
      font: 600 15px Arial, sans-serif;
      cursor: pointer;
      box-shadow: 0 5px 25px #0004;
    }

    #wv-chat-panel {
      display: none;
      position: fixed;
      right: 20px;
      bottom: 82px;
      z-index: 2147483646;
      width: 360px;
      height: 480px;
      max-width: calc(100vw - 24px);
      max-height: calc(100dvh - 100px);
      background: #0b0f17;
      color: #f4f7fb;
      border: 1px solid #293548;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 12px 40px #0006;
      font: 14px Arial, sans-serif;
    }

    #wv-chat-header {
      height: 57px;
      padding: 0 15px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #141b26;
      border-bottom: 1px solid #293548;
    }

    #wv-chat-header strong {
      font-size: 16px;
    }

    #wv-chat-close {
      background: transparent;
      border: 0;
      color: white;
      font-size: 25px;
      cursor: pointer;
    }

    #wv-chat-messages {
      height: calc(100% - 137px);
      overflow-y: auto;
      padding: 14px;
      box-sizing: border-box;
    }

    .wv-chat-message {
      padding: 10px 12px;
      margin: 0 0 12px;
      border-radius: 12px;
      background: #182231;
      color: #f4f7fb;
      line-height: 1.55;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .wv-chat-user {
      background: #1d3760;
    }

    .wv-chat-error {
      background: #4a2027;
    }

    #wv-chat-form {
      height: 80px;
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 12px;
      border-top: 1px solid #293548;
      box-sizing: border-box;
    }

    #wv-chat-input {
      flex: 1;
      min-width: 0;
      padding: 12px;
      border: 1px solid #344158;
      border-radius: 10px;
      outline: none;
      background: #141b26;
      color: white;
      font-size: 14px;
    }

    #wv-chat-input:focus {
      border-color: #4f8cff;
    }

    #wv-chat-send {
      border: 0;
      border-radius: 10px;
      padding: 12px 14px;
      background: #4f8cff;
      color: white;
      font-weight: 600;
      cursor: pointer;
    }

    #wv-chat-send:disabled {
      opacity: .55;
      cursor: wait;
    }

    @media (max-width: 420px) {
      #wv-chat-button {
        right: 14px;
        bottom: 14px;
      }

      #wv-chat-panel {
        right: 10px;
        bottom: 72px;
        width: calc(100vw - 20px);
      }
    }
  `;
  document.head.appendChild(style);

  // ---------- Floating button ----------
  const button = document.createElement("button");
  button.id = "wv-chat-button";
  button.type = "button";
  button.textContent = "💬 Chat with AI";
  button.setAttribute("aria-controls", "wv-chat-panel");
  button.setAttribute("aria-expanded", "false");

  // ---------- Chat panel ----------
  const panel = document.createElement("section");
  panel.id = "wv-chat-panel";
  panel.setAttribute("aria-label", "WebVibe AI chatbot");

  panel.innerHTML = `
    <div id="wv-chat-header">
      <strong>✨ WebVibe AI</strong>
      <button id="wv-chat-close" type="button"
        aria-label="Close chatbot">×</button>
    </div>

    <div id="wv-chat-messages" aria-live="polite">
      <p class="wv-chat-message">
        Hi! 👋 Welcome to WebVibe AI. How can I help you?
      </p>
    </div>

    <form id="wv-chat-form">
      <input id="wv-chat-input"
        type="text"
        maxlength="4000"
        autocomplete="off"
        placeholder="Ask me anything..."
        aria-label="Type your question"
        required>

      <button id="wv-chat-send" type="submit">Send</button>
    </form>
  `;

  function mountWidget() {
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", mountWidget, {
        once: true
      });
      return;
    }

    document.body.append(button, panel);
    initializeChat();
  }

  function initializeChat() {
    const messages = panel.querySelector("#wv-chat-messages");
    const form = panel.querySelector("#wv-chat-form");
    const input = panel.querySelector("#wv-chat-input");
    const sendButton = panel.querySelector("#wv-chat-send");
    const closeButton = panel.querySelector("#wv-chat-close");

    function toggleChat(open) {
      panel.style.display = open ? "block" : "none";
      button.setAttribute("aria-expanded", String(open));

      if (open) input.focus();
    }

    button.addEventListener("click", function () {
      toggleChat(panel.style.display !== "block");
    });

    closeButton.addEventListener("click", function () {
      toggleChat(false);
    });

    function addMessage(sender, text, type) {
      const message = document.createElement("p");
      message.className = "wv-chat-message";

      if (type === "user") message.classList.add("wv-chat-user");
      if (type === "error") message.classList.add("wv-chat-error");

      const label = document.createElement("strong");
      label.textContent = sender + ": ";

      message.append(label, document.createTextNode(String(text)));
      messages.appendChild(message);
      messages.scrollTop = messages.scrollHeight;

      return message;
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const question = input.value.trim();
      if (!question || sendButton.disabled) return;

      addMessage("You", question, "user");
      input.value = "";

      const thinking = addMessage("AI", "Thinking...");
      sendButton.disabled = true;
      input.disabled = true;

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        30000
      );

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            widgetId: widgetId,
            question: question
          }),
          signal: controller.signal
        });

        const data = await response.json().catch(() => ({}));
        thinking.remove();

        if (!response.ok) {
          addMessage(
            "Error",
            data.error || "Request failed. HTTP " + response.status,
            "error"
          );
          return;
        }

        if (typeof data.reply !== "string" || !data.reply.trim()) {
          addMessage(
            "Error",
            "The AI did not return a text response.",
            "error"
          );
          return;
        }

        addMessage("AI", data.reply);
      } catch (error) {
        thinking.remove();

        const message = error.name === "AbortError"
          ? "The request timed out. Please try again."
          : "Could not connect to WebVibe AI. Check your internet connection and backend deployment.";

        addMessage("Error", message, "error");
        console.error("WebVibe AI request error:", error);
      } finally {
        clearTimeout(timeout);
        sendButton.disabled = false;
        input.disabled = false;

        if (panel.style.display === "block") {
          input.focus();
        }
      }
    });
  }

  mountWidget();
})();
