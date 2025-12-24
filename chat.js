/* * GLOBAL_NET CHAT LOGIC (FIXED)
 * Target: chat.html
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set, onDisconnect } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

console.log("Chat Script: Loading...");

// --- FIREBASE CONFIGURATION ---
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

// --- STATE ---
const ADMINS = ['root', 'fb67'];
const currentUser = localStorage.getItem('username') || 'Guest-' + Math.floor(Math.random()*1000);
const isAdmin = ADMINS.includes(currentUser);

// Map to your HTML IDs
const dom = {
    messages: document.getElementById('chat-messages'),
    input: document.getElementById('msg-input'),
    count: document.getElementById('user-count'),
    userDisplay: document.getElementById('display-name')
};

// Set User Display Name in Menu
if(dom.userDisplay) dom.userDisplay.innerText = currentUser;

// --- CSS INJECTION (For Message Styling) ---
const style = document.createElement('style');
style.textContent = `
    .msg { margin-bottom: 8px; line-height: 1.2; word-wrap: break-word; }
    .msg-meta { font-size: 0.8rem; color: #bbb; margin-right: 6px; }
    .msg-user { color: #facc15; font-weight: bold; cursor: pointer; text-shadow: 1px 1px 1px black; }
    .msg-user.admin { color: #ef4444; }
    .msg-text { color: #fff; text-shadow: 1px 1px 1px black; }
    .admin-action { color: #ef4444; cursor: pointer; font-size: 0.7rem; margin-left: 5px; opacity: 0.8; background:black; padding:0 2px; }
    .admin-action:hover { opacity: 1; text-decoration: underline; }
`;
document.head.appendChild(style);

// --- 1. MESSAGING LOGIC ---

const messagesRef = ref(db, 'messages');

onValue(messagesRef, (snapshot) => {
    const data = snapshot.val();
    dom.messages.innerHTML = ''; 
    
    if (!data) {
        dom.messages.innerHTML = '<div style="opacity:0.7; text-align:center; color:#ccc;">No signal...</div>';
        return;
    }

    const msgList = Object.keys(data).map(key => ({ ...data[key], id: key }));
    msgList.sort((a, b) => a.time - b.time);

    msgList.forEach(msg => {
        const el = document.createElement('div');
        el.className = 'msg';
        
        let adminControls = '';
        if (isAdmin) {
            adminControls = `<span class="admin-action delete-btn" data-id="${msg.id}">[DEL]</span>`;
        }

        const time = new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const userClass = ADMINS.includes(msg.user) ? 'msg-user admin' : 'msg-user';

        el.innerHTML = `
            <span class="msg-meta">${time}</span>
            <span class="${userClass}">${escapeHtml(msg.user)}:</span>
            <span class="msg-text">${escapeHtml(msg.text)}</span>
            ${adminControls}
        `;
        dom.messages.appendChild(el);
    });

    dom.messages.scrollTop = dom.messages.scrollHeight;
}, (error) => {
    console.error(error);
});

// --- 2. SENDING MESSAGES ---

window.send = async function() {
    const text = dom.input.value.trim();
    if (!text) return;

    try {
        await push(messagesRef, {
            user: currentUser,
            text: text.substring(0, 300),
            time: Date.now()
        });
        dom.input.value = '';
        dom.input.focus();
    } catch (e) {
        console.error("Send failed:", e);
        alert("Error sending message.");
    }
};

dom.input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') window.send();
});

// --- 3. USER COUNTER ---

const connectionsRef = ref(db, 'connections');
const connectedRef = ref(db, '.info/connected');

onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
        const con = push(connectionsRef);
        onDisconnect(con).remove();
        set(con, { user: currentUser, time: Date.now() });
    }
});

onValue(connectionsRef, (snap) => {
    dom.count.innerText = snap.size || 0;
});

// --- 4. ADMIN ACTIONS ---

dom.messages.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn') && isAdmin) {
        if(confirm('Delete transmission?')) {
            const id = e.target.getAttribute('data-id');
            remove(ref(db, `messages/${id}`));
        }
    }
});

function escapeHtml(text) {
    if (!text) return text;
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}