// Initialize groups in localStorage
if (!localStorage.groups) localStorage.groups = JSON.stringify([
]);

// Create a new group
function createGroup() {
    const name = prompt("Enter group name:");
    if (!name) return;
    
    const groups = JSON.parse(localStorage.groups);
    const newGroup = {
        id: groups.length + 1,
        name: name,
        members: [sessionStorage.currentUser],
        maxSize: 10
    };
    
    groups.push(newGroup);
    localStorage.groups = JSON.stringify(groups);
    alert("Group created!");
    showGroups();
}

// Join a group
function joinGroup(groupId) {
    const groups = JSON.parse(localStorage.groups);
    const group = groups.find(g => g.id === groupId);
    
    if (group.members.length >= group.maxSize) {
        alert("Group is full!");
        return;
    }
    
    if (group.members.includes(sessionStorage.currentUser)) {
        alert("You're already in this group!");
        return;
    }
    
    group.members.push(sessionStorage.currentUser);
    localStorage.groups = JSON.stringify(groups);
    alert("Joined group!");
    showGroups();
}

// Leave a group
function leaveGroup(groupId) {
    const groups = JSON.parse(localStorage.groups);
    const group = groups.find(g => g.id === groupId);
    
    group.members = group.members.filter(member => member !== sessionStorage.currentUser);
    
    // Remove empty groups
    const newGroups = groups.filter(g => g.members.length > 0);
    localStorage.groups = JSON.stringify(newGroups);
    
    alert("Left group!");
    showGroups();
}

// Display all groups
function showGroups() {
    const groups = JSON.parse(localStorage.groups);
    const currentUser = sessionStorage.currentUser;
    
    let html = "<h2>All Groups</h2>";
    
    if (groups.length === 0) {
        html += "<p>No groups yet. Create one!</p>";
    } else {
        html += "<table border='1'><tr><th>Group</th><th>Members</th><th>Action</th></tr>";
        
        groups.forEach(group => {
            const isMember = group.members.includes(currentUser);
            const membersList = group.members.join(", ");
            
            html += `<tr>
                <td>${group.name} (${group.members.length}/${group.maxSize})</td>
                <td>${membersList}</td>
                <td>`;
            
            if (isMember) {
                html += `<button onclick="leaveGroup(${group.id})">Leave</button>`;
            } else {
                html += `<button onclick="joinGroup(${group.id})">Join</button>`;
            }
            
            html += `</td></tr>`;
        });
        
        html += "</table>";
    }
    
    document.getElementById("groupsList").innerHTML = html;
}

// On page load
if (!sessionStorage.currentUser) {
    alert("Please login first!");
    window.location.href = "index.html";
} else {
    showGroups();
}