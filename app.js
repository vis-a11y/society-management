const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
    ? "http://localhost:5000/api" 
    : window.location.origin + "/api";

function authHeaders() {
    const token = localStorage.getItem('token');
    if (!token && !window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
        window.location.href = 'index.html';
    }
    return {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    };
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// Global Auth login/register
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(loginForm));
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Login failed');
            const result = await res.json();
            localStorage.setItem('token', result.token);
            localStorage.setItem('role', result.user.role);
            window.location.href = result.user.role === 'Admin' ? 'admin-dashboard.html' : 'resident-dashboard.html';
        } catch (err) {
            alert('Invalid credentials');
        }
    });
}

// Generic Form Handler
async function handleForm(e, endpoint) {
    e.preventDefault();
    const form = e.target;
    const body = Object.fromEntries(new FormData(form));
    try {
        const res = await fetch(`${API_BASE}/${endpoint}`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(body)
        });
        if (res.ok) {
            alert('Success');
            form.reset();
            window.location.reload();
        } else alert('Error posting data');
    } catch (err) { alert('Network Error'); }
}

// Action Dispatchers for lists
async function apiAction(endpoint, method, payload = null) {
    try {
        const res = await fetch(`${API_BASE}/${endpoint}`, {
            method,
            headers: authHeaders(),
            body: payload ? JSON.stringify(payload) : null
        });
        if (res.ok) { alert('Action successful'); window.location.reload(); }
        else alert('Error performing action');
    } catch (err) { alert('Network Action failed'); }
}

// Data loaders
async function loadTable(endpoint, containerId, formatter) {
    const table = document.getElementById(containerId);
    if (!table) return;
    try {
        const res = await fetch(`${API_BASE}/${endpoint}`, { headers: authHeaders() });
        const data = await res.json();
        table.innerHTML = data.length ? data.map(formatter).join('') : '<div class="muted">No data found.</div>';
    } catch (err) {
        table.innerHTML = '<div class="text-danger">Failed to load data.</div>';
    }
}

// Core execution on load
document.addEventListener('DOMContentLoaded', async () => {
    const loc = window.location.href;
    const role = localStorage.getItem('role') || 'Admin';

    if (loc.includes('admin-dashboard')) {
        try {
            const res = await fetch(`${API_BASE}/users/residents`, {headers:authHeaders()});
            const comp = await fetch(`${API_BASE}/complaints`, {headers:authHeaders()});
            const vis = await fetch(`${API_BASE}/visitors`, {headers:authHeaders()});
            const jRes = await res.json(), jComp = await comp.json(), jVis = await vis.json();
            
            document.getElementById('val-res').textContent = jRes.length || 0;
            document.getElementById('val-comp').textContent = (jComp || []).filter(c=>c.status!=='Resolved').length;
            document.getElementById('val-vis').textContent = jVis.length || 0;
        } catch (e) {}
    }

    if (loc.includes('admin-notices') || loc.includes('resident-notices')) {
        loadTable('notices', 'dataTable', n => `
        <div class="activity-item" style="flex-direction: column; align-items: flex-start;">
            <div style="width: 100%; display: flex; justify-content: space-between;">
                <div><b>${n.title}</b><br><small class="muted">${new Date(n.date).toLocaleDateString()}</small></div>
                ${role === 'Admin' ? `<button class="btn btn-danger btn-sm" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="apiAction('notices/${n.id}', 'DELETE')"><i class="fas fa-trash"></i></button>` : ''}
            </div>
            <div style="width: 100%; white-space: pre-wrap; margin-top: 10px;">${n.content}</div>
        </div>`);
    }

    if (loc.includes('admin-visitors')) {
        loadTable('visitors', 'dataTable', v => `
        <div class="activity-item" style="flex-direction: column; align-items: flex-start;">
            <div style="width: 100%; display: flex; justify-content: space-between;">
                <div><b>${v.name}</b> (Flat ${v.flat})</div>
                <span class="status-badge">${v.status}</span>
            </div>
            <div style="width: 100%; white-space: pre-wrap; margin-top: 5px; font-size: 0.9rem;" class="muted">Purpose: ${v.purpose}</div>
            <div style="width: 100%; margin-top: 10px; display: flex; gap: 0.5rem; justify-content: flex-end;">
                ${v.status !== 'Exited' && role === 'Admin' ? 
                `<button class="btn btn-secondary btn-sm" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="apiAction('visitors/${v.id}', 'PATCH', {status:'Exited', exit_time:new Date().toISOString()})">Mark Out</button>` : ''}
                ${role === 'Admin' ? `<button class="btn btn-danger btn-sm" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="apiAction('visitors/${v.id}', 'DELETE')"><i class="fas fa-trash"></i></button>` : ''}
            </div>
        </div>`);
    }

    if (loc.includes('admin-maintenance')) {
        loadTable('maintenance', 'dataTable', m => `
        <div class="activity-item">
            <div style="flex:1"><b>${m.name || 'Resident ID: ' + m.resident_id}</b> ${m.flat ? '(Flat ' + m.flat + ')' : ''}<br><small class="muted">${m.month}</small></div>
            <div style="width: 100px">₹${m.amount}</div>
            <div style="width: 150px"><span class="status-badge">${m.status}</span></div>
            <div>
                ${m.status === 'Pending' && role === 'Admin' ? 
                `<button class="btn btn-primary btn-sm" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="apiAction('maintenance/${m.id}/pay', 'PATCH')">Mark Paid</button>` : ''}
                ${role === 'Admin' ? `<button class="btn btn-danger btn-sm" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; margin-left: 0.5rem;" onclick="apiAction('maintenance/${m.id}', 'DELETE')"><i class="fas fa-trash"></i></button>` : ''}
            </div>
        </div>`);
    }

    if (loc.includes('admin-complaints')) {
        loadTable('complaints', 'dataTable', c => `
        <div class="activity-item" style="flex-direction: column; align-items: flex-start;">
            <div style="width: 100%; display: flex; justify-content: space-between;">
                <div><b>${c.subject}</b> (Flat ${c.flat || 'N/A'})<br><small class="muted">${new Date(c.date).toLocaleDateString()}</small></div>
                <span class="status-badge">${c.status}</span>
            </div>
            <div style="width: 100%; white-space: pre-wrap; margin-top: 10px; font-size: 0.95rem;">${c.description || 'No detailed description provided.'}</div>
            <div style="width: 100%; margin-top: 10px; display: flex; gap: 0.5rem; justify-content: flex-end;">
                ${c.status !== 'Resolved' && role === 'Admin' ? 
                `<button class="btn btn-primary btn-sm" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="apiAction('complaints/${c.id}/status', 'PATCH', {status:'Resolved'})">Resolve</button>` : ''}
                ${role === 'Admin' ? `<button class="btn btn-danger btn-sm" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="apiAction('complaints/${c.id}', 'DELETE')"><i class="fas fa-trash"></i></button>` : ''}
            </div>
        </div>`);
    }

    if (loc.includes('resident-maintenance')) {
        loadTable('maintenance', 'dataTable', m => `
        <div class="activity-item">
            <div style="flex:1"><b>${m.month}</b></div>
            <div style="width: 100px">₹${m.amount}</div>
            <div style="width: 150px"><span class="status-badge">${m.status}</span></div>
            <div>
                ${m.status === 'Pending' ? 
                `<button class="btn btn-primary btn-sm" onclick="apiAction('maintenance/${m.id}/pay', 'PATCH')">Pay Now</button>` : ''}
            </div>
        </div>`);
    }

    if (loc.includes('resident-complaints')) {
        loadTable('complaints', 'dataTable', c => `
        <div class="activity-item" style="flex-direction: column; align-items: flex-start;">
            <div style="width: 100%; display: flex; justify-content: space-between;">
                <b>${c.subject}</b>
                <span class="status-badge">${c.status}</span>
            </div>
            <div style="width: 100%; white-space: pre-wrap; margin-top: 10px; font-size: 0.95rem; color: var(--text-secondary);">${c.description}</div>
        </div>`);
    }

    if (loc.includes('resident-visitors')) {
        loadTable('visitors', 'dataTable', v => `
        <div class="activity-item" style="flex-direction: column; align-items: flex-start;">
            <div style="width: 100%; display: flex; justify-content: space-between;">
                <b>${v.name}</b>
                <span class="status-badge">${v.status}</span>
            </div>
            <div style="width: 100%; white-space: pre-wrap; margin-top: 5px; font-size: 0.9rem;" class="muted">Purpose: ${v.purpose} | Phone: ${v.phone || 'N/A'}</div>
            <div style="width: 100%; text-align: right; margin-top: 10px; font-size: 0.85rem; color: var(--text-tertiary);">${new Date(v.entry_time).toLocaleString()}</div>
        </div>`);
    }

    if (loc.includes('admin-residents')) {
        loadTable('users/residents', 'dataTable', r => `
        <div class="activity-item">
            <div class="logo-icon" style="width: 40px; height: 40px; border-radius: 50%; font-size: 1rem;"><i class="fas fa-user"></i></div>
            <div style="flex:1"><b>${r.name}</b><br><small class="muted">Flat ${r.flat || 'N/A'} | Phone: ${r.phone || 'N/A'}</small></div>
            ${role === 'Admin' ? `<div><button class="btn btn-danger btn-sm" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; margin-left: 0.5rem;" onclick="apiAction('users/residents/${r.id}', 'DELETE')"><i class="fas fa-trash"></i></button></div>` : ''}
        </div>`);
    }

    if (loc.includes('resident-profile')) {
        try {
            const res = await fetch(`${API_BASE}/users/profile`, { headers: authHeaders() });
            if (res.ok) {
                const profile = await res.json();
                document.getElementById('profile-name').innerText = profile.name;
                document.getElementById('profile-flat').innerText = profile.flat || '101';
                document.getElementById('phone-input').value = profile.phone === 'N/A' ? '' : profile.phone;
                document.getElementById('vehicle-input').value = profile.vehicle_details || '';
            }
        } catch (err) {}
    }

    if (loc.includes('admin-events') || loc.includes('resident-events')) {
        loadTable('events', 'dataTable', e => `
        <div class="activity-item" style="flex-direction: column; align-items: flex-start;">
            <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <div class="logo-icon" style="width:44px;height:44px;border-radius:12px;font-size:1.1rem;flex-shrink:0"><i class="fas fa-calendar"></i></div>
                    <b>${e.title}</b>
                </div>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <span class="status-badge" style="background:rgba(99,102,241,0.15);color:var(--primary-light);border-color:rgba(99,102,241,0.3)">${e.date}</span>
                    ${role === 'Admin' ? `<button class="btn btn-danger btn-sm" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="apiAction('events/${e.id}', 'DELETE')"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            </div>
            <div style="width: 100%; white-space: pre-wrap; margin-top: 10px; padding-left: 60px; font-size: 0.95rem; color: var(--text-secondary);">${e.description || 'No description'}</div>
        </div>`);
    }

    // ---- STAFF (Admin only) ----
    if (loc.includes('admin-staff')) {
        loadTable('staff', 'dataTable', s => `
        <div class="activity-item">
            <div class="logo-icon" style="width:44px;height:44px;border-radius:50%;font-size:1rem;flex-shrink:0"><i class="fas fa-user-tie"></i></div>
            <div style="flex:1">
                <b>${s.name}</b><br>
                <small class="muted">${s.role} &bull; ${s.shift}</small>
            </div>
            <div style="text-align:right">
                <div style="font-weight:700;color:var(--success)">₹${s.salary}/mo</div>
                <small class="muted">${s.attendance || 'Present'}</small>
            </div>
            ${role === 'Admin' ? `<div><button class="btn btn-danger btn-sm" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; margin-left: 1rem;" onclick="apiAction('staff/${s.id}', 'DELETE')"><i class="fas fa-trash"></i></button></div>` : ''}
        </div>`);
    }

    // ---- PARKING (Admin) ----
    if (loc.includes('admin-parking')) {
        loadTable('parking', 'dataTable', p => `
        <div class="activity-item">
            <div class="logo-icon" style="width:44px;height:44px;border-radius:12px;font-size:1.1rem;flex-shrink:0"><i class="fas fa-car"></i></div>
            <div style="flex:1">
                <b>${p.name}</b> &mdash; Flat ${p.flat || 'N/A'}<br>
                <small class="muted">${p.vehicle_details || 'No vehicle info'}</small>
            </div>
            <div>
                <span class="status-badge" style="background:rgba(16,185,129,0.15);color:var(--success);border-color:rgba(16,185,129,0.3); margin-bottom: 0.5rem; display: block;">Slot: ${p.parking_slot}</span>
                ${role === 'Admin' ? `<button class="btn btn-danger btn-sm" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="apiAction('parking/${p.id}', 'DELETE')"><i class="fas fa-trash"></i></button>` : ''}
            </div>
        </div>`);
    }

    // ---- PARKING (Resident) ----
    if (loc.includes('resident-parking')) {
        try {
            const res = await fetch(`${API_BASE}/users/profile`, { headers: authHeaders() });
            if (res.ok) {
                const profile = await res.json();
                const slotEl = document.getElementById('parking-slot-val');
                const vehicleEl = document.getElementById('parking-vehicle-val');
                if (slotEl) slotEl.innerText = profile.parking_slot || 'Not Assigned';
                if (vehicleEl) vehicleEl.innerText = profile.vehicle_details || 'Not Set';
            }
        } catch (err) {}
        loadTable('parking', 'dataTable', p => `
        <div class="activity-item">
            <div class="logo-icon" style="width:44px;height:44px;border-radius:12px;font-size:1rem;flex-shrink:0"><i class="fas fa-car"></i></div>
            <div style="flex:1"><b>${p.name}</b> &mdash; Flat ${p.flat || 'N/A'}</div>
            <div><span class="status-badge" style="background:rgba(16,185,129,0.15);color:var(--success);border-color:rgba(16,185,129,0.3)">Slot: ${p.parking_slot}</span></div>
        </div>`);
    }

    // ---- DOCUMENTS (Both Admin & Resident view) ----
    if (loc.includes('admin-documents') || loc.includes('resident-documents')) {
        loadTable('documents', 'dataTable', d => `
        <div class="activity-item">
            <div class="logo-icon" style="width:44px;height:44px;border-radius:12px;font-size:1.1rem;flex-shrink:0"><i class="fas fa-file-pdf"></i></div>
            <div style="flex:1">
                <b>${d.title}</b><br>
                <small class="muted">Uploaded on ${new Date(d.date).toLocaleDateString()}</small>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <a href="${d.file_url}" target="_blank" class="btn btn-primary" style="padding:.6rem 1.25rem;font-size:.85rem"><i class="fas fa-external-link-alt"></i> Open</a>
                ${role === 'Admin' ? `<button class="btn btn-danger btn-sm" style="padding: 0.6rem 1.25rem; font-size: 0.85rem;" onclick="apiAction('documents/${d.id}', 'DELETE')"><i class="fas fa-trash"></i></button>` : ''}
            </div>
        </div>`);
    }

    // ---- MESSAGES (Admin & Resident) ----
    if (loc.includes('resident-messages') || loc.includes('admin-messages')) {
        loadTable('messages', 'dataTable', m => `
        <div class="activity-item" style="flex-direction: column; align-items: flex-start;">
            <div style="width: 100%; display: flex; gap: 1rem; align-items: flex-start;">
                <div class="logo-icon" style="width:44px;height:44px;border-radius:50%;font-size:1rem;flex-shrink:0"><i class="fas fa-envelope"></i></div>
                <div style="flex:1;">
                    ${role === 'Admin' ? `<b>${m.sender_name || 'Resident'}</b> (Flat ${m.sender_flat || 'N/A'})<br>` : ''}
                    <div style="white-space: pre-wrap; font-size: 0.95rem; margin-top: 5px;">${m.message}</div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                    <small class="muted">${new Date(m.timestamp).toLocaleString()}</small>
                    <button class="btn btn-danger btn-sm" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="apiAction('messages/${m.id}', 'DELETE')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>`);
    }
});
