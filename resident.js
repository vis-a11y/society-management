// ============================================================================
// RESIDENT PORTAL - UNIFIED JAVASCRIPT
// Consolidates all resident functionality into one file
// ============================================================================

const API_BASE = "http://localhost:5000/api";

// ============================================================================
// GLOBAL STATE
// ============================================================================
let currentResident = null;
let myBills = [];
let myComplaints = [];
let allNotices = [];
let allPolls = [];
let myBookings = [];
let myVisitors = [];
let allSkills = [];
let myCreditScore = null;
let leaderboard = [];

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
if (!currentUser.id) {
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

// Mobile Menu
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("active");
        sidebarOverlay.classList.toggle("active");
    });
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", () => {
        sidebar.classList.remove("active");
        sidebarOverlay.classList.remove("active");
    });
}

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

window.showRaiseComplaintModal = () => showModal('raiseComplaintModal');
window.showBookFacilityModal = (facilityName) => {
    document.getElementById('facilityName').value = facilityName;
    document.getElementById('facilityDisplay').value = facilityName;
    showModal('bookFacilityModal');
};
window.showAddVisitorModal = () => showModal('addVisitorModal');
window.closeModal = closeModal;

// ============================================================================
// DATA LOADING
// ============================================================================
async function loadAllData() {
    initializeTheme();
    document.body.classList.add('loading');
    
    try {
        // Get current resident info
        const residentId = currentUser.residentId;
        
        if (!residentId) {
            console.warn("No residentId found for current user");
        }

        const [resResp, billsResp, compResp, noticesResp, pollsResp, bookingsResp, visitorsResp, energyResp, parkResp, kycResp, servResp, predResp] = await Promise.all([
            fetchWithAuth(`${API_BASE}/residents/${residentId || '0'}`).catch(() => ({ json: async () => null })),
            fetchWithAuth(`${API_BASE}/fees?residentId=${residentId || '0'}`).catch(() => ({ json: async () => [] })),
            fetchWithAuth(`${API_BASE}/complaints?residentId=${residentId || '0'}`).catch(() => ({ json: async () => [] })),
            fetchWithAuth(`${API_BASE}/announcements`).catch(() => ({ json: async () => [] })),
            fetchWithAuth(`${API_BASE}/polls`).catch(() => ({ json: async () => [] })),
            fetchWithAuth(`${API_BASE}/bookings?residentId=${residentId || '0'}`).catch(() => ({ json: async () => [] })),
            fetchWithAuth(`${API_BASE}/visitors?residentId=${residentId || '0'}`).catch(() => ({ json: async () => [] })),
            fetchWithAuth(`${API_BASE}/energy-usage?residentId=${residentId || '0'}`).catch(() => ({ json: async () => [] })),
            fetchWithAuth(`${API_BASE}/parking-requests?residentId=${residentId || '0'}`).catch(() => ({ json: async () => [] })),
            fetchWithAuth(`${API_BASE}/kyc-documents?residentId=${residentId || '0'}`).catch(() => ({ json: async () => [] })),
            fetchWithAuth(`${API_BASE}/service-providers`).catch(() => ({ json: async () => [] })),
            fetchWithAuth(`${API_BASE}/predictions/maintenance`).catch(() => ({ json: async () => [] }))
        ]);

        currentResident = await resResp.json();
        myBills = await billsResp.json();
        myComplaints = await compResp.json();
        allNotices = await noticesResp.json();
        allPolls = await pollsResp.json();
        myBookings = await bookingsResp.json();
        myVisitors = await visitorsResp.json();
        const energyData = await energyResp.json();
        const parkingData = await parkResp.json();
        const kycData = await kycResp.json();
        const providersData = await servResp.json();
        const predictions = await predResp.json();

        renderDashboard(predictions);
        renderNotices();
        renderPolls();
        renderBills();
        renderMyComplaints();
        renderMyBookings();
        renderVisitors();
        renderProfile();
        renderEnergy(energyData);
        renderParking(parkingData);
        renderKYC(kycData);
        renderHealth();
        renderServiceProviders(providersData);

        // Load Skills and Gamification data if available
        if (typeof loadSkills === 'function') await loadSkills();
        if (typeof loadCreditScore === 'function') await loadCreditScore();
        if (typeof loadLeaderboard === 'function') await loadLeaderboard();
    } catch (err) {
        console.error("Failed to load data", err);
    } finally {
        document.body.classList.remove('loading');
    }
}

// ============================================================================
// DASHBOARD RENDERING
// ============================================================================
function renderDashboard(predictions = []) {
    // Update welcome message
    const welcomeUser = document.getElementById("welcomeUser");
    if (welcomeUser && currentResident) {
        welcomeUser.textContent = `Welcome, ${currentResident.name}!`;
    }

    // Calculate stats
    const totalBalance = myBills.filter(b => b.status === 'Pending').reduce((sum, b) => sum + parseInt(b.amount || 0), 0);
    const pendingComplaints = myComplaints.filter(c => c.status === 'Pending').length;
    const activeBookings = myBookings.filter(b => b.status === 'Confirmed').length;

    // Update stat cards
    const balanceElem = document.getElementById("myBalance");
    const complaintsElem = document.getElementById("myComplaints");
    const bookingsElem = document.getElementById("myBookings");

    if (balanceElem) balanceElem.textContent = "₹" + totalBalance.toLocaleString();
    if (complaintsElem) complaintsElem.textContent = pendingComplaints;
    if (bookingsElem) bookingsElem.textContent = activeBookings;

    // Animate charts
    setTimeout(() => {
        const balanceChart = document.getElementById("balanceChart");
        const complaintsChart = document.getElementById("complaintsChart");
        const bookingsChart = document.getElementById("bookingsChart");

        if (balanceChart) balanceChart.style.width = totalBalance > 0 ? "100%" : "0%";
        if (complaintsChart) complaintsChart.style.width = (pendingComplaints / 5 * 100) + "%";
        if (bookingsChart) bookingsChart.style.width = (activeBookings / 3 * 100) + "%";
    }, 100);

    // AI Maintenance Alert Rendering
    const aiAlertsList = document.getElementById("aiAlertsList");
    if (aiAlertsList && predictions.length > 0) {
        aiAlertsList.innerHTML = predictions.map(p => `
            <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: var(--muted); border-radius: var(--radius-md); margin-bottom: 0.75rem; border-left: 3px solid ${p.riskScore === 'High' ? '#ef4444' : (p.riskScore === 'Medium' ? '#f59e0b' : '#10b981')};">
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 0.95rem;">${p.equipment}</div>
                    <div style="font-size: 0.8rem; color: var(--muted-foreground);">${p.prediction}</div>
                </div>
                <div style="text-align: right;">
                    <div class="status-badge ${p.riskScore.toLowerCase()}" style="font-size: 0.7rem;">${p.riskScore} Risk</div>
                    <div style="font-size: 0.7rem; color: var(--muted-foreground); margin-top: 2px;">Due: ${p.nextServiceDate}</div>
                </div>
            </div>
        `).join("");
    } else if (aiAlertsList) {
        aiAlertsList.innerHTML = '<p class="muted">Infrastructure check complete. All systems stable.</p>';
    }

    // Render activity timeline
    renderActivityTimeline();
}

function renderActivityTimeline() {
    const timeline = document.getElementById("activityTimeline");
    if (!timeline) return;

    const activities = [
        ...myComplaints.slice(0, 3).map(c => ({ type: 'complaint', text: `Complaint: ${c.title}`, date: c.date })),
        ...myBills.slice(0, 3).map(b => ({ type: 'bill', text: `Bill for ${b.month}`, date: b.month })),
        ...allNotices.slice(0, 2).map(n => ({ type: 'notice', text: n.title, date: n.date }))
    ].slice(0, 5);

    if (activities.length === 0) {
        timeline.innerHTML = '<p class="muted">No recent activity</p>';
        return;
    }

    timeline.innerHTML = activities.map(a => `
        <div style="padding: 1rem; border-left: 3px solid var(--primary); margin-bottom: 1rem; background: var(--muted); border-radius: var(--radius-md);">
            <p style="margin: 0; font-weight: 500;">${a.text}</p>
            <p class="muted" style="margin: 0.25rem 0 0; font-size: 0.85rem;">${a.date}</p>
        </div>
    `).join("");
}

// ============================================================================
// NOTICES RENDERING
// ============================================================================
function renderNotices() {
    const noticesList = document.getElementById("noticesList");
    if (!noticesList) return;

    if (allNotices.length === 0) {
        noticesList.innerHTML = '<p class="muted">No notices available</p>';
        return;
    }

    noticesList.innerHTML = allNotices.map(notice => `
        <div class="card mb-2">
            <div class="card-header">
                <h3>${notice.title}</h3>
            </div>
            <div class="card-content">
                <p><i class="fas fa-calendar"></i> ${notice.date}</p>
                <p>${notice.content || 'No description provided'}</p>
            </div>
        </div>
    `).join("");
}

// ============================================================================
// POLLS RENDERING
// ============================================================================
function renderPolls() {
    const pollsList = document.getElementById("pollsList");
    if (!pollsList) return;

    if (allPolls.length === 0) {
        pollsList.innerHTML = '<p class="muted">No active polls</p>';
        return;
    }

    pollsList.innerHTML = allPolls.map(poll => {
        const options = JSON.parse(poll.options || '[]');
        return `
            <div class="card mb-2">
                <div class="card-header">
                    <h3>${poll.question}</h3>
                </div>
                <div class="card-content">
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        ${options.map((opt, idx) => `
                            <button class="btn btn-outline" onclick="votePoll(${poll.id}, ${idx})">${opt}</button>
                        `).join("")}
                    </div>
                    <p class="muted mt-2"><i class="fas fa-clock"></i> Expires: ${poll.expiresAt}</p>
                </div>
            </div>
        `;
    }).join("");
}

window.votePoll = async (pollId, optionIndex) => {
    try {
        const response = await fetchWithAuth(`${API_BASE}/polls/${pollId}/vote`, {
            method: 'POST',
            body: JSON.stringify({ optionIndex })
        });

        if (response.ok) {
            if (window.showToast) {
                window.showToast('Success', 'Vote recorded successfully!', 'success');
            }
            await loadAllData();
        }
    } catch (err) {
        console.error("Failed to vote", err);
    }
};

// ============================================================================
// BILLS RENDERING
// ============================================================================
function renderBills() {
    const billsTableBody = document.getElementById("billsTableBody");
    if (!billsTableBody) return;

    if (myBills.length === 0) {
        billsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #999;">No bills found</td></tr>';
        return;
    }

    billsTableBody.innerHTML = myBills.map(bill => `
        <tr>
            <td>${bill.month}</td>
            <td>₹${parseInt(bill.amount).toLocaleString()}</td>
            <td><span class="status-badge ${bill.status.toLowerCase()}">${bill.status}</span></td>
            <td>${bill.dueDate || 'N/A'}</td>
            <td>
                ${bill.status === 'Pending' ? 
                    `<button class="btn btn-sm btn-primary" onclick="initiatePayment(${bill.id}, ${bill.amount}, '${bill.month}')">
                        <i class="fas fa-credit-card"></i> Pay Now
                    </button>` : 
                    `<button class="btn btn-sm btn-outline" onclick="downloadReceipt(${bill.id}, '${bill.month}', ${bill.amount}, '${bill.paymentId || ''}')">
                        <i class="fas fa-download"></i> Receipt
                    </button>`
                }
            </td>
        </tr>
    `).join("");
}

// ============================================================================
// COMPLAINTS RENDERING
// ============================================================================
function renderMyComplaints() {
    const myComplaintsList = document.getElementById("myComplaintsList");
    if (!myComplaintsList) return;

    if (myComplaints.length === 0) {
        myComplaintsList.innerHTML = '<p class="muted">No complaints submitted</p>';
        return;
    }

    myComplaintsList.innerHTML = myComplaints.map(c => `
        <div class="card mb-2" style="border-left: 4px solid ${c.status === 'Resolved' ? '#10b981' : '#ef4444'}">
            <div class="card-content">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h4>${c.title}</h4>
                        <p class="muted" style="font-size: 0.85rem;">${c.date}</p>
                    </div>
                    <span class="status-badge ${c.status.toLowerCase()}">${c.status}</span>
                </div>
                <p>${c.desc}</p>
                ${c.imagePath ? `<img src="http://localhost:5000${c.imagePath}" alt="Complaint Image" style="max-width: 100%; max-height: 300px; border-radius: var(--radius-md); margin-top: 1rem; cursor: pointer;" onclick="window.open('http://localhost:5000${c.imagePath}', '_blank')">` : ''}
                <span class="priority-badge priority-${(c.priority || 'normal').toLowerCase()}">${c.priority || 'Normal'}</span>
            </div>
        </div>
    `).join("");
}

// Raise Complaint Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const raiseComplaintForm = document.getElementById('raiseComplaintForm');
    if (raiseComplaintForm) {
        raiseComplaintForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('title', document.getElementById('complaintTitle').value.trim());
            formData.append('desc', document.getElementById('complaintDesc').value.trim());
            formData.append('category', document.getElementById('complaintCategory').value);
            formData.append('priority', document.getElementById('complaintPriority').value);
            formData.append('flat', currentResident?.flat || currentUser.flat);
            formData.append('date', new Date().toLocaleDateString());
            formData.append('status', 'Pending');
            formData.append('residentId', currentResident?.id || currentUser.residentId);
            
            // Add image if selected
            const imageFile = document.getElementById('complaintImage').files[0];
            if (imageFile) {
                // Validate file size (5MB max)
                if (imageFile.size > 5 * 1024 * 1024) {
                    if (window.showToast) {
                        window.showToast('Error', 'Image size must be less than 5MB', 'error');
                    }
                    return;
                }
                formData.append('image', imageFile);
            }

            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE}/complaints`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (response.ok) {
                    if (window.showToast) {
                        window.showToast('Success', 'Complaint submitted successfully!', 'success');
                    }
                    closeModal('raiseComplaintModal');
                    await loadAllData();
                }
            } catch (err) {
                console.error("Error submitting complaint", err);
                if (window.showToast) {
                    window.showToast('Error', 'Failed to submit complaint', 'error');
                }
            }
        });
    }
});

// ============================================================================
// BOOKINGS RENDERING
// ============================================================================
function renderMyBookings() {
    const myBookingsTableBody = document.getElementById("myBookingsTableBody");
    if (!myBookingsTableBody) return;

    if (myBookings.length === 0) {
        myBookingsTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #999;">No bookings found</td></tr>';
        return;
    }

    myBookingsTableBody.innerHTML = myBookings.map(b => `
        <tr>
            <td>${b.facility}</td>
            <td>${b.date}</td>
            <td>${b.time}</td>
            <td><span class="status-badge ${b.status.toLowerCase()}">${b.status}</span></td>
        </tr>
    `).join("");
}

// Book Facility Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const bookFacilityForm = document.getElementById('bookFacilityForm');
    if (bookFacilityForm) {
        bookFacilityForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newBooking = {
                facility: document.getElementById('facilityName').value,
                date: document.getElementById('bookingDate').value,
                time: document.getElementById('bookingTime').value,
                residentName: currentResident?.name || currentUser.name,
                status: 'Pending'
            };

            try {
                const response = await fetchWithAuth(`${API_BASE}/bookings`, {
                    method: 'POST',
                    body: JSON.stringify(newBooking)
                });

                if (response.ok) {
                    if (window.showToast) {
                        window.showToast('Success', 'Booking request submitted!', 'success');
                    }
                    closeModal('bookFacilityModal');
                    await loadAllData();
                }
            } catch (err) {
                console.error("Error booking facility", err);
            }
        });
    }
});

// ============================================================================
// VISITORS RENDERING
// ============================================================================
function renderVisitors() {
    const visitorsTableBody = document.getElementById("visitorsTableBody");
    if (!visitorsTableBody) return;

    if (myVisitors.length === 0) {
        visitorsTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #999;">No visitors registered</td></tr>';
        return;
    }

    visitorsTableBody.innerHTML = myVisitors.map(v => `
        <tr>
            <td>${v.name}</td>
            <td>${v.purpose}</td>
            <td>${v.date}</td>
            <td>
                <span class="status-badge ${v.status.toLowerCase()}">${v.status}</span>
                <button class="btn btn-ghost btn-sm" onclick="showVisitorQR('${v.name}', '${v.flat}')" style="margin-left: 0.5rem; font-size: 0.7rem;">
                    <i class="fas fa-qrcode"></i> Pass
                </button>
            </td>
        </tr>
    `).join("");
}

window.showVisitorQR = (name, flat) => {
    alert(`QR Entry Pass for ${name} (Flat ${flat})\n\n[SIMULATED QR CODE]\nValid for entry today.`);
};

// Add Visitor Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const addVisitorForm = document.getElementById('addVisitorForm');
    if (addVisitorForm) {
        addVisitorForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newVisitor = {
                name: document.getElementById('visitorName').value.trim(),
                purpose: document.getElementById('visitorPurpose').value.trim(),
                date: document.getElementById('visitorDate').value,
                flat: currentResident?.flat || currentUser.flat,
                residentId: currentResident?.id || currentUser.residentId,
                status: 'Approved'
            };

            try {
                const response = await fetchWithAuth(`${API_BASE}/visitors`, {
                    method: 'POST',
                    body: JSON.stringify(newVisitor)
                });

                if (response.ok) {
                    if (window.showToast) {
                        window.showToast('Success', 'Visitor registered successfully!', 'success');
                    }
                    closeModal('addVisitorModal');
                    await loadAllData();
                }
            } catch (err) {
                console.error("Error adding visitor", err);
            }
        });
    }
});

// ============================================================================
// PROFILE RENDERING
// ============================================================================
function renderProfile() {
    const name = document.getElementById("profName");
    const flat = document.getElementById("profFlat");
    const id = document.getElementById("profId");
    const park = document.getElementById("profParking");
    const role = document.getElementById("profRole");
    const credit = document.getElementById("profCredit");

    if (name) name.textContent = currentResident?.name || (currentUser.id);
    if (flat) flat.textContent = (currentResident?.flat || currentUser.flat) + (currentResident?.wing ? ` (Wing ${currentResident.wing})` : '');
    if (id) id.textContent = "#" + (currentResident?.id || 'N/A');
    if (park) park.textContent = currentResident?.parkingSlot || 'Unassigned';
    if (role) role.textContent = currentResident?.residentType || 'Owner';
    if (credit) credit.textContent = currentResident?.totalPoints || '0';
}

// ============================================================================
// PAYMENT PROCESSING (Razorpay)
// ============================================================================
window.initiatePayment = async (billId, amount, month) => {
    try {
        // Create Razorpay order
        const orderResponse = await fetchWithAuth(`${API_BASE}/payment/create-order`, {
            method: 'POST',
            body: JSON.stringify({ amount, billId, month })
        });

        const orderData = await orderResponse.json();

        const options = {
            key: orderData.key_id, // Razorpay Key ID from backend
            amount: orderData.amount,
            currency: "INR",
            name: "SocietyHub",
            description: `Maintenance Bill - ${month}`,
            order_id: orderData.id,
            handler: async function (response) {
                // Payment successful
                try {
                    const verifyResponse = await fetchWithAuth(`${API_BASE}/payment/verify`, {
                        method: 'POST',
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            billId: billId
                        })
                    });

                    if (verifyResponse.ok) {
                        if (window.showToast) {
                            window.showToast('Success', 'Payment successful!', 'success');
                        }
                        await loadAllData(); // Reload data to show updated status
                    }
                } catch (err) {
                    console.error("Payment verification failed", err);
                    if (window.showToast) {
                        window.showToast('Error', 'Payment verification failed', 'error');
                    }
                }
            },
            prefill: {
                name: currentResident?.name || currentUser.name,
                email: currentResident?.email || "",
                contact: currentResident?.phone || ""
            },
            theme: {
                color: "#667eea"
            }
        };

        const razorpay = new Razorpay(options);
        razorpay.on('payment.failed', function (response) {
            if (window.showToast) {
                window.showToast('Error', 'Payment failed. Please try again.', 'error');
            }
        });
        razorpay.open();
    } catch (err) {
        console.error("Failed to initiate payment", err);
        if (window.showToast) {
            window.showToast('Error', 'Failed to initiate payment', 'error');
        }
    }
};

// ============================================================================
// PDF RECEIPT GENERATION
// ============================================================================
window.downloadReceipt = (billId, month, amount, paymentId) => {
    // Create a simple HTML receipt and print it
    const receiptWindow = window.open('', '_blank');
    const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Payment Receipt - ${month}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 40px auto;
                    padding: 20px;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #667eea;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #667eea;
                    margin: 0;
                }
                .receipt-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px;
                    border-bottom: 1px solid #eee;
                }
                .info-label {
                    font-weight: bold;
                    color: #555;
                }
                .amount-box {
                    background: #f0f4ff;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    margin: 30px 0;
                }
                .amount-box h2 {
                    color: #667eea;
                    margin: 0;
                    font-size: 2rem;
                }
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    color: #999;
                }
                @media print {
                    .no-print {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏢 SocietyHub</h1>
                <p>Maintenance Payment Receipt</p>
            </div>
            
            <div class="receipt-info">
                <div>
                    <div class="info-row">
                        <span class="info-label">Receipt No:</span>
                        <span>RCP-${billId}-${Date.now()}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Date:</span>
                        <span>${new Date().toLocaleDateString()}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Resident:</span>
                        <span>${currentResident?.name || currentUser.name}</span>
                    </div>
                </div>
                <div>
                    <div class="info-row">
                        <span class="info-label">Flat:</span>
                        <span>${currentResident?.flat || currentUser.flat}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Month:</span>
                        <span>${month}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Payment ID:</span>
                        <span>${paymentId || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <div class="amount-box">
                <p style="margin: 0; color: #666;">Amount Paid</p>
                <h2>₹${parseInt(amount).toLocaleString()}</h2>
            </div>
            
            <div class="footer">
                <p>Thank you for your payment!</p>
                <p style="font-size: 0.9rem;">This is a computer-generated receipt and does not require a signature.</p>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 30px;">
                <button onclick="window.print()" style="padding: 10px 30px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1rem;">
                    Print Receipt
                </button>
                <button onclick="window.close()" style="padding: 10px 30px; background: #999; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1rem; margin-left: 10px;">
                    Close
                </button>
            </div>
        </body>
        </html>
    `;
    
    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
};

// ============================================================================
// EMERGENCY SOS
// ============================================================================
window.triggerSOS = async () => {
    if (!confirm("Are you sure you want to trigger an Emergency SOS Alert? This will notify security and admin immediately.")) return;
    
    try {
        const response = await fetchWithAuth(`${API_BASE}/sos`, {
            method: 'POST',
            body: JSON.stringify({
                flat: currentResident?.flat || "Unknown",
                wing: currentResident?.wing || "Unknown"
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (window.showToast) {
                window.showToast('SOS ALARM SENT', data.message, 'error');
            }
        }
    } catch (err) {
        console.error("SOS trigger failed", err);
    }
};

// ============================================================================
// ENERGY RENDERING
// ============================================================================
function renderEnergy(data) {
    if (data && data.length > 0) {
        const latest = data[0]; 
        const elec = document.getElementById("elecUnits");
        const water = document.getElementById("waterUnits");
        if (elec) elec.textContent = `${latest.electricityUnits} Units`;
        if (water) water.textContent = `${latest.waterUnits} Units`;

        // Modern Visual: Progress bars for usage vs limit
        const elecBar = document.getElementById("elecBar");
        const waterBar = document.getElementById("waterBar");
        if (elecBar) {
            const pct = Math.min((latest.electricityUnits / 200) * 100, 100);
            elecBar.style.width = pct + "%";
            elecBar.style.background = pct > 80 ? "#ef4444" : "var(--primary)";
        }
        if (waterBar) {
            const pct = Math.min((latest.waterUnits / 100) * 100, 100);
            waterBar.style.width = pct + "%";
            waterBar.style.background = pct > 80 ? "#ef4444" : "#4facfe";
        }
    }
}

// ============================================================================
// SOCIETY HEALTH & METRICS
// ============================================================================
async function renderHealth() {
    try {
        const resp = await fetchWithAuth(`${API_BASE}/society-info`);
        const info = await resp.json();
        const scoreElem = document.getElementById("healthScore");
        if (scoreElem && info.healthScore) {
            scoreElem.textContent = `${info.healthScore}%`;
            scoreElem.className = info.healthScore > 90 ? "success" : (info.healthScore > 70 ? "warning" : "danger");
        }
    } catch (err) { console.warn("Could not fetch health score", err); }
}

// ============================================================================
// PARKING MANAGEMENT
// ============================================================================
function renderParking(data) {
    const tableBody = document.getElementById("parkingTableBody");
    if (!tableBody) return;

    if (currentResident && currentResident.parkingSlot) {
        document.getElementById("myParkingSlot").textContent = currentResident.parkingSlot;
    }

    tableBody.innerHTML = data.map(p => `
        <tr>
            <td>${p.visitorName}</td>
            <td>${p.vehicleNumber}</td>
            <td>${p.stayDuration}</td>
            <td><span class="status-badge ${p.status.toLowerCase()}">${p.status}</span></td>
        </tr>
    `).join("");
}

document.getElementById("guestParkingForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
        visitorName: document.getElementById("parkingGuestName").value,
        vehicleNumber: document.getElementById("parkingVehicleNo").value,
        stayDuration: document.getElementById("parkingDuration").value
    };

    try {
        const resp = await fetchWithAuth(`${API_BASE}/parking-requests`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (resp.ok) {
            window.showToast("Success", "Parking request submitted", "success");
            closeModal("guestParkingModal");
            loadAllData();
        }
    } catch (err) { console.error(err); }
});

// ============================================================================
// SERVICE PROVIDERS
// ============================================================================
function renderServiceProviders(data) {
    const grid = document.getElementById("serviceProvidersGrid");
    if (!grid) return;

    grid.innerHTML = data.map(s => `
        <div class="resident-card">
            <div class="resident-header">
                <div class="resident-info">
                    <div class="resident-avatar" style="background: var(--gradient-success);"><i class="fas fa-user-cog"></i></div>
                    <div class="resident-details">
                        <h4>${s.name}</h4>
                        <p class="resident-flat">${s.category}</p>
                        <p><i class="fas fa-star" style="color: gold;"></i> ${s.rating} Rating</p>
                    </div>
                </div>
            </div>
            <div style="padding: 1rem; border-top: 1px solid var(--border); text-align: center;">
                <button class="btn btn-primary" onclick="openBookingModal(${s.id}, '${s.name}')">Book Now</button>
            </div>
        </div>
    `).join("");
}

window.openBookingModal = (id, name) => {
    document.getElementById("serviceProviderId").value = id;
    document.getElementById("serviceProviderName").value = name;
    showModal("bookServiceModal");
};

// ============================================================================
// KYC & VERIFICATION
// ============================================================================
function renderKYC(data) {
    const list = document.getElementById("uploadedDocsList");
    if (!list) return;

    if (currentResident) {
        const kycStatusHeader = document.getElementById("kycStatusHeader");
        kycStatusHeader.textContent = `Status: ${currentResident.kycStatus || 'Pending'}`;
        kycStatusHeader.style.color = currentResident.kycStatus === 'Verified' ? 'var(--secondary)' : 'var(--accent)';
    }

    if (data.length === 0) {
        list.innerHTML = '<p class="muted">No documents uploaded yet.</p>';
        return;
    }

    list.innerHTML = data.map(d => `
        <div class="card" style="padding: 1rem; border-left: 4px solid var(--primary);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${d.documentType}</strong>
                    <p class="muted" style="margin: 0; font-size: 0.8rem;">Uploaded on ${new Date(d.createdAt).toLocaleDateString()}</p>
                </div>
                <span class="status-badge ${d.status.toLowerCase()}">${d.status}</span>
            </div>
        </div>
    `).join("");
}

document.getElementById("uploadDocsForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("documentType", document.getElementById("docType").value);
    formData.append("document", document.getElementById("verificationDoc").files[0]);

    try {
        const resp = await fetch(`${API_BASE}/kyc-documents`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });
        if (resp.ok) {
            window.showToast("Success", "Document uploaded for verification", "success");
            closeModal("uploadDocsModal");
            loadAllData();
        }
    } catch (err) { console.error(err); }
});

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener("DOMContentLoaded", loadAllData);
