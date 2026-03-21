const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
    ? "http://localhost:5000/api" 
    : window.location.origin + "/api";

function authHeaders() {
    const token = localStorage.getItem('token');
    if (!token && !window.location.href.includes('index.html')) {
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
        <div class="activity-item">
            <div style="flex:1"><b>\${n.title}</b><br><small class="muted">\${new Date(n.date).toLocaleDateString()}</small></div>
            <div>\${n.content}</div>
        </div>`);
    }

    if (loc.includes('admin-visitors')) {
        loadTable('visitors', 'dataTable', v => `
        <div class="activity-item">
            <div style="flex:1"><b>\${v.name}</b> (Flat \${v.flat})<br><small class="muted">Purpose: \${v.purpose}</small></div>
            <div style="width: 100px"><span class="status-badge">\${v.status}</span></div>
            <div>
                \${v.status !== 'Exited' ? 
                \`<button class="btn btn-secondary btn-sm" onclick="apiAction('visitors/\${v.id}', 'PATCH', {status:'Exited', exit_time:new Date().toISOString()})">Mark Out</button>\` : ''}
            </div>
        </div>`);
    }

    if (loc.includes('admin-maintenance')) {
        loadTable('maintenance', 'dataTable', m => `
        <div class="activity-item">
            <div style="flex:1"><b>Resident ID: \${m.resident_id}</b><br><small class="muted">\${m.month}</small></div>
            <div style="width: 100px">₹\${m.amount}</div>
            <div style="width: 150px"><span class="status-badge">\${m.status}</span></div>
            <div>
                \${m.status === 'Pending' ? 
                \`<button class="btn btn-primary btn-sm" onclick="apiAction('maintenance/\${m.id}/pay', 'PATCH')">Mark Paid</button>\` : ''}
            </div>
        </div>`);
    }

    if (loc.includes('admin-complaints')) {
        loadTable('complaints', 'dataTable', c => `
        <div class="activity-item">
            <div style="flex:1"><b>\${c.subject}</b> (Flat \${c.flat})<br><small class="muted">\${new Date(c.date).toLocaleDateString()}</small></div>
            <div style="width: 150px"><span class="status-badge">\${c.status}</span></div>
            <div>
                \${c.status !== 'Resolved' ? 
                \`<button class="btn btn-primary btn-sm" onclick="apiAction('complaints/\${c.id}/status', 'PATCH', {status:'Resolved'})">Resolve</button>\` : ''}
            </div>
        </div>`);
    }

    if (loc.includes('resident-maintenance')) {
        loadTable('maintenance', 'dataTable', m => `
        <div class="activity-item">
            <div style="flex:1"><b>\${m.month}</b></div>
            <div style="width: 100px">₹\${m.amount}</div>
            <div style="width: 150px"><span class="status-badge">\${m.status}</span></div>
            <div>
                \${m.status === 'Pending' ? 
                \`<button class="btn btn-primary btn-sm" onclick="apiAction('maintenance/\${m.id}/pay', 'PATCH')">Pay Now</button>\` : ''}
            </div>
        </div>`);
    }

    if (loc.includes('resident-complaints')) {
        loadTable('complaints', 'dataTable', c => `
        <div class="activity-item">
            <div style="flex:1"><b>\${c.subject}</b><br><small class="muted">\${c.description}</small></div>
            <div style="width: 150px"><span class="status-badge">\${c.status}</span></div>
        </div>`);
    }
});
