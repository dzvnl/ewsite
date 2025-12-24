/* * GLOBAL_NET CHAT LOGIC (STABLE v9.23)
 * Target: chat.html
 */

// We use v9.23.0 which is highly stable for CDN usage
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set, onDisconnect } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

console.log("System: Initializing Global_Net...");

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- VARIABLES ---
const ADMINS = ['root', 'fb67'];
const currentUser = localStorage.getItem('username') || 'Guest-' + Math.floor(Math.random()*1000);
const isAdmin = ADMINS.includes(currentUser);

// DOM Elements
const dom = {
    messages: document.getElementById('chat-messages'),
    input: document.getElementById('msg-input'),
    count: document.getElementById('user-count'),
    userDisplay: document.getElementById('display-name'),
    sendBtn: document.querySelector('#chat-input-area button') // Grab the button explicitly
};

// Set UI Name
if(dom.userDisplay) dom.userDisplay.innerText = currentUser;

// --- CSS STYLES (Dynamic) ---
const style = document.createElement('style');
style.textContent = `
    .msg { margin-bottom: 8px; line-height: 1.2; word-wrap: break-word; }
    .msg-meta { font-size: 0.8rem; color: #ddd; margin-right: 6px; }
    .msg-user { color: #facc15; font-weight: bold; cursor: pointer; text-shadow: 1px 1px 2px black; }
    .msg-user.admin { color: #ef4444; }
    .msg-text { color: #fff; text-shadow: 1px 1px 2px black; }
    .admin-action { color: #ef4444; cursor: pointer; font-size: 0.7rem; margin-left: 5px; background: rgba(0,0,0,0.5); padding: 0 4px; }
`;
document.head.appendChild(style);


// --- 1. SENDING FUNCTION ---

// Defined as a standalone function first
async function sendMessage() {
    console.log("Action: Attempting send..."); // Debug Log
    const text = dom.input.value.trim();
    
    if (!text) {
        console.log("Action Aborted: Empty text");
        return;
    }

    try {
        const messagesRef = ref(db, 'messages');
        await push(messagesRef, {
            user: currentUser,
            text: text.substring(0, 300),
            time: Date.now()
        });
        
        console.log("Success: Message sent.");
        dom.input.value = '';
        dom.input.focus();
    } catch (e) {
        console.error("FIREBASE ERROR:", e);
        alert("Transmission Failed: " + e.message);
    }
}

// Attach to Window so HTML onclick works
window.send = sendMessage;

// Also attach listener to button directly (backup method)
if (dom.sendBtn) dom.sendBtn.addEventListener('click', sendMessage);

// Enter key support
dom.input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});


// --- 2. RECEIVING MESSAGES ---
const messagesRef = ref(db, 'messages');

onValue(messagesRef, (snapshot) => {
    console.log("Network: Data received"); // Debug Log
    const data = snapshot.val();
    dom.messages.innerHTML = ''; 
    
    if (!data) {
        dom.messages.innerHTML = '<div style="opacity:0.7; text-align:center; color:#ccc; margin-top:20px;">Signal Empty...</div>';
        return;
    }

    // Convert object to array
    const msgList = Object.keys(data).map(key => ({ ...data[key], id: key }));
    // Sort by time
    msgList.sort((a, b) => a.time - b.time);

    msgList.forEach(msg => {
        const el = document.createElement('div');
        el.className = 'msg';
        
        let adminControls = '';
        if (isAdmin) {
            adminControls = `<span class="admin-action delete-btn" data-id="${msg.id}">DEL</span>`;
        }

        const time = new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        el.innerHTML = `
            <span class="msg-meta">${time}</span>
            <span class="msg-user ${ADMINS.includes(msg.user) ? 'admin' : ''}">${escapeHtml(msg.user)}:</span>
            <span class="msg-text">${escapeHtml(msg.text)}</span>
            ${adminControls}
        `;
        dom.messages.appendChild(el);
    });

    // Scroll to bottom
    dom.messages.scrollTop = dom.messages.scrollHeight;
}, (error) => {
    console.error("Read Error:", error);
    dom.messages.innerHTML = `<div style="color:red">CONNECTION ERROR: ${error.message}</div>`;
});


// --- 3. PRESENCE (USER COUNT) ---
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


// --- 4. ADMIN TOOLS ---
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