
(function () {
  const script = document.currentScript;
  const widgetId = script.dataset.widgetId;

  const button = document.createElement("button");
  button.textContent = "Chat with AI";
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
    border-radius:16px;box-shadow:0 5px 30px #0005;
    padding:14px;box-sizing:border-box;font-family:Arial;
  `;

  panel.innerHTML = `
    <h3>WebVibe AI</h3>
    <div id="wv-messages" style="height:285px;overflow:auto;
      border-bottom:1px solid #333;padding:5px"></div>
    <form id="wv-form" style="display:flex;gap:5px;margin-top:10px">
      <input id="wv-input" placeholder="Ask something..."
        style="flex:1;min-width:0;padding:10px;border-radius:8px">
      <button style="background:#4f8cff;color:white;border:0;
        border-radius:8px;padding:10px">Send</button>
    </form>
  `;

  document.body.append(button, panel);
  button.onclick = () => {
    panel.style.display =
      panel.style.display === "none" ? "block" : "none";
  };

  const messages = panel.querySelector("#wv-messages");

  panel.querySelector("#wv-form").onsubmit = async (event) => {
    event.preventDefault();

    const input = panel.querySelector("#wv-input");
    const question = input.value.trim();
    if (!question) return;

    input.value = "";
    addMessage("You", question);
    addMessage("AI", "Thinking...");

    try {
      const response = await fetch(
        "https://YOUR-SITE.netlify.app/.netlify/functions/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ widgetId, question })
        }
      );

      const data = await response.json();
      messages.lastChild.remove();
      addMessage("AI", response.ok ? data.reply : "Sorry, an error occurred.");
    } catch {
      messages.lastChild.remove();
      addMessage("AI", "Unable to connect. Please try again.");
    }
  };

  function addMessage(sender, text) {
    const line = document.createElement("p");
    const label = document.createElement("strong");
    label.textContent = sender + ": ";
    line.append(label, document.createTextNode(text));
    messages.appendChild(line);
    messages.scrollTop = messages.scrollHeight;
  }
})();
