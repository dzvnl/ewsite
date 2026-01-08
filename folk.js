// folk.js

// 1. Import Firebase (Use the same versions as your main chat)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, onValue, set, onDisconnect } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 2. Your Firebase Config (Copy this exactly from your chat.js)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// 3. Initialize
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// -------------------------------------------------------------
// CRITICAL: This is what separates "Folk" from "Chat".
// Instead of ref(db, 'messages'), we use ref(db, 'folk_messages')
// -------------------------------------------------------------
const messagesRef = ref(db, 'folk_messages'); 

// Check for username
let username = localStorage.getItem('username');
if (!username) {
    username = prompt("Enter folk name:") || "Anonymous";
    localStorage.setItem('username', username);
}
document.getElementById('display-name').innerText = username;

// --- Handle Online Count (Optional: use separate count for folk) ---
const presenceRef = ref(db, 'folk_presence'); // Separate presence list
const userStatusRef = ref(db, `folk_presence/${Date.now()}`);
set(userStatusRef, username);
onDisconnect(userStatusRef).remove();

onValue(presenceRef, (snapshot) => {
    const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    document.getElementById('user-count').innerText = count;
});

// --- Sending Messages ---
window.send = function() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    
    if (text !== "") {
        push(messagesRef, {
            user: username,
            text: text,
            timestamp: Date.now(),
            type: 'text',
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}` // Generates consistent avatar
        });
        input.value = "";
    }
}

// --- Sending Images ---
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

    // Create Avatar
    const avatarImg = document.createElement('img');
    avatarImg.src = data.avatar || "default.png";
    avatarImg.className = "msg-avatar";

    // Create Content Wrapper
    const contentDiv = document.createElement('div');
    contentDiv.className = "message-content";

    // Username
    const nameSpan = document.createElement('div');
    nameSpan.className = "msg-username";
    nameSpan.innerText = data.user;

    // Message Text or Image
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

    // Assemble
    contentDiv.appendChild(nameSpan);
    contentDiv.appendChild(textDiv);
    msgDiv.appendChild(avatarImg);
    msgDiv.appendChild(contentDiv);

    chatBox.appendChild(msgDiv);
    
    // Auto scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
});

// Allow Enter key to send
document.getElementById('msg-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') window.send();
});