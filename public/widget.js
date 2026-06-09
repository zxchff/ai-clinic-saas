// AI Clinic SaaS - Embeddable Chatbot Widget
(function() {
  // Get the client ID from the script tag
  const scriptTag = document.currentScript;
  const clientId = scriptTag.getAttribute("data-client");

  // Create the floating button
  const button = document.createElement("div");
  button.innerHTML = `
    <div id="ai-clinic-chat-btn" style="position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background-color: #3b82f6; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.15); cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 999999; transition: transform 0.2s;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
    </div>
  `;
  document.body.appendChild(button);

  // Create the chat window
  const chatWindow = document.createElement("div");
  chatWindow.innerHTML = `
    <div id="ai-clinic-chat-window" style="position: fixed; bottom: 90px; right: 20px; width: 350px; height: 500px; background-color: white; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); display: none; flex-direction: column; z-index: 999999; overflow: hidden; font-family: sans-serif;">
      <div style="background-color: #3b82f6; padding: 16px; color: white; font-weight: bold; font-size: 16px; display: flex; justify-content: space-between; align-items: center;">
        <span>AI Receptionist</span>
        <button id="ai-clinic-close-btn" style="background: none; border: none; color: white; cursor: pointer; font-size: 20px;">×</button>
      </div>
      <div id="ai-clinic-messages" style="flex: 1; padding: 16px; overflow-y: auto; background-color: #f3f4f6; display: flex; flex-direction: column; gap: 8px;">
        <div style="background-color: white; padding: 12px; border-radius: 8px; border-bottom-left-radius: 0; max-width: 80%; align-self: flex-start; color: #1f2937; font-size: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
          Hi there! I'm the AI Receptionist. How can I help you today?
        </div>
      </div>
      <div style="padding: 12px; background-color: white; border-top: 1px solid #e5e7eb; display: flex; gap: 8px;">
        <input type="text" id="ai-clinic-chat-input" placeholder="Type a message..." style="flex: 1; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 20px; outline: none !important; font-size: 14px; color: #000 !important; background-color: #fff !important; pointer-events: all !important; cursor: text !important; user-select: auto !important; z-index: 9999999 !important;">
        <button id="ai-clinic-send-btn" style="background-color: #3b82f6; color: white; border: none; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center; pointer-events: all !important; z-index: 9999999 !important;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(chatWindow);

  // Logic
  const btn = document.getElementById("ai-clinic-chat-btn");
  const win = document.getElementById("ai-clinic-chat-window");
  const closeBtn = document.getElementById("ai-clinic-close-btn");
  const input = document.getElementById("ai-clinic-chat-input");
  const sendBtn = document.getElementById("ai-clinic-send-btn");
  const messages = document.getElementById("ai-clinic-messages");

  btn.addEventListener("click", () => {
    win.style.display = win.style.display === "none" ? "flex" : "none";
    if (win.style.display === "flex") {
      setTimeout(() => input.focus(), 100);
    }
  });

  closeBtn.addEventListener("click", () => {
    win.style.display = "none";
  });

  const sendMessage = async () => {
    if (!input.value.trim()) return;
    
    // User message
    const userText = input.value;
    const userMsg = document.createElement("div");
    userMsg.innerHTML = `<div style="background-color: #3b82f6; color: white; padding: 12px; border-radius: 8px; border-bottom-right-radius: 0; max-width: 80%; align-self: flex-end; font-size: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">${userText}</div>`;
    userMsg.style.display = "flex";
    userMsg.style.flexDirection = "column";
    messages.appendChild(userMsg);
    
    input.value = "";
    messages.scrollTop = messages.scrollHeight;

    // Show typing indicator
    const typingMsg = document.createElement("div");
    typingMsg.id = "ai-clinic-typing";
    typingMsg.innerHTML = `<div style="background-color: white; color: #9ca3af; padding: 12px; border-radius: 8px; border-bottom-left-radius: 0; max-width: 80%; align-self: flex-start; font-size: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">Typing...</div>`;
    typingMsg.style.display = "flex";
    typingMsg.style.flexDirection = "column";
    messages.appendChild(typingMsg);
    messages.scrollTop = messages.scrollHeight;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientId,
          messages: [{ role: "user", content: userText }]
        })
      });
      const data = await response.json();
      
      // Remove typing indicator
      const typingEl = document.getElementById("ai-clinic-typing");
      if (typingEl) typingEl.remove();

      // AI Reply
      const aiMsg = document.createElement("div");
      aiMsg.innerHTML = `<div style="background-color: white; color: #1f2937; padding: 12px; border-radius: 8px; border-bottom-left-radius: 0; max-width: 80%; align-self: flex-start; font-size: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">${data.reply || "Error: No response"}</div>`;
      aiMsg.style.display = "flex";
      aiMsg.style.flexDirection = "column";
      messages.appendChild(aiMsg);
      messages.scrollTop = messages.scrollHeight;
    } catch (error) {
      const typingEl = document.getElementById("ai-clinic-typing");
      if (typingEl) typingEl.remove();
      
      const errMsg = document.createElement("div");
      errMsg.innerHTML = `<div style="background-color: #fee2e2; color: #991b1b; padding: 12px; border-radius: 8px; border-bottom-left-radius: 0; max-width: 80%; align-self: flex-start; font-size: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">Failed to connect to backend API.</div>`;
      errMsg.style.display = "flex";
      errMsg.style.flexDirection = "column";
      messages.appendChild(errMsg);
      messages.scrollTop = messages.scrollHeight;
    }
  };

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
})();
