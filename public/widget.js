
(() => {
  "use strict";

  if (window.__webvibeWidgetLoaded) return;
  window.__webvibeWidgetLoaded = true;

  const script = document.currentScript;
  const WIDGET_ID = script?.dataset.widgetId || "demo123";
  const API_URL =
    "https://llmaichatbot.netlify.app/.netlify/functions/chat";

  const style = document.createElement("style");
  style.textContent = `
    #wv-launcher, #wv-panel, #wv-panel * {
      box-sizing: border-box;
      font-family: Inter, system-ui, -apple-system, sans-serif;
    }

    #wv-launcher {
      position: fixed;
      right: 22px;
      bottom: 22px;
      z-index: 2147483646;
      width: 60px;
      height: 60px;
      border: 0;
      border-radius: 50%;
      color: white;
      background: linear-gradient(135deg,#4f8cff,#7957ff);
      box-shadow: 0 8px 30px #4f8cff55;
      font-size: 26px;
      cursor: pointer;
      transition: transform .2s;
    }
    #wv-launcher:hover { transform: scale(1.06); }

    #wv-panel {
      position: fixed;
      right: 22px;
      bottom: 94px;
      z-index: 2147483647;
      width: min(380px, calc(100vw - 28px));
      height: min(560px, calc(100dvh - 125px));
      display: none;
      flex-direction: column;
      overflow: hidden;
      color: #edf2ff;
      background: #0b0f17;
      border: 1px solid #29354a;
      border-radius: 20px;
      box-shadow: 0 20px 70px #0009;
    }
    #wv-panel.wv-open { display: flex; }

    .wv-header {
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 17px;
      background: #141b26;
      border-bottom: 1px solid #29354a;
    }
    .wv-avatar {
      width: 39px;
      height: 39px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      border-radius: 13px;
      background: linear-gradient(135deg,#4f8cff,#7957ff);
      font-size: 19px;
    }
    .wv-heading { flex: 1; min-width: 0; }
    .wv-heading strong { display: block; font-size: 15px; }
    .wv-status { color: #94a3b8; font-size: 12px; margin-top: 3px; }
    .wv-close {
      border: 0;
      background: transparent;
      color: #aab6ca;
      font-size: 24px;
      cursor: pointer;
    }

    .wv-messages {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 17px;
      scroll-behavior: smooth;
    }
    .wv-msg {
      max-width: 88%;
      padding: 11px 13px;
      border-radius: 14px;
      font-size: 14px;
      line-height: 1.55;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
    }
    .wv-bot {
      align-self: flex-start;
      background: #182131;
      border: 1px solid #29354a;
      border-bottom-left-radius: 4px;
    }
    .wv-user {
      align-self: flex-end;
      background: #356fe0;
      color: white;
      border-bottom-right-radius: 4px;
    }
    .wv-error { color: #ffb4b4; }

    .wv-quick {
      display: flex;
      gap: 7px;
      padding: 0 14px 12px;
      overflow-x: auto;
    }
    .wv-quick button {
      flex-shrink: 0;
      border: 1px solid #34445e;
      background: #141b26;
      color: #c9d8f5;
      border-radius: 20px;
      padding: 7px 10px;
      font-size: 12px;
      cursor: pointer;
    }

    .wv-compose {
      display: flex;
      gap: 9px;
      align-items: flex-end;
      padding: 13px;
      border-top: 1px solid #29354a;
      background: #101722;
    }
    .wv-input {
      flex: 1;
      min-width: 0;
      max-height: 100px;
      resize: none;
      outline: none;
      border: 1px solid #34445e;
      border-radius: 13px;
      padding: 12px;
      color: white;
      background: #0b0f17;
      font-size: 14px;
    }
    .wv-input:focus { border-color: #4f8cff; }
    .wv-input::placeholder { color: #7e8ba2; }
    .wv-send {
      width: 43px;
      height: 43px;
      flex-shrink: 0;
      border: 0;
      border-radius: 12px;
      color: white;
      background: #4f8cff;
      font-size: 20px;
      cursor: pointer;
    }
    .wv-send:disabled { opacity: .5; cursor: wait; }
    .wv-footer {
      text-align: center;
      color: #65738a;
      font-size: 10px;
      padding: 0 8px 9px;
      background: #101722;
    }

    @media (max-width: 480px) {
      #wv-panel {
        right: 10px;
        bottom: 82px;
        width: calc(100vw - 20px);
        height: min(580px, calc(100dvh - 100px));
        border-radius: 17px;
      }
      #wv-launcher { right: 16px; bottom: 16px; }
    }
  `;
  document.head.appendChild(style);

  const launcher = document.createElement("button");
  launcher.id = "wv-launcher";
  launcher.type = "button";
  launcher.textContent = "✦";
  launcher.setAttribute("aria-label", "Open WebVibe AI chat");
  launcher.setAttribute("aria-expanded", "false");

  const panel = document.createElement("section");
  panel.id = "wv-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "WebVibe AI assistant");

  panel.innerHTML = `
    <header class="wv-header">
      <div class="wv-avatar">✦</div>
      <div class="wv-heading">
        <strong>WebVibe AI</strong>
        <div class="wv-status">AI assistant · Ready to help</div>
      </div>
      <button class="wv-close" type="button"
        aria-label="Close chat">&times;</button>
    </header>
    <div class="wv-messages" aria-live="polite"></div>
    <div class="wv-quick">
      <button type="button" data-prompt="What can you help me with?">What can you do?</button>
      <button type="button" data-prompt="Help me build a website">Build a website</button>
    </div>
    <form class="wv-compose">
      <textarea class="wv-input" rows="1" maxlength="4000"
        placeholder="Message WebVibe AI..." aria-label="Your message"></textarea>
      <button class="wv-send" type="submit" aria-label="Send message">➤</button>
    </form>
    <div class="wv-footer">Powered by WebVibe AI</div>
  `;

  document.body.append(launcher, panel);

  const messages = panel.querySelector(".wv-messages");
  const form = panel.querySelector(".wv-compose");
  const input = panel.querySelector(".wv-input");
  const send = panel.querySelector(".wv-send");
  const status = panel.querySelector(".wv-status");

  function addMessage(text, who, isError = false) {
    const item = document.createElement("div");
    item.className = `wv-msg ${who === "user" ? "wv-user" : "wv-bot"}`;
    if (isError) item.classList.add("wv-error");
    item.textContent = text;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
  }

  addMessage(
    "Hi! 👋 I'm your WebVibe AI assistant. What would you like help with?",
    "bot"
  );

  function openChat() {
    panel.classList.add("wv-open");
    launcher.setAttribute("aria-expanded", "true");
    launcher.textContent = "×";
    input.focus();
  }

  function closeChat() {
    panel.classList.remove("wv-open");
    launcher.setAttribute("aria-expanded", "false");
    launcher.textContent = "✦";
  }

  launcher.addEventListener("click", () => {
    panel.classList.contains("wv-open") ? closeChat() : openChat();
  });
  panel.querySelector(".wv-close").addEventListener("click", closeChat);

  async function sendMessage(text) {
    const question = text.trim();
    if (!question || send.disabled) return;

    addMessage(question, "user");
    input.value = "";
    input.style.height = "auto";
    send.disabled = true;
    status.textContent = "Thinking...";
    const waiting = addMessage("Thinking…", "bot");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetId: WIDGET_ID,
          question
        }),
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({}));
      waiting.remove();

      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }
      if (typeof data.reply !== "string") {
        throw new Error("The server returned an invalid response.");
      }

      addMessage(data.reply, "bot");
      status.textContent = "AI assistant · Ready to help";
    } catch (error) {
      waiting.remove();
      const message = error.name === "AbortError"
        ? "The request timed out. Please try again."
        : error instanceof TypeError
          ? "Could not connect. Check your backend deployment and CORS settings."
          : error.message || "Something went wrong. Please try again.";

      addMessage(message, "bot", true);
      status.textContent = "Connection issue";
    } finally {
      clearTimeout(timeout);
      send.disabled = false;
      input.focus();
      messages.scrollTop = messages.scrollHeight;
    }
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    sendMessage(input.value);
  });

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 100) + "px";
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  panel.querySelectorAll("[data-prompt]").forEach(button => {
    button.addEventListener("click", () => {
      openChat();
      sendMessage(button.dataset.prompt);
    });
  });
})();
