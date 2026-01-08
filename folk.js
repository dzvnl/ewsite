import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, onValue, set, onDisconnect } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

const messagesRef = ref(db, 'folk_messages'); 
const alertsRef = ref(db, 'folk_alerts'); // New Alert Channel

// Username Logic
let username = localStorage.getItem('username');
if (!username) {
    username = prompt("Enter folk name:") || "Anonymous";
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

// --- NEW: CALL LOGIC ---
const callBtn = document.getElementById('call-all-btn');
if (callBtn) {
    callBtn.addEventListener('click', () => {
        // Generate a random room ID
        const roomId = 'ROOM_' + Math.floor(Math.random() * 10000);
        
        // 1. Send Alert to everyone
        push(alertsRef, {
            type: 'CALL_INVITE',
            from: username,
            roomId: roomId,
            timestamp: Date.now()
        });

        // 2. Join immediately
        window.location.href = `folk_call.html?room=${roomId}`;
    });
}

// Listen for Call Alerts
onChildAdded(alertsRef, (snapshot) => {
    const data = snapshot.val();
    
    // Only show alerts created in the last 10 seconds (ignore old history)
    if (Date.now() - data.timestamp < 10000 && data.from !== username) {
        const modal = document.getElementById('call-modal');
        const callerName = document.getElementById('caller-name');
        const acceptBtn = document.getElementById('accept-btn');

        callerName.innerText = `INCOMING SIGNAL: ${data.from}`;
        modal.style.display = 'block';

        // Play a small notification sound (optional)
        try {
            const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3');
            audio.play();
        } catch(e) {}

        acceptBtn.onclick = () => {
            window.location.href = `folk_call.html?room=${data.roomId}`;
        };
    }
});

// --- SENDING MESSAGES ---
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
const sendBtn = document.getElementById('send-btn');
if (sendBtn) sendBtn.addEventListener('click', sendMessage);

document.getElementById('msg-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') sendMessage();
});

window.sendImage = function(base64Data) {
    push(messagesRef, {
        user: username, image: base64Data, timestamp: Date.now(), type: 'image',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`
    });
}

// --- RECEIVING MESSAGES ---
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
    contentDiv.innerHTML = `<div class="msg-username">${data.user}</div>`;

    const textDiv = document.createElement('div');
    textDiv.className = "msg-text";

    if (data.type === 'image') {
        const img = document.createElement('img');
        img.src = data.image;
        img.style.maxWidth = "100%";
        img.style.borderRadius = "8px";
        textDiv.appendChild(img);
    } else {
        textDiv.innerText = data.text;
    }
    contentDiv.appendChild(textDiv);
    msgDiv.appendChild(avatarImg);
    msgDiv.appendChild(contentDiv);
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
});
