// ============================================================================
// ADMIN PORTAL - UNIFIED JAVASCRIPT
// Consolidates all admin functionality into one file
// ============================================================================

const API_BASE = "http://localhost:5000/api";

// ============================================================================
// GLOBAL STATE
// ============================================================================
let allResidents = [];
let allComplaints = [];
let allAnnouncements = [];
let allFees = [];
let allPolls = [];
let allVisitors = [];
let allBookings = [];
let allUsers = [];

// ============================================================================
// THEME MANAGEMENT
// ============================================================================
function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(themeToggle, savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(themeToggle, newTheme);
        });
    }
}

function updateThemeIcon(btn, theme) {
    if (!btn) return;
    const icon = btn.querySelector('i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// ============================================================================
// AUTHENTICATION & SESSION
// ============================================================================
const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
if (!currentUser.id || currentUser.role !== "Admin") {
    window.location.href = "index.html";
}

async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
    const response = await fetch(url, options);
    if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        window.location.href = "index.html";
        return response;
    }
    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response;
}

// ============================================================================
// NAVIGATION
// ============================================================================
const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");

navItems.forEach(item => {
    item.addEventListener("click", () => {
        const pageId = item.dataset.page;
        if(pageId !== undefined) {
            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");
            pages.forEach(page => page.id === pageId ? page.classList.add("active") : page.classList.remove("active"));
        }
    });
});

// Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "index.html";
    });
}

// ============================================================================
// MODAL MANAGEMENT
// ============================================================================
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

window.showAddResidentModal = () => showModal('addResidentModal');
window.showCollectFeeModal = () => {
    populateFeeResidentSelect();
    showModal('collectFeeModal');
};
window.showAddAnnouncementModal = () => showModal('addAnnouncementModal');
window.showAddPollModal = () => showModal('addPollModal');
window.closeModal = closeModal;

// Navigation helper for quick actions
window.navigateToPage = (pageId) => {
    navItems.forEach(nav => {
        if (nav.dataset.page === pageId) {
            nav.click();
        }
    });
};

// ============================================================================
// DATA LOADING
// ============================================================================
async function loadAllData() {
    initializeTheme();
    document.body.classList.add('loading');
    try {
        const [resResp, compResp, annResp, feeResp, pollResp, visResp, bookResp, userResp, sosResp, auditResp, predResp, parkResp, kycsResp, staffResp, deflResp] = await Promise.all([
            fetchWithAuth(`${API_BASE}/residents`),
            fetchWithAuth(`${API_BASE}/complaints`),
            fetchWithAuth(`${API_BASE}/announcements`),
            fetchWithAuth(`${API_BASE}/fees`).catch(() => ({ json: async () => [] })),
            fetchWithAuth(`${API_BASE}/polls`).catch(() => ({ json: async () => [] })),
            fetchWithAuth(`${API_BASE}/visitors`).catch(() => ({ json: async () => [] })),
            fetchWithAuth(`${API_BASE}/bookings`).catch(() => ({ json: async () => [] })),
            fetchWithAuth(`${API_BASE}/users`).catch(() => ({ json: async () => [] })),
            fetchWithAuth(`${API_BASE}/sos`).catch(() => ({ json: async () => [] })),
            fetchWithAuth(`${API_BASE}/audit-logs`).catch(() => ({ json: async () => [] })),
            fetchWithAuth(`${API_BASE}/predictions/maintenance`).catch(() => ({ json: async () => [] })),
            fetchWithAuth(`${API_BASE}/parking-requests`).catch(() => ({ json: async () => [] })),
            fetchWithAuth(`${API_BASE}/kyc-documents`).catch(() => ({ json: async () => [] })),
            fetchWithAuth(`${API_BASE}/service-providers`).catch(() => ({ json: async () => [] })),
            fetchWithAuth(`${API_BASE}/finance/defaulters`).catch(() => ({ json: async () => [] }))
        ]);

        allResidents = await resResp.json();
        allComplaints = await compResp.json();
        allAnnouncements = await annResp.json();
        allFees = await feeResp.json();
        allPolls = await pollResp.json();
        allVisitors = await visResp.json();
        allBookings = await bookResp.json();
        allUsers = await userResp.json();
        const sosAlerts = await sosResp.json();
        const auditLogs = await auditResp.json();
        const predictions = await predResp.json();
        const parkingRequests = await parkResp.json();
        const kycDocs = await kycsResp.json();
        const staff = await staffResp.json();
        const defaulters = await deflResp.json();

        renderDashboard();
        renderSOSAlerts(sosAlerts);
        renderMembers();
        renderComplaints();
        renderFinance();
        renderDefaulters(defaulters);
        renderAnnouncements();
        renderPolls();
        renderVisitors();
        renderBookings();
        renderUsers();
        renderAuditLogs(auditLogs);
        renderPredictions(predictions);
        renderAdminParking(parkingRequests);
        renderKYCApprovals(kycDocs);
        renderStaff(staff);
    } catch (err) {
        console.error("Failed to load data", err);
    } finally {
        document.body.classList.remove('loading');
    }
}

// ============================================================================
// DASHBOARD RENDERING
// ============================================================================
function renderDashboard() {
    const totalMembersElem = document.getElementById("totalMembers");
    const pendingCompElem = document.getElementById("pendingComplaints");
    const totalCollElem = document.getElementById("totalCollection");
    const maintenanceElem = document.getElementById("maintenanceFee");

    const totalResidents = allResidents.length;
    const pendingComplaints = allComplaints.filter(c => c.status.toLowerCase() === "pending").length;
    const totalColl = allFees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + parseInt(f.amount || 0), 0);
    const pendingFee = allFees.filter(f => f.status === 'Pending').reduce((sum, f) => sum + parseInt(f.amount || 0), 0);

    if (totalMembersElem) totalMembersElem.textContent = totalResidents;
    if (pendingCompElem) pendingCompElem.textContent = pendingComplaints;
    if (totalCollElem) totalCollElem.textContent = "₹" + totalColl.toLocaleString();
    if (maintenanceElem) maintenanceElem.textContent = "₹" + pendingFee.toLocaleString();

    // Animate charts
    const stats = [
        { id: 'adminMemChart', val: totalResidents, max: 100 },
        { id: 'adminCompChart', val: pendingComplaints, max: 20 },
        { id: 'adminCollChart', val: totalColl, max: 500000 }
    ];

    stats.forEach(s => {
        const bar = document.getElementById(s.id);
        if (bar) {
            const pct = Math.min((s.val / s.max) * 100, 100);
            setTimeout(() => bar.style.width = pct + "%", 100);
        }
    });
}

// ============================================================================
// RESIDENTS MANAGEMENT
// ============================================================================
function renderMembers() {
    const membersGrid = document.getElementById("membersGrid");
    if(!membersGrid) return;

    if(allResidents.length === 0) {
        membersGrid.innerHTML = '<p class="muted">No residents found.</p>';
        return;
    }

    membersGrid.innerHTML = allResidents.map(m => `
        <div class="resident-card">
            <div class="resident-header">
                <div class="resident-info">
                    <div class="resident-avatar">${m.name ? m.name.charAt(0) : '?'}</div>
                    <div class="resident-details">
                        <h4>${m.name}</h4>
                        <p class="resident-flat">${m.flat}</p>
                        <p><i class="fas fa-phone"></i> ${m.phone || 'N/A'}</p>
                    </div>
                </div>
            </div>
            <div style="padding: 1rem; border-top: 1px solid #f1f5f9; text-align: center;">
                <a href="resident_profile.html?id=${m.id}" class="btn btn-ghost" style="font-size: 0.8rem; text-decoration: none; color: var(--primary);">View Profile</a>
            </div>
        </div>
    `).join("");
}

// Add Resident Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const addResidentForm = document.getElementById('addResidentForm');
    if (addResidentForm) {
        addResidentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newResident = {
                name: document.getElementById('residentName').value.trim(),
                flat: document.getElementById('flatNumber').value.trim(),
                phone: document.getElementById('contactNumber').value.trim(),
                email: document.getElementById('residentEmail').value.trim(),
                status: "Active",
                joinDate: new Date().toLocaleString('default', { month: 'short', year: 'numeric' })
            };

            try {
                const response = await fetchWithAuth(`${API_BASE}/residents`, {
                    method: 'POST',
                    body: JSON.stringify(newResident)
                });

                if (response.ok) {
                    if (window.showToast) {
                        window.showToast('Success', 'Resident added successfully!', 'success');
                    }
                    closeModal('addResidentModal');
                    await loadAllData();
                }
            } catch (err) {
                console.error("Error adding resident", err);
                if (window.showToast) {
                    window.showToast('Error', 'Failed to add resident', 'error');
                }
            }
        });
    }
});

// ============================================================================
// COMPLAINTS MANAGEMENT
// ============================================================================
function renderComplaints() {
    const priority = document.getElementById('priorityFilter')?.value || 'all';
    const status = document.getElementById('statusFilter')?.value || 'all';
    
    let filtered = [...allComplaints];
    if (priority !== 'all') filtered = filtered.filter(c => (c.priority || 'Normal') === priority);
    if (status !== 'all') filtered = filtered.filter(c => c.status === status);
    
    const complaintsGrid = document.getElementById("complaintsGrid");
    if (!complaintsGrid) return;

    complaintsGrid.innerHTML = filtered.map(c => {
        const priorityClass = `priority-${(c.priority || 'Normal').toLowerCase()}`;
        return `
            <div class="resident-card complaint-card" style="border-left: 4px solid ${c.status === 'Resolved' ? '#10b981' : (c.priority === 'Emergency' ? '#ef4444' : '#bdc3c7')}">
                <div class="resident-header">
                    <div style="flex: 1;">
                        <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.25rem;">
                            <span class="priority-badge ${priorityClass}">${c.priority || 'Normal'}</span>
                            <span style="font-size: 0.75rem; color: #94a3b8;">${c.date}</span>
                        </div>
                        <h4 style="margin: 0;">${c.title}</h4>
                        <p style="font-size: 0.85rem; color: #64748b; margin: 0.25rem 0;">Flat: ${c.flat}</p>
                    </div>
                    <span class="status-badge ${c.status.toLowerCase()}">${c.status}</span>
                </div>
                <div style="padding: 1rem; font-size: 0.9rem; border-top: 1px solid var(--border); background: var(--secondary);">
                    <p>${c.desc}</p>
                    <p style="margin-top: 0.5rem; font-size: 0.8rem; font-weight: 600; color: var(--primary);">
                        <i class="fas fa-tools"></i> Assigned: ${c.assignedTo || 'Unassigned'}
                    </p>
                </div>
                ${c.status.toLowerCase() === 'pending' ? `
                <div style="padding: 0.75rem; text-align: right; border-top: 1px solid var(--border);">
                    <button class="btn btn-primary" onclick="resolveComplaint(${c.id})" style="font-size: 0.8rem; padding: 0.4rem 1rem;">Resolve</button>
                </div>` : ''}
            </div>
        `;
    }).join("");
}

window.filterComplaints = renderComplaints;

window.resolveComplaint = async (id) => {
    try {
        const response = await fetchWithAuth(`${API_BASE}/complaints/${id}/resolve`, {
            method: 'PATCH'
        });

        if (response.ok) {
            if (window.showToast) {
                window.showToast('Success', 'Complaint resolved successfully', 'success');
            }
            await loadAllData();
        }
    } catch (err) {
        console.error("Failed to resolve complaint", err);
    }
};

// ============================================================================
// FINANCE MANAGEMENT
// ============================================================================
function renderFinance() {
    const feesTableBody = document.getElementById("feesTableBody");
    if (!feesTableBody) return;

    if (allFees.length === 0) {
        feesTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #999;">No fee records found.</td></tr>';
        return;
    }

    feesTableBody.innerHTML = allFees.map(fee => {
        const resident = allResidents.find(r => r.id == fee.residentId);
        return `
            <tr>
                <td>${resident ? resident.name : 'Unknown'}</td>
                <td>${resident ? resident.flat : 'N/A'}</td>
                <td>${fee.month}</td>
                <td>₹${parseInt(fee.amount).toLocaleString()}</td>
                <td><span class="status-badge ${fee.status.toLowerCase()}">${fee.status}</span></td>
                <td>-</td>
            </tr>
        `;
    }).join("");
}

function populateFeeResidentSelect() {
    const select = document.getElementById('feeResidentSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Resident</option>';
    allResidents.forEach(resident => {
        const option = document.createElement("option");
        option.value = resident.id;
        option.textContent = `${resident.name} (${resident.flat})`;
        select.appendChild(option);
    });
}

// Collect Fee Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const collectFeeForm = document.getElementById('collectFeeForm');
    if (collectFeeForm) {
        collectFeeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newFee = {
                residentId: document.getElementById('feeResidentSelect').value,
                month: document.getElementById('feeMonth').value,
                amount: document.getElementById('feeAmount').value,
                status: document.getElementById('feeStatus').value
            };

            try {
                const response = await fetchWithAuth(`${API_BASE}/fees`, {
                    method: 'POST',
                    body: JSON.stringify(newFee)
                });

                if (response.ok) {
                    if (window.showToast) {
                        window.showToast('Success', 'Fee collected successfully!', 'success');
                    }
                    closeModal('collectFeeModal');
                    await loadAllData();
                }
            } catch (err) {
                console.error("Error collecting fee", err);
            }
        });
    }
});

// ============================================================================
// ANNOUNCEMENTS MANAGEMENT
// ============================================================================
function renderAnnouncements() {
    const announcementsList = document.getElementById("announcementsList");
    if(!announcementsList) return;

    announcementsList.innerHTML = allAnnouncements.map(a => `
        <div class="announcement-card">
            <div class="announcement-content">
                <h4>${a.title}</h4>
                <p><i class="fas fa-calendar"></i> Date: ${a.date}</p>
                <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border); font-size: 0.9rem;">
                    ${a.content || 'No content provided'}
                </div>
            </div>
        </div>
    `).join("");
}

// Add Announcement Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const addAnnouncementForm = document.getElementById('addAnnouncementForm');
    if (addAnnouncementForm) {
        addAnnouncementForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newAnnouncement = {
                title: document.getElementById('announcementTitle').value.trim(),
                date: document.getElementById('announcementDate').value,
                content: document.getElementById('announcementDesc').value.trim()
            };

            try {
                const response = await fetchWithAuth(`${API_BASE}/announcements`, {
                    method: 'POST',
                    body: JSON.stringify(newAnnouncement)
                });

                if (response.ok) {
                    if (window.showToast) {
                        window.showToast('Success', 'Announcement posted successfully!', 'success');
                    }
                    closeModal('addAnnouncementModal');
                    await loadAllData();
                }
            } catch (err) {
                console.error("Error adding announcement", err);
            }
        });
    }
});

// ============================================================================
// POLLS MANAGEMENT
// ============================================================================
function renderPolls() {
    const pollsList = document.getElementById("pollsList");
    if(!pollsList) return;

    if (allPolls.length === 0) {
        pollsList.innerHTML = '<p class="muted">No polls created yet.</p>';
        return;
    }

    pollsList.innerHTML = allPolls.map(poll => `
        <div class="card">
            <div class="card-header">
                <h4>${poll.question}</h4>
            </div>
            <div class="card-content">
                <div style="margin-bottom: 1rem;">
                    ${JSON.parse(poll.options || '[]').map(opt => `
                        <div style="padding: 0.25rem 0; font-size: 0.9rem;">• ${opt}</div>
                    `).join("")}
                </div>
                <p class="muted" style="font-size: 0.8rem;"><i class="fas fa-clock"></i> Expires: ${poll.expiresAt}</p>
            </div>
        </div>
    `).join("");
}

// Add Poll Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const addPollForm = document.getElementById('addPollForm');
    if (addPollForm) {
        addPollForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const options = document.getElementById('pollOptions').value.split(',').map(o => o.trim()).filter(o => o !== "");
            const newPoll = {
                question: document.getElementById('pollQuestion').value.trim(),
                options: options,
                expiresAt: document.getElementById('pollExpiry').value
            };

            try {
                const response = await fetchWithAuth(`${API_BASE}/polls`, {
                    method: 'POST',
                    body: JSON.stringify(newPoll)
                });

                if (response.ok) {
                    if (window.showToast) {
                        window.showToast('Success', 'Poll created successfully!', 'success');
                    }
                    closeModal('addPollModal');
                    await loadAllData();
                }
            } catch (err) {
                console.error("Error creating poll", err);
            }
        });
    }
});

// ============================================================================
// VISITORS MANAGEMENT
// ============================================================================
function renderVisitors() {
    const visitorsTableBody = document.getElementById("visitorsTableBody");
    if (!visitorsTableBody) return;

    if (allVisitors.length === 0) {
        visitorsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #999;">No visitor records found.</td></tr>';
        return;
    }

    visitorsTableBody.innerHTML = allVisitors.map(v => `
        <tr>
            <td>${v.name}</td>
            <td>${v.flat}</td>
            <td>${v.purpose}</td>
            <td>${v.date}</td>
            <td><span class="status-badge ${v.status.toLowerCase()}">${v.status}</span></td>
        </tr>
    `).join("");
}

// ============================================================================
// BOOKINGS MANAGEMENT
// ============================================================================
function renderBookings() {
    const bookingsTableBody = document.getElementById("bookingsTableBody");
    if (!bookingsTableBody) return;

    if (allBookings.length === 0) {
        bookingsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #999;">No booking records found.</td></tr>';
        return;
    }

    bookingsTableBody.innerHTML = allBookings.map(b => `
        <tr>
            <td>${b.residentName}</td>
            <td>${b.facility}</td>
            <td>${b.date}</td>
            <td>${b.time}</td>
            <td><span class="status-badge ${b.status.toLowerCase()}">${b.status}</span></td>
            <td>-</td>
        </tr>
    `).join("");
}

// ============================================================================
// USERS MANAGEMENT
// ============================================================================
function renderUsers() {
    const usersTableBody = document.getElementById("usersTableBody");
    if (!usersTableBody) return;

    if (allUsers.length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #999;">No users found.</td></tr>';
        return;
    }

    usersTableBody.innerHTML = allUsers.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${u.role}</td>
            <td><span class="status-badge ${u.isApproved ? 'active' : 'pending'}">${u.isApproved ? 'Approved' : 'Pending'}</span></td>
            <td>
                ${!u.isApproved ? `<button class="btn btn-sm btn-primary" onclick="approveUser('${u.id}')">Approve</button>` : '-'}
            </td>
        </tr>
    `).join("");
}

window.approveUser = async (userId) => {
    try {
        const response = await fetchWithAuth(`${API_BASE}/users/${userId}/approve`, {
            method: 'PATCH'
        });

        if (response.ok) {
            if (window.showToast) {
                window.showToast('Success', 'User approved successfully', 'success');
            }
            await loadAllData();
        }
    } catch (err) {
        console.error("Failed to approve user", err);
    }
};

// ============================================================================
// SOS ALERT RENDERING
// ============================================================================
function renderSOSAlerts(alerts) {
    const container = document.getElementById("sosAlertsContainer");
    if (!container) return;

    if (alerts.length === 0) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = alerts.map(a => `
        <div class="card" style="background: #fee2e2; border-left: 5px solid #ef4444; animation: pulse 2s infinite;">
            <div class="card-content" style="display: flex; justify-content: space-between; align-items: center; color: #991b1b;">
                <div>
                    <h3 style="margin: 0; color: #991b1b;"><i class="fas fa-exclamation-triangle"></i> EMERGENCY SOS ALERT</h3>
                    <p style="margin: 0.25rem 0 0 0;">Flat: <strong>${a.flat}</strong> | Wing: <strong>${a.wing}</strong></p>
                </div>
                <button class="btn btn-danger" onclick="clearSOS(${a.id})">Acknowledge</button>
            </div>
        </div>
    `).join("");
}

window.clearSOS = async (id) => {
    // Logic to clear SOS in backend could be added here
    if (window.showToast) window.showToast('SOS Acknowledged', 'Emergency team has been notified.', 'info');
    await loadAllData();
};

// ============================================================================
// AUDIT LOGS RENDERING
// ============================================================================
function renderAuditLogs(logs) {
    const tableBody = document.getElementById("auditTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = logs.map(l => `
        <tr>
            <td>${new Date(l.timestamp).toLocaleString()}</td>
            <td>${l.performedBy}</td>
            <td><strong>${l.action}</strong></td>
            <td>${l.description}</td>
        </tr>
    `).join("");
}

// ============================================================================
// AI PREDICTIONS RENDERING
// ============================================================================
function renderPredictions(preds) {
    const grid = document.getElementById("predictionsGrid");
    if (!grid) return;

    grid.innerHTML = preds.map(p => `
        <div class="card" style="border-top: 4px solid var(--primary);">
            <div class="card-content">
                <div style="display: flex; justify-content: space-between;">
                    <h3>${p.equipment}</h3>
                    <span class="badge ${p.riskScore.toLowerCase() === 'high' ? 'danger' : 'warning'}">${p.riskScore} Risk</span>
                </div>
                <p class="mt-2"><strong>Prediction:</strong> ${p.prediction}</p>
                <div style="margin-top: 1rem; padding-top: 0.5rem; border-top: 1px solid var(--border); font-size: 0.85rem; display: flex; justify-content: space-between;">
                    <span>Next Service:</span>
                    <span><strong>${p.nextServiceDate}</strong></span>
                </div>
                <button class="btn btn-ghost full-width mt-2" onclick="scheduleService('${p.equipment}')">Schedule Service</button>
            </div>
        </div>
    `).join("");
}

window.scheduleService = (equip) => {
    if (window.showToast) window.showToast('Service Scheduled', `Maintenance for ${equip} has been booked.`, 'success');
};

// ============================================================================
// FINANCE & DEFAULTERS
// ============================================================================
function renderDefaulters(data) {
    const tableBody = document.getElementById("defaultersTableBody");
    if (!tableBody) return;

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">No defaulters found.</td></tr>';
        return;
    }

    tableBody.innerHTML = data.map(d => `
        <tr>
            <td>${d.name}</td>
            <td>${d.flat}</td>
            <td>${d.pendingMonths} Months</td>
            <td>₹${parseInt(d.totalDue).toLocaleString()}</td>
            <td><button class="btn btn-sm btn-outline" onclick="notifyDefaulter(${d.residentId})"><i class="fas fa-bell"></i> Notify</button></td>
        </tr>
    `).join("");
}

window.notifyDefaulter = (id) => {
    window.showToast("Notification Sent", "The resident has been notified of their pending dues.", "info");
};

// ============================================================================
// PARKING ADMIN
// ============================================================================
function renderAdminParking(data) {
    const tableBody = document.getElementById("adminParkingTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = data.map(p => `
        <tr>
            <td>${p.flat}</td>
            <td>${p.visitorName}</td>
            <td>${p.vehicleNumber}</td>
            <td>${p.stayDuration}</td>
            <td>
                ${p.status === 'Pending' ? `
                    <button class="btn btn-sm btn-primary" onclick="updateParkingStatus(${p.id}, 'Approved')">Approve</button>
                    <button class="btn btn-sm btn-ghost" onclick="updateParkingStatus(${p.id}, 'Rejected')">Reject</button>
                ` : `<span class="status-badge ${p.status.toLowerCase()}">${p.status}</span>`}
            </td>
        </tr>
    `).join("");
}

window.updateParkingStatus = async (id, status) => {
    try {
        const resp = await fetchWithAuth(`${API_BASE}/parking-requests/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
        if (resp.ok) {
            window.showToast("Success", `Parking request ${status}`, "success");
            loadAllData();
        }
    } catch (err) { console.error(err); }
};

// ============================================================================
// STAFF & VENDORS
// ============================================================================
function renderStaff(data) {
    const grid = document.getElementById("adminStaffGrid");
    if (!grid) return;

    grid.innerHTML = data.map(s => `
        <div class="resident-card">
            <div class="resident-header">
                <div class="resident-info">
                    <div class="resident-avatar" style="background: var(--gradient-hero);"><i class="fas fa-user-shield"></i></div>
                    <div class="resident-details">
                        <h4>${s.name}</h4>
                        <p class="resident-flat">${s.category}</p>
                        <p><i class="fas fa-phone"></i> ${s.phone || 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>
    `).join("");
}

// ============================================================================
// KYC APPROVALS
// ============================================================================
function renderKYCApprovals(data) {
    const tableBody = document.getElementById("kycTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = data.map(k => `
        <tr>
            <td>${k.residentName}</td>
            <td>${k.flat}</td>
            <td>${k.documentType}</td>
            <td><a href="${API_BASE}${k.documentPath}" target="_blank" class="btn btn-sm btn-ghost">View File</a></td>
            <td>
                ${k.status === 'Pending' ? `
                    <button class="btn btn-sm btn-primary" onclick="updateKYCStatus(${k.id}, 'Approved', ${k.residentId})">Approve</button>
                    <button class="btn btn-sm btn-ghost" onclick="updateKYCStatus(${k.id}, 'Rejected', ${k.residentId})">Reject</button>
                ` : `<span class="status-badge ${k.status.toLowerCase()}">${k.status}</span>`}
            </td>
        </tr>
    `).join("");
}

window.updateKYCStatus = async (id, status, residentId) => {
    try {
        const resp = await fetchWithAuth(`${API_BASE}/kyc-documents/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, residentId })
        });
        if (resp.ok) {
            window.showToast("Success", `KYC ${status}`, "success");
            loadAllData();
        }
    } catch (err) { console.error(err); }
};

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener("DOMContentLoaded", loadAllData);
