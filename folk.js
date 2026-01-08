import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, onValue, set, onDisconnect } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- PASTE YOUR API KEYS HERE ---
const firebaseConfig = {
     apiKey: "AIzaSyAlUyqTb9onQ0PyOxLfZkDddeSnYdB2PlQ",
    authDomain: "ewsitechat.firebaseapp.com",
    databaseURL: "https://ewsitechat-default-rtdb.firebaseio.com",
    projectId: "ewsitechat",
    storageBucket: "ewsitechat.firebasestorage.app",
    messagingSenderId: "282495574514",
    appId: "1:282495574514:web:e2781da630d93fc1ce8b6b",
    measurementId: "G-GTN3TL1P2K"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Use separate folk_messages path
const messagesRef = ref(db, 'folk_messages'); 

// Username Logic
let username = localStorage.getItem('username');
if (!username) {
    username = prompt("name") || "unkown folk";
    localStorage.setItem('username', username);
}
const displayNameEl = document.getElementById('display-name');
if (displayNameEl) displayNameEl.innerText = username;

// Online Count
const presenceRef = ref(db, 'folk_presence');
const userStatusRef = ref(db, `folk_presence/${Date.now()}`);
set(userStatusRef, username);
onDisconnect(userStatusRef).remove();

onValue(presenceRef, (snapshot) => {
    const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    const countEl = document.getElementById('user-count');
    if(countEl) countEl.innerText = count;
});

// --- Sending Logic (Updated) ---
function sendMessage() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    
    if (text !== "") {
        push(messagesRef, {
            user: username,
            text: text,
            timestamp: Date.now(),
            type: 'text',
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`
        });
        input.value = "";
    }
}

// Attach Listeners
const sendBtn = document.getElementById('send-btn');
if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
}

const msgInput = document.getElementById('msg-input');
if (msgInput) {
    msgInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') sendMessage();
    });
}

// Image Logic
window.sendImage = function(base64Data) {
    push(messagesRef, {
        user: username,
        image: base64Data,
        timestamp: Date.now(),
        type: 'image',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`
    });
}

// --- Receiving Messages ---
const chatBox = document.getElementById('chat-messages');

onChildAdded(messagesRef, (snapshot) => {
    const data = snapshot.val();
    const msgDiv = document.createElement('div');
    msgDiv.className = "message-row";

    const avatarImg = document.createElement('img');
    avatarImg.src = data.avatar || "default.png";
    avatarImg.className = "msg-avatar";

    const contentDiv = document.createElement('div');
    contentDiv.className = "message-content";

    const nameSpan = document.createElement('div');
    nameSpan.className = "msg-username";
    nameSpan.innerText = data.user;

    const textDiv = document.createElement('div');
    textDiv.className = "msg-text";

    if (data.type === 'image') {
        const img = document.createElement('img');
        img.src = data.image;
        img.style.maxWidth = "100%";
        img.style.borderRadius = "8px";
        img.style.border = "1px solid #666";
        textDiv.appendChild(img);
    } else {
        textDiv.innerText = data.text;
    }

    contentDiv.appendChild(nameSpan);
    contentDiv.appendChild(textDiv);
    msgDiv.appendChild(avatarImg);
    msgDiv.appendChild(contentDiv);

    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
});
