/*
 * Target: chat.js
 * Updated with Ban System & Debugging
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
// Added 'goOffline' to the imports to terminate connections
import { getDatabase, ref, push, onValue, remove, set, onDisconnect, goOffline } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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
// MAKE SURE YOUR USERNAME IS EXACTLY ONE OF THESE
const ADMINS = ['root', 'futtbucker67', 'w234']; 

const currentUser = localStorage.getItem('username') || 'no name';
const currentUuid = localStorage.getItem('account_uuid'); 
const isAdmin = ADMINS.includes(currentUser);

console.log("Current User:", currentUser);
console.log("Is Admin?", isAdmin);

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

// --- BAN ENFORCEMENT ---
onValue(ref(db, 'banned'), (snapshot) => {
    const bannedUsers = snapshot.val() || {};
    
    // Check if MY username is in the list
    if (bannedUsers[currentUser] === true) {
        console.warn("YOU HAVE BEEN BANNED.");
        
        // 1. Kill Firebase
        goOffline(db);
        
        // 2. Destroy UI
        document.body.innerHTML = `
            <div style="
                display:flex; justify-content:center; align-items:center; 
                height:100vh; background:black; color:red; 
                font-family:monospace; flex-direction:column; text-align:center;">
                <h1 style="font-size:4rem;">TERMINATED</h1>
                <p>User connection severed by administrator.</p>
            </div>
        `;
        alert("You are banned.");
    }
});

// --- SEND LOGIC ---
async function sendMessage() {
    const text = dom.input.value.trim();
    if (!text) return; 

    // --- ADMIN COMMANDS ---
    if (text.startsWith('/')) {
        console.log("Command detected:", text);
        
        const parts = text.split(' ');
        const command = parts[0].toLowerCase();
        const targetUser = parts.slice(1).join(' '); 

        if (command === '/ban') {
            if (!isAdmin) {
                alert("You are not an admin!");
                return;
            }
            if (!targetUser) {
                alert("Usage: /ban <username>");
                return;
            }
            
            // Execute Ban
            try {
                console.log(`Attempting to ban: ${targetUser}`);
                await set(ref(db, 'banned/' + targetUser), true);
                alert(`SUCCESS: ${targetUser} is banned.`);
                dom.input.value = ''; 
                return;
            } catch (err) {
                console.error("Ban Failed:", err);
                alert("Database Error: Check Console (F12)");
                return;
            }
        }

        if (command === '/unban') {
            if (!isAdmin) {
                alert("You are not an admin!");
                return;
            }
            if (!targetUser) {
                alert("Usage: /unban <username>");
                return;
            }

            // Execute Unban
            try {
                console.log(`Attempting to unban: ${targetUser}`);
                await remove(ref(db, 'banned/' + targetUser));
                alert(`SUCCESS: ${targetUser} is unbanned.`);
                dom.input.value = ''; 
                return;
            } catch (err) {
                console.error("Unban Failed:", err);
                alert("Database Error: Check Console (F12)");
                return;
            }
        }
    }

    // --- NORMAL MESSAGE SENDING ---
    const userColor = localStorage.getItem('user_color') || '#facc15';
    const userAvatar = myCurrentAvatar; 
    const textToSend = text; 
    
    dom.input.value = '';
    dom.input.focus();

    try {
        await push(ref(db, 'messages'), {
            user: localStorage.getItem('username') || 'Guest',
            uuid: currentUuid,
            text: textToSend.substring(0, 300),
            color: userColor,
            avatar: userAvatar,
            time: Date.now()
        });
    } catch (e) {
        console.error("Send Error:", e);
        dom.input.value = textToSend; 
    }
}

// --- IMAGE SENDING ---
window.sendImage = async function(imageBase64) {
    const userColor = localStorage.getItem('user_color') || '#facc15';
    const userAvatar = myCurrentAvatar;

    try {
        await push(ref(db, 'messages'), {
            user: localStorage.getItem('username') || 'Guest',
            uuid: currentUuid,
            text: '', 
            image: imageBase64, 
            color: userColor,
            avatar: userAvatar, 
            time: Date.now()
        });
    } catch (e) {
        console.error("Image Send Error:", e);
        alert("Failed to send image.");
    }
};

window.send = sendMessage;

dom.input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// --- RECEIVE LOGIC ---
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
        el.className = 'message-row'; 
        
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

// --- PRESENCE ---
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

// --- DELETE BTN ---
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
