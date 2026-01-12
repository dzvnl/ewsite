/* REPLACE THE CONNECTION SECTION AT THE BOTTOM OF CHAT.JS 
   WITH THIS BLOCK 
*/

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
        // If no timestamp exists or it's older than 4 hours, kill it
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

// 3. Listen for count changes & trigger cleanup
onValue(connectionsRef, (snap) => {
    const data = snap.val();
    
    // Update the visual count
    dom.count.innerText = snap.size || 0;

    // Run cleanup occasionally (when data changes)
    if (data) cleanStaleConnections(data);
});
