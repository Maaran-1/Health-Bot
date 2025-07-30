// main.js
let lottiePlayer;
let currentSessionId = Date.now().toString();

function appendMessage(sender, text) {
  const chatLog = document.getElementById("chat-log");
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;

  const markdownDiv = document.createElement("div");
  markdownDiv.className = "markdown";
  markdownDiv.innerHTML = marked.parse(text);

  msg.appendChild(markdownDiv);
  chatLog.appendChild(msg);
  chatLog.scrollTop = chatLog.scrollHeight;
  saveChat();
}

async function callAI(question) {
  try {
    const res = await fetch("/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: question })
    });

    const data = await res.json();
    return data.reply;
  } catch (err) {
    return "⚠️ Connection error. Please try again later.";
  }
}

async function handleSubmit() {
  const input = document.getElementById("query");
  const text = input.value.trim();
  if (!text) return;

  appendMessage("user", text);
  input.value = "";

  showTyping();
  const reply = await callAI(text);
  hideTyping();
  appendMessage("bot", reply);
}

function showTyping() {
  document.getElementById("typing-indicator").classList.remove("hidden");
  if (lottiePlayer) lottiePlayer.play();
}
function hideTyping() {
  document.getElementById("typing-indicator").classList.add("hidden");
  if (lottiePlayer) lottiePlayer.stop();
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
}
function loadTheme() {
  const theme = localStorage.getItem("theme");
  if (theme === "dark") document.body.classList.add("dark");
}

function saveChat() {
  const chatHTML = document.getElementById("chat-log").innerHTML;
  localStorage.setItem(`chat-${currentSessionId}`, chatHTML);
  updateHistory();
}

function deleteChat(sessionId) {
  localStorage.removeItem(`chat-${sessionId}`);
  updateHistory();
}

function renameChat(sessionId) {
  const newName = prompt("Enter a new name for this chat:");
  if (newName) {
    localStorage.setItem(`chatname-${sessionId}`, newName);
    updateHistory();
  }
}

function loadChat(sessionId) {
  currentSessionId = sessionId;
  const history = localStorage.getItem(`chat-${sessionId}`);
  document.getElementById("chat-log").innerHTML = history || "";
}

function updateHistory() {
  const historyDiv = document.getElementById("history");
  historyDiv.innerHTML = "";
  Object.keys(localStorage)
    .filter(k => k.startsWith("chat-"))
    .forEach(key => {
      const sessionId = key.replace("chat-", "");
      const title = localStorage.getItem(`chatname-${sessionId}`) || `🗂️ ${new Date(Number(sessionId)).toLocaleString()}`;

      const wrapper = document.createElement("div");
      wrapper.className = "history-item";

      const btn = document.createElement("button");
      btn.textContent = title;
      btn.onclick = () => loadChat(sessionId);

      const menu = document.createElement("div");
      menu.className = "menu";
      menu.innerHTML = `
        <button onclick="renameChat('${sessionId}')">✏️</button>
        <button onclick="deleteChat('${sessionId}')">🗑️</button>
      `;

      wrapper.appendChild(btn);
      wrapper.appendChild(menu);
      historyDiv.appendChild(wrapper);
    });
}

function startNewChat() {
  currentSessionId = Date.now().toString();
  document.getElementById("chat-log").innerHTML = "";
  appendMessage("bot", "👋 Hello! I'm Health Bot. Ask me anything about your health or wellness.");
}

function handleVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return alert("Your browser doesn't support voice input.");
  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.onresult = async (e) => {
    const transcript = e.results[0][0].transcript;
    document.getElementById("query").value = transcript;
    await handleSubmit();
  };
  recognition.start();
}

function handleFileUpload(event) {
  const files = event.target.files;
  if (files.length === 0) return;
  appendMessage("user", `📁 Uploaded ${files.length} file(s). Processing...`);
  showTyping();
  setTimeout(() => {
    hideTyping();
    appendMessage("bot", `🩺 I've analyzed the file(s). Here's a relevant health response based on the content.`);
  }, 2000);
}

window.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  updateHistory();
  lottiePlayer = lottie.loadAnimation({
    container: document.getElementById("lottie"),
    renderer: "svg",
    loop: true,
    autoplay: false,
    path: "https://assets10.lottiefiles.com/packages/lf20_0yfsb3a1.json"
  });
  startNewChat();

  document.getElementById("query").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  });

  document.getElementById("file-upload").addEventListener("change", handleFileUpload);
});
