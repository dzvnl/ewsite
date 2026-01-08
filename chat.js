/*
 * Target: chat.js
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set, onDisconnect } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

console.log("go away.");

// --- FIREBASE CONFIG ---
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
const ADMINS = ['root', 'futtbucker67', 'w234'];
const currentUser = localStorage.getItem('username') || 'no name';
const currentUuid = localStorage.getItem('account_uuid'); 
const isAdmin = ADMINS.includes(currentUser);

const dom = {
    messages: document.getElementById('chat-messages'),
    input: document.getElementById('msg-input'),
    count: document.getElementById('user-count'),
    userDisplay: document.getElementById('display-name')
};

if(dom.userDisplay) dom.userDisplay.innerText = currentUser;

// --- CSS INJECTION ---
const style = document.createElement('style');
style.textContent = `
    .msg { margin-bottom: 8px; line-height: 1.2; word-wrap: break-word; display: flex; align-items: flex-start; }
    .msg-content { flex: 1; }
    .msg-meta { font-size: 0.75rem; color: #666; margin-right: 8px; vertical-align: bottom; }
    .msg-user { font-weight: bold; cursor: pointer; text-shadow: 1px 1px 2px black; margin-right: 5px;}
    .msg-user.admin { color: #ef4444 !important; }
    .msg-text { color: #fff; text-shadow: 1px 1px 2px black; }
    .chat-image { max-width: 250px; max-height: 250px; border-radius: 4px; margin-top: 5px; border: 1px solid #444; display: block; }
    .admin-action { color: #ef4444; cursor: pointer; font-size: 0.7rem; margin-left: 5px; background:rgba(0,0,0,0.5); padding: 0 4px; }
`;
document.head.appendChild(style);

// --- 1. SEND LOGIC (TEXT) ---

async function sendMessage() {
    const text = dom.input.value.trim();
    if (!text) return; 

    const userColor = localStorage.getItem('user_color') || '#facc15';
    
    // Clear input immediately
    const textToSend = text; 
    dom.input.value = '';
    dom.input.focus();

    try {
        await push(ref(db, 'messages'), {
            user: localStorage.getItem('username') || 'Guest',
            uuid: currentUuid,
            text: textToSend.substring(0, 300),
            color: userColor,
            time: Date.now()
        });
    } catch (e) {
        console.error("Send Error:", e);
        dom.input.value = textToSend; 
    }
}

// --- 1.5 SEND LOGIC (IMAGE) ---
// This function is called by your HTML file when a file is selected
window.sendImage = async function(imageBase64) {
    const userColor = localStorage.getItem('user_color') || '#facc15';

    try {
        await push(ref(db, 'messages'), {
            user: localStorage.getItem('username') || 'Guest',
            uuid: currentUuid,
            text: '', // No text, just image
            image: imageBase64, // Save the image data
            color: userColor,
            time: Date.now()
        });
    } catch (e) {
        console.error("Image Send Error:", e);
        alert("Failed to send image (file might be too large)");
    }
};

window.send = sendMessage;

dom.input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// --- 2. RECEIVE LOGIC ---

onValue(ref(db, 'messages'), (snapshot) => {
    const data = snapshot.val();
    dom.messages.innerHTML = ''; 
    
    if (!data) {
        dom.messages.innerHTML = '<div style="opacity:0.6; text-align:center; color:#ccc; margin-top:20px;">dead...</div>';
        return;
    }

    const msgList = Object.keys(data).map(key => ({ ...data[key], id: key }));
    msgList.sort((a, b) => a.time - b.time);

    msgList.forEach(msg => {
        const el = document.createElement('div');
        el.className = 'msg';
        
        let adminControls = '';
        if (isAdmin) {
            adminControls = `<span class="admin-action delete-btn" data-id="${msg.id}">DEL</span>`;
        }

        const time = new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const nameColor = msg.color || '#facc15';

        // Check if message has an image
        let contentHtml = '';
        if (msg.image) {
            contentHtml = `<img src="${msg.image}" class="chat-image">`;
        } else {
            contentHtml = `<span class="msg-text">${escapeHtml(msg.text)}</span>`;
        }

        el.innerHTML = `
            <div class="msg-content">
                <span class="msg-meta">${time}</span>
                <span class="msg-user ${ADMINS.includes(msg.user) ? 'admin' : ''}" style="color: ${nameColor}">${escapeHtml(msg.user)}:</span>
                ${contentHtml}
                ${adminControls}
            </div>
        `;
        dom.messages.appendChild(el);
    });

    dom.messages.scrollTop = dom.messages.scrollHeight;
});

// --- 3. PRESENCE ---

const connectionsRef = ref(db, 'connections');
const connectedRef = ref(db, '.info/connected');

onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
        const con = push(connectionsRef);
        onDisconnect(con).remove();
        set(con, { 
            user: currentUser, 
            time: Date.now() 
        });
    }
});

onValue(connectionsRef, (snap) => {
    dom.count.innerText = snap.size || 0;
});

// --- 4. ADMIN ---

dom.messages.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn') && isAdmin) {
        if(confirm('fr?')) {
            const id = e.target.getAttribute('data-id');
            remove(ref(db, `messages/${id}`));
        }
    }
});

function escapeHtml(text) {
    if (!text) return text;
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
