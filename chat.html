/* * CHAT WIDGET 2.1 (FIREBASE REALTIME EDITION)
 * Connected to: ewsitechat
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set, get } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

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

// --- CONFIGURATION & STATE ---
const ADMINS = ['root', 'fb67'];
let messages = []; // Will be synced with DB
let mutedUsers = []; // Will be synced with DB
let replyingTo = null; 
let isFullscreen = false;
let isMinimized = true;

// Get current user from your site's Login logic
const currentUser = localStorage.getItem('username') || 'Guest-' + Math.floor(Math.random()*1000);
const isAdmin = ADMINS.includes(currentUser);

// --- DOM STYLES (CSS) ---
const style = document.createElement('style');
style.textContent = `
    #chat-widget-btn {
        position: fixed; bottom: 20px; left: 20px; z-index: 9999;
        background: #000; border: 1px solid #facc15; color: #facc15;
        padding: 8px 12px; font-family: 'VT323', monospace; font-size: 1.25rem;
        cursor: pointer; box-shadow: 2px 2px 0px #969696;
    }
    #chat-window {
        position: fixed; top: 20%; left: 20%; width: 350px; height: 400px;
        background: rgba(0, 0, 0, 0.95); border: 2px solid #969696;
        z-index: 10000; display: none; flex-direction: column;
        resize: both; overflow: hidden; min-width: 250px; min-height: 200px;
        box-shadow: 4px 4px 10px rgba(0,0,0,0.5);
    }
    #chat-window.fullscreen {
        top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important;
        resize: none;
    }
    #chat-header {
        background: #1a1a1a; padding: 4px 8px; cursor: grab;
        display: flex; justify-content: space-between; align-items: center;
        border-bottom: 1px solid #969696; color: #e5e5e5; user-select: none;
        font-family: 'VT323', monospace;
    }
    #chat-header:active { cursor: grabbing; }
    .window-controls button {
        background: none; border: none; color: #facc15; font-family: 'VT323';
        font-size: 1.2rem; cursor: pointer; margin-left: 5px;
    }
    .window-controls button:hover { color: #fff; }
    #chat-body {
        flex-grow: 1; overflow-y: auto; padding: 10px;
        font-family: 'VT323', monospace; font-size: 1.1rem;
        display: flex; flex-direction: column; gap: 8px;
    }
    .msg { word-wrap: break-word; line-height: 1.2; position: relative; }
    .msg:hover .admin-controls { display: inline-block; }
    .msg-meta { font-size: 0.8rem; color: #666; margin-right: 4px; }
    .msg-user { color: #facc15; cursor: pointer; }
    .msg-user.admin { color: #ef4444; font-weight: bold; }
    .msg-text { color: #d4d4d4; }
    .msg-reply-context {
        border-left: 2px solid #555; padding-left: 5px; margin-bottom: 2px;
        font-size: 0.8rem; color: #888; font-style: italic; display: block;
    }
    .admin-action {
        color: #ef4444; cursor: pointer; font-size: 0.8rem; margin-left: 5px; 
        font-weight: bold; text-decoration: none;
    }
    .admin-action:hover { text-decoration: underline; color: #ff0000; }
    #chat-footer {
        padding: 8px; border-top: 1px dotted #555; background: #000;
    }
    #reply-indicator {
        font-size: 0.9rem; color: #facc15; margin-bottom: 4px; display: none;
        justify-content: space-between; align-items: center; font-family: 'VT323', monospace;
    }
    .chat-input-row { display: flex; gap: 5px; }
    #chat-input {
        flex-grow: 1; background: #111; border: 1px solid #555; color: #fff;
        font-family: 'VT323'; font-size: 1.1rem; padding: 4px;
    }
    #chat-send {
        background: #facc15; border: 1px solid #facc15; color: #000;
        font-family: 'VT323'; cursor: pointer; padding: 0 10px; font-weight: bold;
    }
    /* Scrollbar styling for that retro feel */
    #chat-body::-webkit-scrollbar { width: 8px; }
    #chat-body::-webkit-scrollbar-track { background: #000; }
    #chat-body::-webkit-scrollbar-thumb { background: #333; border: 1px solid #555; }
`;
document.head.appendChild(style);

// --- DOM ELEMENTS CREATION ---
const btn = document.createElement('div');
btn.id = 'chat-widget-btn';
btn.innerHTML = '>> CHAT ONLINE';

const windowEl = document.createElement('div');
windowEl.id = 'chat-window';
windowEl.innerHTML = `
    <div id="chat-header">
        <span id="chat-title">:: GLOBAL_NET ::</span>
        <div class="window-controls">
            <button id="chat-min">_</button>
            <button id="chat-full">[]</button>
            <button id="chat-close">X</button>
        </div>
    </div>
    <div id="chat-body">
        <div style="color:#666; text-align:center; margin-top:20px;">Connecting to server...</div>
    </div>
    <div id="chat-footer">
        <div id="reply-indicator">
            <span id="reply-text">Replying...</span>
            <button id="cancel-reply" style="background:none;border:none;color:red;cursor:pointer;">[x]</button>
        </div>
        <div class="chat-input-row">
            <input type="text" id="chat-input" placeholder="Type message..." autocomplete="off">
            <button id="chat-send">SEND</button>
        </div>
    </div>
`;

document.body.appendChild(btn);
document.body.appendChild(windowEl);

const chatBody = document.getElementById('chat-body');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('chat-send');
const cancelReplyBtn = document.getElementById('cancel-reply');

// --- FIREBASE LOGIC ---

// 1. Listen for Messages
const messagesRef = ref(db, 'messages');
onValue(messagesRef, (snapshot) => {
    const data = snapshot.val();
    messages = [];
    if (data) {
        // Convert object to array and sort
        Object.keys(data).forEach(key => {
            messages.push({ ...data[key], id: key });
        });
        // Sort by timestamp (oldest first)
        messages.sort((a, b) => a.time - b.time);
    }
    render();
});

// 2. Listen for Muted Users
const mutedRef = ref(db, 'muted');
onValue(mutedRef, (snapshot) => {
    const data = snapshot.val();
    mutedUsers = data ? Object.keys(data) : [];
    // If current user just got muted, alert them
    if (mutedUsers.includes(currentUser) && document.activeElement === chatInput) {
        chatInput.blur();
        alert("You have been muted by an administrator.");
    }
});

// 3. Render Function
function render() {
    chatBody.innerHTML = '';
    
    if (messages.length === 0) {
        chatBody.innerHTML = '<div style="color:#444; text-align:center; margin-top:20px;">No messages yet.</div>';
        return;
    }

    messages.forEach(msg => {
        // Don't render messages from muted users (unless you are Admin)
        if (mutedUsers.includes(msg.user) && !isAdmin) return;

        const el = document.createElement('div');
        el.className = 'msg';
        
        // Handle Reply display
        let replyHTML = '';
        if (msg.replyTo) {
            const parentMsg = messages.find(m => m.id === msg.replyTo);
            const parentText = parentMsg ? parentMsg.text.substring(0, 20) + (parentMsg.text.length>20?'...':'') : '[Message Deleted]';
            const parentUser = parentMsg ? parentMsg.user : '?';
            replyHTML = `<span class="msg-reply-context">Ref: @${parentUser} "${parentText}"</span>`;
        }

        // Admin Actions
        let adminControls = '';
        if (isAdmin) {
            adminControls = `
                <span class="admin-action delete-btn" data-id="${msg.id}">[DEL]</span>
                ${!ADMINS.includes(msg.user) ? `<span class="admin-action mute-btn" data-user="${msg.user}">[MUTE]</span>` : ''}
            `;
        }

        const time = new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const userClass = ADMINS.includes(msg.user) ? 'msg-user admin' : 'msg-user';

        el.innerHTML = `
            ${replyHTML}
            <span class="msg-meta">[${time}]</span>
            <span class="${userClass} reply-trigger" data-id="${msg.id}" data-user="${msg.user}">${msg.user}:</span>
            <span class="msg-text">${escapeHtml(msg.text)}</span>
            ${adminControls}
        `;
        chatBody.appendChild(el);
    });
    chatBody.scrollTop = chatBody.scrollHeight;
}

// Security: Prevent HTML injection
function escapeHtml(text) {
    if (!text) return text;
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// --- ACTIONS ---

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    // Check if muted locally first to save a network request
    if (mutedUsers.includes(currentUser)) {
        alert("You are muted.");
        chatInput.value = '';
        return;
    }

    // Push to Firebase
    try {
        await push(messagesRef, {
            user: currentUser,
            text: text.substring(0, 300), // Limit length
            time: Date.now(),
            replyTo: replyingTo ? replyingTo.id : null
        });
        
        chatInput.value = '';
        cancelReply();
    } catch (e) {
        console.error("Send error:", e);
        alert("Error sending message. Check console.");
    }
}

// Helper to handle clicks globally within chat body (for dynamic elements)
chatBody.addEventListener('click', (e) => {
    // Reply Click
    if (e.target.classList.contains('reply-trigger')) {
        const id = e.target.getAttribute('data-id');
        const user = e.target.getAttribute('data-user');
        startReply(id, user);
    }
    
    // Admin Delete
    if (e.target.classList.contains('delete-btn')) {
        if (!isAdmin) return;
        if(confirm('Delete this message?')) {
            const id = e.target.getAttribute('data-id');
            remove(ref(db, `messages/${id}`));
        }
    }
    
    // Admin Mute
    if (e.target.classList.contains('mute-btn')) {
        if (!isAdmin) return;
        const userToMute = e.target.getAttribute('data-user');
        if (confirm(`Mute user ${userToMute}?`)) {
            // Set user as true in muted node
            set(ref(db, `muted/${userToMute}`), true);
        }
    }
});

function startReply(id, user) {
    replyingTo = { id, user };
    document.getElementById('reply-text').innerText = `Replying to @${user}`;
    document.getElementById('reply-indicator').style.display = 'flex';
    chatInput.focus();
}

function cancelReply() {
    replyingTo = null;
    document.getElementById('reply-indicator').style.display = 'none';
}

cancelReplyBtn.addEventListener('click', cancelReply);

// --- WINDOW CONTROLS & DRAG ---

btn.addEventListener('click', () => {
    isMinimized = false;
    windowEl.style.display = 'flex';
    btn.style.display = 'none';
    chatBody.scrollTop = chatBody.scrollHeight; // Scroll to bottom on open
});

document.getElementById('chat-min').addEventListener('click', () => {
    isMinimized = true;
    windowEl.style.display = 'none';
    btn.style.display = 'block';
});

document.getElementById('chat-close').addEventListener('click', () => {
    isMinimized = true;
    windowEl.style.display = 'none';
    btn.style.display = 'block';
});

document.getElementById('chat-full').addEventListener('click', () => {
    isFullscreen = !isFullscreen;
    windowEl.classList.toggle('fullscreen', isFullscreen);
});

// Input handling
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
sendBtn.addEventListener('click', sendMessage);

// Draggable Logic
const header = document.getElementById('chat-header');
let isDragging = false;
let startX, startY, initialLeft, initialTop;

header.addEventListener('mousedown', (e) => {
    if(e.target.tagName === 'BUTTON' || isFullscreen) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = windowEl.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    header.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    windowEl.style.left = `${initialLeft + dx}px`;
    windowEl.style.top = `${initialTop + dy}px`;
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    header.style.cursor = 'grab';
});
