const API_BASE = "http://localhost:5000/api";
let usersData = [];

// Helper for authenticated requests
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
    return fetch(url, options);
}

// Render users table
async function renderUsers() {
    const tbody = document.querySelector("#usersTable tbody");
    if (!tbody) return;
    
    try {
        const response = await fetchWithAuth(`${API_BASE}/users`);
        usersData = await response.json();
        
        tbody.innerHTML = "";
        usersData.forEach(user => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${user.name || user.id}</td>
                <td>${user.email || 'N/A'}</td>
                <td>${user.role}</td>
                <td>
                    <span class="status-badge ${user.status.toLowerCase()}">${user.status}</span>
                    ${user.isApproved ? '<span class="status-badge active" style="background:#dcfce7; color:#166534">Approved</span>' : '<span class="status-badge pending" style="background:#fef9c3; color:#854d0e">Pending</span>'}
                </td>
                <td>
                    ${!user.isApproved ? `<button class="btn-action approve-btn" onclick="approveUser('${user.id}')" title="Approve"><i class="fas fa-check"></i></button>` : ''}
                    <button class="btn-action edit-btn" onclick="alert('Feature coming soon')"><i class="fas fa-edit"></i></button>
                    <button class="btn-action delete-btn" onclick="alert('Feature coming soon')"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Failed to load users", err);
    }
}

async function approveUser(id) {
    try {
        const response = await fetchWithAuth(`${API_BASE}/users/${id}/approve`, {
            method: 'PATCH'
        });
        if (response.ok) {
            if (window.showToast) window.showToast('User Approved', `User ${id} can now log in.`, 'success');
            renderUsers();
        }
    } catch (err) {
        console.error("Approval failed", err);
    }
}

// Initial render
document.addEventListener("DOMContentLoaded", renderUsers);
