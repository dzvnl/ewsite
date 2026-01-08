/*
 * Target: chat.js
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set, onDisconnect } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

console.log("chat loaded.");

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

// Default avatar if none is set
const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

const dom = {
    messages: document.getElementById('chat-messages'),
    input: document.getElementById('msg-input'),
    count: document.getElementById('user-count'),
    userDisplay: document.getElementById('display-name')
};

if(dom.userDisplay) dom.userDisplay.innerText = currentUser;

// --- 1. SEND LOGIC (TEXT) ---

async function sendMessage() {
    const text = dom.input.value.trim();
    if (!text) return; 

    const userColor = localStorage.getItem('user_color') || '#facc15';
    // Retrieve profile pic from settings (if it exists), otherwise null
    const userAvatar = localStorage.getItem('profile_pic') || null;
    
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
            avatar: userAvatar, // SEND AVATAR
            time: Date.now()
        });
    } catch (e) {
        console.error("Send Error:", e);
        dom.input.value = textToSend; 
    }
}

// --- 1.5 SEND LOGIC (IMAGE MESSAGE) ---
window.sendImage = async function(imageBase64) {
    const userColor = localStorage.getItem('user_color') || '#facc15';
    const userAvatar = localStorage.getItem('profile_pic') || null;

    try {
        await push(ref(db, 'messages'), {
            user: localStorage.getItem('username') || 'Guest',
            uuid: currentUuid,
            text: '', 
            image: imageBase64, 
            color: userColor,
            avatar: userAvatar, // SEND AVATAR
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
        // This class matches the CSS in your HTML file
        el.className = 'message-row'; 
        
        let adminControls = '';
        if (isAdmin) {
            // Added simple styling inline for delete button to match theme
            adminControls = `<span class="admin-action delete-btn" data-id="${msg.id}" style="color:red; cursor:pointer; font-size:0.7em; margin-left:5px;">[DEL]</span>`;
        }

        const time = new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const nameColor = msg.color || '#facc15';
        
        // Determine Avatar URL (Use message avatar, or default if missing)
        const avatarUrl = msg.avatar || DEFAULT_AVATAR;

        // Content: Image or Text?
        let contentHtml = '';
        if (msg.image) {
            contentHtml = `<img src="${msg.image}" style="max-width: 200px; border-radius: 4px; border: 1px solid #555; margin-top:5px;">`;
        } else {
            contentHtml = `<span class="msg-text">${escapeHtml(msg.text)}</span>`;
        }

        // New HTML Structure: Avatar on left, Content on right
        el.innerHTML = `
            <img src="${avatarUrl}" class="msg-avatar" alt="pic">
            
            <div class="message-content">
                <div>
                    <span class="msg-username ${ADMINS.includes(msg.user) ? 'admin' : ''}" style="color: ${nameColor}">
                        ${escapeHtml(msg.user)}
                    </span>
                    <span style="font-size: 0.7rem; color: #666; margin-left: 5px;">${time}</span>
                    ${adminControls}
                </div>
                ${contentHtml}
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
        if(confirm('Delete this message?')) {
            const id = e.target.getAttribute('data-id');
            remove(ref(db, `messages/${id}`));
        }
    }
});

function escapeHtml(text) {
    if (!text) return text;
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
