/*
 * Target: chat.js
 * FIXED: Added Online User List generation for the GUI
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set, onDisconnect, goOffline, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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

console.log("Current User:", currentUser);

// Default avatar
const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
let myCurrentAvatar = null; 

// Fetch PFP
const myUserRef = ref(db, 'users/' + currentUser);
onValue(myUserRef, (snapshot) => {
    const data = snapshot.val();
    if (data && data.pfp) {
        myCurrentAvatar = data.pfp;
    }
});

const dom = {
    messages: document.getElementById('chat-messages'),
    input: document.getElementById('msg-input'),
    count: document.getElementById('user-count'),
    userDisplay: document.getElementById('display-name')
};

if(dom.userDisplay) dom.userDisplay.innerText = currentUser;

// --- UTILITY: ESCAPE HTML ---
function escapeHtml(text) {
    if (!text) return text;
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// --- UTILITY: DELETE LISTENER ---
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('delete-btn')) {
        const msgId = e.target.getAttribute('data-id');
        if (confirm('Delete this message?')) {
            remove(ref(db, `messages/${msgId}`));
        }
    }
});

// --- BAN ENFORCEMENT ---
onValue(ref(db, 'banned'), (snapshot) => {
    const bannedUsers = snapshot.val() || {};
    if (bannedUsers[currentUser] === true) {
        goOffline(db);
        document.body.innerHTML = `
            <div style="
                display:flex; justify-content:center; align-items:center; 
                height:100vh; background:black; color:red; 
                font-family:monospace; flex-direction:column; text-align:center;">
                <h1 style="font-size:4rem;">TERMINATED</h1>
                <p>User connection severed by administrator.</p>
            </div>
        `;
    }
});

// --- HELPER: DELETE MESSAGES OLDER THAN 24H ---
function cleanOldMessages(msgList) {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    if (!msgList || msgList.length === 0) return;

    msgList.forEach(msg => {
        if (now - msg.time > oneDayMs) {
            remove(ref(db, `messages/${msg.id}`)).catch(e => {}); 
        }
    });
}

// --- HELPER: FORMAT DATE ---
function getFormattedDate(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    } else {
        return date.toLocaleDateString();
    }
}

// --- SEND LOGIC ---
async function sendMessage() {
    const text = dom.input.value.trim();
    if (!text) return; 

    // Admin Commands
    if (text.startsWith('/')) {
        const parts = text.split(' ');
        const command = parts[0].toLowerCase();
        const targetUser = parts.slice(1).join(' '); 

        if ((command === '/ban' || command === '/unban') && isAdmin && targetUser) {
            const isBan = command === '/ban';
            try {
                if(isBan) await set(ref(db, 'banned/' + targetUser), true);
                else await remove(ref(db, 'banned/' + targetUser));
                dom.input.value = '';
                return;
            } catch (err) { console.error(err); return; }
        }
    }

    const userColor = localStorage.getItem('user_color') || '#facc15';
    const userAvatar = myCurrentAvatar; 
    
    dom.input.value = '';
    dom.input.focus();

    try {
        await push(ref(db, 'messages'), {
            user: localStorage.getItem('username') || 'Guest',
            uuid: currentUuid,
            text: text.substring(0, 300),
            color: userColor,
            avatar: userAvatar,
            time: Date.now()
        });
    } catch (e) { console.error("Send Error:", e); }
}

window.sendImage = async function(imageBase64) {
    const userColor = localStorage.getItem('user_color') || '#facc15';
    try {
        await push(ref(db, 'messages'), {
            user: localStorage.getItem('username') || 'Guest',
            uuid: currentUuid,
            text: '', 
            image: imageBase64, 
            color: userColor,
            avatar: myCurrentAvatar, 
            time: Date.now()
        });
    } catch (e) { alert("Failed to send image."); }
};

window.send = sendMessage;
dom.input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

// --- RECEIVE & RENDER LOGIC ---
onValue(ref(db, 'messages'), (snapshot) => {
    const data = snapshot.val();
    dom.messages.innerHTML = ''; 
    
    if (!data) {
        dom.messages.innerHTML = '<div style="opacity:0.6; text-align:center; color:#ccc; margin-top:20px;">quiet...</div>';
        return;
    }

    const msgList = Object.keys(data).map(key => ({ ...data[key], id: key }));
    msgList.sort((a, b) => a.time - b.time);

    // Run Auto-Cleanup
    cleanOldMessages(msgList);

    let lastUser = null;
    let lastDateStr = null;

    msgList.forEach(msg => {
        // --- Day Timestamp Logic ---
        const currentDateStr = getFormattedDate(msg.time);
        if (currentDateStr !== lastDateStr) {
            const dateDiv = document.createElement('div');
            dateDiv.className = 'date-separator';
            dateDiv.innerHTML = `<span>${currentDateStr}</span>`;
            dom.messages.appendChild(dateDiv);
            lastDateStr = currentDateStr;
            lastUser = null; // Reset grouping on new day
        }

        // --- Grouping Logic ---
        const isGrouped = (msg.user === lastUser);
        lastUser = msg.user;

        const el = document.createElement('div');
        el.className = `message-row ${isGrouped ? 'grouped' : ''}`; 
        
        // Admin Delete Button
        let adminControls = '';
        if (isAdmin) {
            adminControls = `<span class="admin-action delete-btn" data-id="${msg.id}" style="color:red; cursor:pointer; font-size:0.7em; margin-left:5px;">[DEL]</span>`;
        }

        const time = new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const nameColor = msg.color || '#facc15';
        const avatarUrl = msg.avatar || DEFAULT_AVATAR;

        let contentHtml = '';
        if (msg.image) {
            contentHtml = `<img src="${msg.image}" style="max-width: 200px; border-radius: 4px; border: 1px solid #555; margin-top:5px;">`;
        } else {
            contentHtml = `<span class="msg-text">${escapeHtml(msg.text)}</span>`;
        }

        el.innerHTML = `
            <img src="${avatarUrl}" class="msg-avatar" alt="pic">
            <div class="message-content">
                <div class="msg-header">
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

// --- CONNECTION TRACKING & CLEANUP ---
const connectionsRef = ref(db, 'connections');
const connectedRef = ref(db, '.info/connected');

// 1. Helper: Remove connections older than 4 hours (Ghost cleanup)
function cleanStaleConnections(data) {
    if (!data) return;
    const now = Date.now();
    const fourHoursMs = 4 * 60 * 60 * 1000;

    Object.keys(data).forEach(key => {
        const connection = data[key];
        if (!connection.time || (now - connection.time > fourHoursMs)) {
            remove(ref(db, `connections/${key}`)).catch(e => {});
        }
    });
}

// 2. Add myself when connected
onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
        const con = push(connectionsRef);
        onDisconnect(con).remove();
        set(con, { user: currentUser, time: Date.now() });
    }
});

// 3. Listen for count changes & users
onValue(connectionsRef, (snap) => {
    const data = snap.val() || {};
    
    // Extract Usernames
    const allUsers = Object.values(data).map(c => c.user || 'Unknown');
    
    // Filter to unique names (removes duplicates from multiple tabs)
    const uniqueUsers = [...new Set(allUsers)];
    
    // Update the visual count
    dom.count.innerText = uniqueUsers.length;

    // --- EXPOSE TO GLOBAL SCOPE FOR GUI ---
    // This allows the HTML modal to access the real user list
    window.onlineUsersList = uniqueUsers;

    // Run cleanup occasionally
    cleanStaleConnections(data);
});
