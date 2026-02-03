// Firestore-backed groups implementation with security improvements
import { auth, db } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Input validation
function validateGroupName(name) {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    return trimmed.length >= 2 && trimmed.length <= 100;
}

// Sanitize group name (prevent XSS)
function sanitizeGroupName(name) {
    return String(name).trim().slice(0, 100);
}

// Create a new group
export async function createGroup() {
    const user = auth.currentUser;
    if (!user) {
        alert('You must be logged in to create a group');
        return;
    }

    const name = prompt('Enter group name (2-100 characters):');
    if (!name) return;

    if (!validateGroupName(name)) {
        alert('Group name must be between 2 and 100 characters');
        return;
    }

    try {
        const sanitizedName = sanitizeGroupName(name);
        await addDoc(collection(db, 'groups'), {
            name: sanitizedName,
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            members: [user.uid],
            maxSize: 10
        });
        alert('Group created!');
    } catch (err) {
        // Sanitize error message
        const errorMsg = err.code ? 'Error creating group. Please try again.' : err.message;
        alert(errorMsg);
    }
}

// Join a group
export async function joinGroup(groupId) {
    const user = auth.currentUser;
    if (!user) {
        alert('You must be logged in to join a group');
        return;
    }

    try {
        const docRef = doc(db, 'groups', groupId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            alert('Group not found');
            return;
        }

        const data = docSnap.data();
        if ((data.members || []).includes(user.uid)) {
            alert("You're already in this group!");
            return;
        }

        if ((data.members || []).length >= (data.maxSize || 10)) {
            alert('Group is full!');
            return;
        }

        await updateDoc(docRef, {
            members: arrayUnion(user.uid)
        });
        alert('Joined group!');
    } catch (err) {
        const errorMsg = err.code ? 'Error joining group. Please try again.' : err.message;
        alert(errorMsg);
    }
}

// Leave a group
export async function leaveGroup(groupId) {
    const user = auth.currentUser;
    if (!user) {
        alert('You must be logged in to leave a group');
        return;
    }

    try {
        const docRef = doc(db, 'groups', groupId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            alert('Group not found');
            return;
        }

        await updateDoc(docRef, {
            members: arrayRemove(user.uid)
        });

        // Remove group if empty
        const updated = await getDoc(docRef);
        const members = updated.exists() ? (updated.data().members || []) : [];
        if (members.length === 0) {
            await deleteDoc(docRef);
        }

        alert('Left group!');
    } catch (err) {
        const errorMsg = err.code ? 'Error leaving group. Please try again.' : err.message;
        alert(errorMsg);
    }
}

// Display all groups (real-time) with sanitized member display
export function showGroups() {
    const container = document.getElementById('groupsList');
    if (!container) return;
    
    container.innerHTML = '';

    const heading = document.createElement('h2');
    heading.textContent = 'All Groups';
    container.appendChild(heading);

    const groupsQuery = query(collection(db, 'groups'), orderBy('createdAt', 'desc'));
    
    onSnapshot(groupsQuery, (snapshot) => {
        container.innerHTML = '';
        container.appendChild(heading);

        if (snapshot.empty) {
            const p = document.createElement('p');
            p.textContent = 'No groups yet. Create one!';
            container.appendChild(p);
            return;
        }

        const table = document.createElement('table');
        table.style.border = '1px solid #ccc';
        table.style.borderCollapse = 'collapse';
        table.style.width = '100%';

        const headerRow = table.insertRow();
        ['Group', 'Members', 'Action'].forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            th.style.border = '1px solid #ccc';
            th.style.padding = '8px';
            headerRow.appendChild(th);
        });

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const row = table.insertRow();

            const cell1 = row.insertCell(0);
            cell1.textContent = `${sanitizeGroupName(data.name)} (${(data.members || []).length}/${data.maxSize || 10})`;
            cell1.style.border = '1px solid #ccc';
            cell1.style.padding = '8px';

            // Show member count instead of raw UIDs (privacy)
            const cell2 = row.insertCell(1);
            cell2.textContent = `${(data.members || []).length} member${(data.members || []).length !== 1 ? 's' : ''}`;
            cell2.style.border = '1px solid #ccc';
            cell2.style.padding = '8px';

            const cell3 = row.insertCell(2);
            cell3.style.border = '1px solid #ccc';
            cell3.style.padding = '8px';

            const button = document.createElement('button');
            const currentUser = auth.currentUser;
            const isMember = currentUser && (data.members || []).includes(currentUser.uid);
            
            if (isMember) {
                button.textContent = 'Leave';
                button.addEventListener('click', () => leaveGroup(docSnap.id));
            } else {
                button.textContent = 'Join';
                button.addEventListener('click', () => joinGroup(docSnap.id));
            }
            cell3.appendChild(button);
        });

        container.appendChild(table);
    }, err => {
        const p = document.createElement('p');
        p.textContent = 'Error loading groups. Please try again.';
        container.appendChild(p);
    });
}

// Wire up buttons and initial auth check
document.addEventListener('DOMContentLoaded', () => {
    // Buttons (added IDs in HTML)
    const createBtn = document.getElementById('createGroupBtn');
    const refreshBtn = document.getElementById('refreshGroupsBtn');
    const backBtn = document.getElementById('backHomeBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (createBtn) createBtn.addEventListener('click', createGroup);
    if (refreshBtn) refreshBtn.addEventListener('click', showGroups);
    if (backBtn) backBtn.addEventListener('click', () => window.location.href = 'homepage.html');
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => window.location.href = 'index.html');
    });

    // Ensure user is logged in before showing groups
    const user = auth.currentUser;
    if (!user) {
        // If auth state not ready yet, wait for it
        onAuthStateChanged(auth, (u) => {
            if (!u) {
                alert('Please login first!');
                window.location.href = 'index.html';
            } else {
                showGroups();
            }
        });
    } else {
        showGroups();
    }
});

// Export functions to global scope in case other scripts call them
window.createGroup = createGroup;
window.joinGroup = joinGroup;
window.leaveGroup = leaveGroup;
window.showGroups = showGroups;