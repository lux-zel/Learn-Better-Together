// Firestore-backed groups implementation
const db = firebase.firestore();

// Utility: escape text when inserting into textContent (uses textContent so safe)

// Create a new group
async function createGroup() {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('You must be logged in to create a group');
        return;
    }

    const name = prompt('Enter group name:');
    if (!name) return;

    if (name.length < 2 || name.length > 100) {
        alert('Group name must be between 2 and 100 characters');
        return;
    }

    try {
        await db.collection('groups').add({
            name: name,
            createdBy: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            members: [user.uid],
            maxSize: 10
        });
        alert('Group created!');
    } catch (err) {
        alert('Error creating group: ' + err.message);
    }
}

// Join a group
async function joinGroup(groupId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('You must be logged in to join a group');
        return;
    }

    try {
        const docRef = db.collection('groups').doc(groupId);
        const doc = await docRef.get();
        if (!doc.exists) {
            alert('Group not found');
            return;
        }

        const data = doc.data();
        if (data.members.includes(user.uid)) {
            alert("You're already in this group!");
            return;
        }

        if (data.members.length >= data.maxSize) {
            alert('Group is full!');
            return;
        }

        await docRef.update({
            members: firebase.firestore.FieldValue.arrayUnion(user.uid)
        });
        alert('Joined group!');
    } catch (err) {
        alert('Error joining group: ' + err.message);
    }
}

// Leave a group
async function leaveGroup(groupId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('You must be logged in to leave a group');
        return;
    }

    try {
        const docRef = db.collection('groups').doc(groupId);
        const doc = await docRef.get();
        if (!doc.exists) {
            alert('Group not found');
            return;
        }

        await docRef.update({
            members: firebase.firestore.FieldValue.arrayRemove(user.uid)
        });

        // Remove group if empty
        const updated = await docRef.get();
        const members = updated.exists ? updated.data().members || [] : [];
        if (members.length === 0) {
            await docRef.delete();
        }

        alert('Left group!');
    } catch (err) {
        alert('Error leaving group: ' + err.message);
    }
}

// Display all groups (real-time)
function showGroups() {
    const container = document.getElementById('groupsList');
    container.innerHTML = '';

    const heading = document.createElement('h2');
    heading.textContent = 'All Groups';
    container.appendChild(heading);

    db.collection('groups').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
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

        snapshot.forEach(doc => {
            const data = doc.data();
            const row = table.insertRow();

            const cell1 = row.insertCell(0);
            cell1.textContent = `${data.name} (${(data.members || []).length}/${data.maxSize})`;
            cell1.style.border = '1px solid #ccc';
            cell1.style.padding = '8px';

            const cell2 = row.insertCell(1);
            cell2.textContent = (data.members || []).join(', ');
            cell2.style.border = '1px solid #ccc';
            cell2.style.padding = '8px';

            const cell3 = row.insertCell(2);
            cell3.style.border = '1px solid #ccc';
            cell3.style.padding = '8px';

            const button = document.createElement('button');
            const currentUser = firebase.auth().currentUser;
            const isMember = currentUser && (data.members || []).includes(currentUser.uid);
            if (isMember) {
                button.textContent = 'Leave';
                button.addEventListener('click', () => leaveGroup(doc.id));
            } else {
                button.textContent = 'Join';
                button.addEventListener('click', () => joinGroup(doc.id));
            }
            cell3.appendChild(button);
        });

        container.appendChild(table);
    }, err => {
        const p = document.createElement('p');
        p.textContent = 'Error loading groups: ' + err.message;
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
        firebase.auth().signOut().then(() => window.location.href = 'index.html');
    });

    // Ensure user is logged in before showing groups
    const user = firebase.auth().currentUser;
    if (!user) {
        // If auth state not ready yet, wait for it
        firebase.auth().onAuthStateChanged(u => {
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