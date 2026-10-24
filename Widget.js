
(function () {
  const script = document.currentScript;

  if (!script) return;

  const widgetId = script.dataset.widgetId || "demo123";

  // IMPORTANT: Replace with your actual Netlify site URL.
  const API_URL =
    "https://YOUR-SITE.netlify.app/.netlify/functions/chat";

  const button = document.createElement("button");
  button.textContent = "💬 Chat with AI";
  button.style.cssText = `
    position:fixed;bottom:20px;right:20px;z-index:99999;
    background:#4f8cff;color:white;border:0;border-radius:30px;
    padding:14px 20px;cursor:pointer;font-size:15px;
  `;

  const panel = document.createElement("div");
  panel.style.cssText = `
    display:none;position:fixed;bottom:80px;right:20px;
    width:320px;height:420px;max-width:calc(100vw - 40px);
    background:#141b26;color:white;z-index:99999;
    border:1px solid #293548;border-radius:16px;
    box-shadow:0 5px 30px #0005;padding:14px;
    box-sizing:border-box;font-family:Arial,sans-serif;
  `;

  panel.innerHTML = `
    <h3 style="margin:0 0 12px">WebVibe AI</h3>
    <div id="wv-messages" aria-live="polite"
      style="height:285px;overflow:auto;border-bottom:1px solid #333;padding:5px">
      <p>AI: Hi! How can I help you?</p>
    </div>
    <form id="wv-form" style="display:flex;gap:5px;margin-top:10px">
      <input id="wv-input" maxlength="4000" required
        placeholder="Ask something..."
        style="flex:1;min-width:0;padding:10px;border-radius:8px">
      <button id="wv-send" type="submit"
        style="background:#4f8cff;color:white;border:0;border-radius:8px;padding:10px">
        Send
      </button>
    </form>
  `;

  document.body.append(button, panel);

  button.onclick = () => {
    const open = panel.style.display !== "block";
    panel.style.display = open ? "block" : "none";
  };

  const messages = panel.querySelector("#wv-messages");
  const form = panel.querySelector("#wv-form");
  const input = panel.querySelector("#wv-input");
  const sendButton = panel.querySelector("#wv-send");

  form.onsubmit = async (event) => {
    event.preventDefault();

    const question = input.value.trim();
    if (!question || sendButton.disabled) return;

    if (API_URL.includes("YOUR-SITE")) {
      addMessage("Error", "Replace YOUR-SITE with your Netlify site name.");
      return;
    }

    input.value = "";
    addMessage("You", question);

    const thinking = addMessage("AI", "Thinking...");
    sendButton.disabled = true;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgetId, question })
      });

      const data = await response.json();
      thinking.remove();

      if (!response.ok) {
        addMessage(
          "Error",
          data.error || `Request failed (HTTP ${response.status}).`
        );
      } else {
        addMessage("AI", data.reply || "No response received.");
      }
    } catch (error) {
      thinking.remove();
      console.error("WebVibe AI connection error:", error);
      addMessage(
        "Error",
        "Could not reach Netlify. Check the API URL, deployment, and browser console."
      );
    } finally {
      sendButton.disabled = false;
    }
  };

  function addMessage(sender, text) {
    const line = document.createElement("p");
    line.style.cssText = "white-space:pre-wrap;overflow-wrap:anywhere";

    const label = document.createElement("strong");
    label.textContent = sender + ": ";

    line.append(label, document.createTextNode(String(text)));
    messages.appendChild(line);
    messages.scrollTop = messages.scrollHeight;

    return line;
  }
})();
