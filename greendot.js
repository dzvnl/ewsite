import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getDatabase, ref, push, onValue, onDisconnect, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

const firebaseConfig = { /* USE YOUR SAME CONFIG HERE */ };

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const username = localStorage.getItem('username');

// --- ACCOUNT LOGIC ---
const userDisplay = document.getElementById('user-display');
if (username) {
    userDisplay.innerText = `[ ${username.toUpperCase()} ]`;
} else {
    userDisplay.innerText = '[ LOG IN ]';
    userDisplay.onclick = () => window.location.href = 'login.html';
}

// --- ONLINE COUNTER (The Green Dot Logic) ---
const presenceRef = ref(db, 'presence/' + (username || 'guest-' + Math.random().toString(36).substr(2, 5)));
set(presenceRef, true);
onDisconnect(presenceRef).remove();

onValue(ref(db, 'presence'), (snapshot) => {
    const count = snapshot.size || 0;
    document.getElementById('user-count').innerText = `${count.toString().padStart(2, '0')} ONLINE`;
});

// --- CHAT ACTIONS ---
const msgInput = document.getElementById('msg-input');
const chatMessages = document.getElementById('chat-messages');

onValue(ref(db, 'messages'), (snapshot) => {
    chatMessages.innerHTML = '';
    const data = snapshot.val();
    if (data) {
        Object.values(data).forEach(msg => {
            const p = document.createElement('p');
            p.innerHTML = `<span style="color: #facc15;">${msg.user}:</span> ${msg.text}`;
            chatMessages.appendChild(p);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

window.send = function() {
    const text = msgInput.value.trim();
    if (text && username) {
        push(ref(db, 'messages'), {
            user: username,
            text: text,
            timestamp: serverTimestamp()
        });
        msgInput.value = '';
    } else if (!username) {
        alert("Please log in to chat.");
    }
};

msgInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') window.send(); });
