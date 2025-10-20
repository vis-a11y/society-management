// Sample default users
let usersData = [
    { id: 1, name: "Admin User", email: "admin@society.com", role: "Admin", status: "Active" },
    { id: 2, name: "Manager", email: "manager@society.com", role: "Manager", status: "Active" },
    { id: 3, name: "Staff", email: "staff@society.com", role: "Staff", status: "Inactive" }
];

// Load users from localStorage or default
function getUsers() {
    const stored = JSON.parse(localStorage.getItem("users")) || usersData;
    return stored;
}

// Save users to localStorage
function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}

// Render users table
function renderUsers() {
    const tbody = document.querySelector("#usersTable tbody");
    tbody.innerHTML = "";
    const users = getUsers();

    users.forEach(user => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>${user.status}</td>
            <td>
                <button class="btn-action edit-btn" onclick="editUser(${user.id})"><i class="fas fa-edit"></i></button>
                <button class="btn-action delete-btn" onclick="deleteUser(${user.id})"><i class="fas fa-trash"></i></button>
                <button class="btn-action toggle-status-btn" onclick="toggleStatus(${user.id})"><i class="fas fa-toggle-on"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Edit User (example: simple prompt for demo)
function editUser(id) {
    const users = getUsers();
    const user = users.find(u => u.id === id);
    const newName = prompt("Edit Name:", user.name);
    if (newName) {
        user.name = newName;
        saveUsers(users);
        renderUsers();
    }
}

// Delete User
function deleteUser(id) {
    let users = getUsers();
    users = users.filter(u => u.id !== id);
    saveUsers(users);
    renderUsers();
}

// Toggle status
function toggleStatus(id) {
    const users = getUsers();
    const user = users.find(u => u.id === id);
    user.status = user.status === "Active" ? "Inactive" : "Active";
    saveUsers(users);
    renderUsers();
}

// Add new user
document.getElementById("addUserBtn").addEventListener("click", () => {
    const name = prompt("Enter Name:");
    const email = prompt("Enter Email:");
    const role = prompt("Enter Role (Admin/Manager/Staff):");
    if (name && email && role) {
        const users = getUsers();
        users.push({ id: Date.now(), name, email, role, status: "Active" });
        saveUsers(users);
        renderUsers();
    }
});

// Initial render
renderUsers();