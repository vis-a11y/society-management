const API_BASE = "http://localhost:5000/api";

const visitorForm = document.getElementById('visitorForm');
const visitorList = document.getElementById('visitorList');

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

async function loadVisitors() {
    try {
        const response = await fetchWithAuth(`${API_BASE}/visitors`);
        const visitors = await response.json();
        renderVisitors(visitors);
    } catch (err) {
        console.error("Failed to load visitors", err);
    }
}

function renderVisitors(visitors) {
    visitorList.innerHTML = visitors.map(v => `
        <div class="visitor-card">
            <div class="visitor-main">
                <div class="visitor-icon"><i class="fas fa-user-clock"></i></div>
                <div>
                    <h4 style="margin: 0; font-size: 1.1rem;">${v.name}</h4>
                    <p style="color: #64748b; font-size: 0.9rem; margin: 0.25rem 0;">Visiting: <strong>${v.flat}</strong> | Purpose: ${v.purpose}</p>
                    <p style="color: #94a3b8; font-size: 0.8rem; margin: 0;">Phone: ${v.phone} | In: ${v.entryTime}</p>
                </div>
            </div>
            <div>
                ${v.exitTime ? `<div class="out-badge">Out: ${v.exitTime.split(',').length > 1 ? v.exitTime.split(',')[1] : v.exitTime}</div>` : `<button class="out-btn" onclick="markOut(${v.id})">Mark Exit</button>`}
            </div>
        </div>
    `).join("");
}

visitorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const visitor = {
        name: document.getElementById('vName').value,
        phone: document.getElementById('vPhone').value,
        flat: document.getElementById('vFlat').value,
        purpose: document.getElementById('vPurpose').value
    };

    try {
        const response = await fetchWithAuth(`${API_BASE}/visitors`, {
            method: 'POST',
            body: JSON.stringify(visitor)
        });
        if (response.ok) {
            if (window.showToast) window.showToast('Entry Logged', 'Visitor entry record created successfully.', 'success');
            visitorForm.reset();
            loadVisitors();
        }
    } catch (err) {
        console.error("Failed to log visitor", err);
    }
});

async function markOut(id) {
    try {
        const response = await fetchWithAuth(`${API_BASE}/visitors/${id}/out`, {
            method: 'PATCH'
        });
        if (response.ok) {
            if (window.showToast) window.showToast('Exit Logged', 'Visitor has been marked as OUT.', 'info');
            loadVisitors();
        }
    } catch (err) {
        console.error("Failed to mark out", err);
    }
}

document.addEventListener('DOMContentLoaded', loadVisitors);
