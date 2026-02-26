// Society Management JavaScript
const API_BASE = "http://localhost:5000/api";

// Helper for authenticated requests
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
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

// Global data states (will be populated by API)
let allResidents = [];
let allAnnouncements = [];
let allEvents = [];
let allComplaints = []; // Added to track count on dashboard

// DOM Elements
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const residentsGrid = document.getElementById('residentsGrid');
const residentSearch = document.getElementById('residentSearch');
const pinnedAnnouncements = document.getElementById('pinnedAnnouncements');
const recentAnnouncements = document.getElementById('recentAnnouncements');
const upcomingEventsList = document.getElementById('upcomingEventsList');

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    initializeTheme(); // Add theme initialization
    initializeNavigation();
    initializeMobileMenu();
    await loadInitialData();
});

// Theme Management
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

async function loadInitialData() {
    document.body.classList.add('loading');
    
    try {
        const [resResponse, annResponse, evtResponse, cmpResponse] = await Promise.all([
            fetchWithAuth(`${API_BASE}/residents`),
            fetchWithAuth(`${API_BASE}/announcements`),
            fetchWithAuth(`${API_BASE}/events`),
            fetchWithAuth(`${API_BASE}/complaints`)
        ]);

        allResidents = await resResponse.json();
        allAnnouncements = await annResponse.json();
        allEvents = await evtResponse.json();
        allComplaints = await cmpResponse.json();

        renderResidents();
        renderAnnouncements();
        renderEvents();
        updateDashboardStats();
        initializeSearch();
    } catch (err) {
        console.error("Load failed", err);
        if (window.showToast) window.showToast('Error', 'Failed to load data from server', 'error');
    } finally {
        document.body.classList.remove('loading');
    }
}

// Update Dashboard Stats from API Data
function updateDashboardStats() {
    // Determine current resident context (Simulated for UI demonstration)
    // In a real app, this would come from the JWT profile info
    const currentResident = allResidents[0] || { name: 'Resident', flat: 'A-101', status: 'Active' };
    
    // Personal Portal Elements
    const welcomeUser = document.getElementById('welcomeUser');
    const myBalance = document.getElementById('myBalance');
    const myFlatNo = document.getElementById('myFlatNo');
    const myActiveComplaints = document.getElementById('myActiveComplaints');
    const upcomingEvtCount = document.getElementById('upcomingEventsCount');

    if (welcomeUser) welcomeUser.textContent = `Welcome, ${currentResident.name.split(' ')[0]}`;
    if (myFlatNo) myFlatNo.textContent = currentResident.flat;
    
    // Mocking personal data based on overall state
    const personalComplaints = allComplaints.filter(c => c.flat === currentResident.flat && c.status === 'Pending').length;
    const balance = currentResident.status === 'Active' ? 0 : 2000;

    if (myBalance) {
        myBalance.textContent = "₹" + balance.toLocaleString();
        const statusElem = document.getElementById('balanceStatus');
        if (statusElem) {
            statusElem.className = balance > 0 ? 'stat-change negative' : 'stat-change positive';
            statusElem.innerHTML = balance > 0 ? '<i class="fas fa-exclamation-circle"></i> Payment Overdue' : '<i class="fas fa-check-circle"></i> Up to date';
        }
    }

    if (myActiveComplaints) myActiveComplaints.textContent = personalComplaints;
    if (upcomingEvtCount) upcomingEvtCount.textContent = allEvents.length;
    
    // Animate Personal Dashboard Charts
    animateChart('balanceChart', balance > 0 ? 50 : 100, 100);
    animateChart('paymentChart', balance === 0 ? 100 : 0, 100);
    animateChart('complaintChart', personalComplaints, 5); // 5+ complaints is "critical" for bar

    renderActivityTimeline(); // Restore timeline rendering
}

function renderActivityTimeline() {
    const timeline = document.getElementById('activityTimeline');
    if (!timeline) return;

    // Merge complaints and events for a unified log
    const activities = [
        ...allComplaints.slice(0, 3).map(c => ({
            time: c.date || 'Today',
            title: `Complaint: ${c.title}`,
            desc: `Status: ${c.status} | Flat: ${c.flat}`,
            type: 'complaint'
        })),
        ...allEvents.slice(0, 2).map(e => ({
            time: e.date,
            title: `Event: ${e.title}`,
            desc: `${e.time} | ${e.description}`,
            type: 'event'
        }))
    ];

    if (activities.length === 0) {
        timeline.innerHTML = '<p class="muted" style="padding: 1rem; text-align: center;">No recent activities.</p>';
        return;
    }

    timeline.innerHTML = activities.map(act => `
        <div class="timeline-item">
            <div class="timeline-dot" style="background: ${act.type === 'complaint' ? 'var(--primary)' : 'var(--society-secondary)'}"></div>
            <div class="timeline-content">
                <span class="timeline-time">${act.time}</span>
                <h4 class="timeline-title">${act.title}</h4>
                <p class="timeline-desc">${act.desc}</p>
            </div>
        </div>
    `).join("");
}

function animateChart(id, current, max) {
    const bar = document.getElementById(id);
    if (bar) {
        const pct = Math.min((current / max) * 100, 100);
        setTimeout(() => bar.style.width = pct + "%", 100);
    }
}

// Navigation functionality
function initializeNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetPage = item.getAttribute('data-page');
            switchPage(targetPage);
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            closeMobileMenu();
        });
    });
}

function switchPage(pageId) {
    pages.forEach(page => page.classList.remove('active'));
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');
}

// Mobile menu functionality
function initializeMobileMenu() {
    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMobileMenu);
}

function toggleMobileMenu() {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('show');
}

function closeMobileMenu() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('show');
}

// Residents functionality
function renderResidents(filteredResidents) {
    if (!residentsGrid) return;

    const finalResidents = filteredResidents || allResidents;
    residentsGrid.innerHTML = '';

    finalResidents.forEach(resident => {
        const card = createResidentCard(resident);
        residentsGrid.appendChild(card);
    });
}

function createResidentCard(resident) {
    const card = document.createElement('div');
    card.className = 'resident-card';
    
    card.innerHTML = `
        <div class="resident-header">
            <div class="resident-info">
                <div class="resident-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="resident-details">
                    <h4>${resident.name}</h4>
                    <p class="resident-flat">Flat ${resident.flat}</p>
                </div>
            </div>
            <span class="status-badge ${resident.status.toLowerCase()}">${resident.status}</span>
        </div>
        <div class="resident-contacts">
            <div class="contact-item">
                <i class="fas fa-phone"></i>
                <span>${resident.phone}</span>
            </div>
            <div class="contact-item">
                <i class="fas fa-envelope"></i>
                <span>${resident.email}</span>
            </div>
        </div>
        <div class="resident-footer">
            <span class="join-date">Joined ${resident.joinDate}</span>
            <a href="resident_profile.html?id=${resident.id}" class="btn btn-ghost" style="padding: 0.5rem 1rem; text-decoration: none; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.85rem;">View Profile</a>
        </div>
    `;
    
    return card;
}

// Search functionality
function initializeSearch() {
    if (!residentSearch) return;
    residentSearch.addEventListener('input', e => {
        const term = e.target.value.toLowerCase();
        const filtered = allResidents.filter(r =>
            r.name.toLowerCase().includes(term) ||
            r.flat.toLowerCase().includes(term) ||
            (r.email && r.email.toLowerCase().includes(term))
        );
        renderResidents(filtered);
    });
}

// Announcements functionality
function renderAnnouncements() {
    if (pinnedAnnouncements) {
        const pinned = allAnnouncements.filter(ann => ann.isPinned);
        pinnedAnnouncements.innerHTML = '';
        pinned.forEach(ann => pinnedAnnouncements.appendChild(createAnnouncementCard(ann, true)));
    }
    
    if (recentAnnouncements) {
        const recent = allAnnouncements.filter(ann => !ann.isPinned);
        recentAnnouncements.innerHTML = '';
        recent.forEach(ann => recentAnnouncements.appendChild(createAnnouncementCard(ann, false)));
    }
}

function renderEvents() {
    if (!upcomingEventsList) return;
    
    upcomingEventsList.innerHTML = '';
    if (allEvents.length === 0) {
        upcomingEventsList.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 1rem;">No upcoming events</p>';
        return;
    }

    allEvents.slice(0, 3).forEach(event => {
        upcomingEventsList.appendChild(createEventItem(event));
    });
}

function createEventItem(event) {
    const item = document.createElement('div');
    item.className = 'event-item';
    
    item.innerHTML = `
        <div class="event-info">
            <p class="event-title">${event.title}</p>
            <p class="event-time">${event.time}</p>
        </div>
        <div class="event-date">${event.date}</div>
    `;
    
    return item;
}

function createAnnouncementCard(announcement, isPinned = false) {
    const card = document.createElement('div');
    card.className = `announcement-card${isPinned ? ' pinned' : ''}`;
    
    const typeClass = announcement.type ? announcement.type.toLowerCase() : 'notice';
    const iconMap = {
        'important': 'fas fa-exclamation-triangle',
        'maintenance': 'fas fa-wrench',
        'event': 'fas fa-calendar-check',
        'security': 'fas fa-shield-alt'
    };
    
    card.innerHTML = `
        <div class="announcement-header">
            <div class="announcement-info">
                <div class="announcement-icon">
                    <i class="${iconMap[typeClass] || 'fas fa-bell'}"></i>
                </div>
                <div class="announcement-details">
                    <h4>${announcement.title}</h4>
                    <div class="announcement-meta">
                        <span class="type-badge ${typeClass}">${announcement.type || 'Notice'}</span>
                        <span class="announcement-date">
                            <i class="fas fa-calendar"></i>
                            ${announcement.date}
                        </span>
                    </div>
                </div>
            </div>
            ${isPinned ? '<i class="fas fa-thumbtack"></i>' : ''}
        </div>
        <div class="announcement-content">
            <p class="announcement-text">${announcement.content}</p>
            <div class="announcement-footer">
                <button class="btn btn-ghost" onclick="readAnnouncement(${announcement.id})">Read More</button>
            </div>
        </div>
    `;
    
    return card;
}

function readAnnouncement(announcementId) {
    const announcement = allAnnouncements.find(ann => ann.id === announcementId);
    if (announcement) {
        if (window.showToast) {
            window.showToast(announcement.title, announcement.content, 'info');
        } else {
            alert(`${announcement.title}\n\n${announcement.content}`);
        }
    }
}

function quickAction(action) {
    if (window.showToast) {
        window.showToast('Action Triggered', `${action} functionality is coming soon!`, 'info');
    } else {
        alert(`${action} functionality would be implemented here`);
    }
}

// Loading States
function showLoading(element) {
    if (!element) return;
    element.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--muted-foreground);"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
}

// Complaint Submission Logic
document.addEventListener('DOMContentLoaded', () => {
    const complaintModal = document.getElementById('complaintModal');
    const closeComplaint = document.getElementById('closeComplaint');
    const complaintForm = document.getElementById('complaintForm');
    const quickActionsBtn = document.querySelector('.page-header .btn-primary');

    if (quickActionsBtn) {
        quickActionsBtn.addEventListener('click', () => {
            complaintModal.classList.remove('hidden');
        });
    }

    if (closeComplaint) {
        closeComplaint.addEventListener('click', () => {
            complaintModal.classList.add('hidden');
        });
    }

    if (complaintForm) {
        complaintForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newComplaint = {
                title: document.getElementById('compTitle').value,
                flat: document.getElementById('compFlat').value,
                desc: document.getElementById('compDesc').value,
                priority: document.getElementById('compPriority').value
            };

            try {
                const response = await fetchWithAuth(`${API_BASE}/complaints`, {
                    method: 'POST',
                    body: JSON.stringify(newComplaint)
                });

                if (response.ok) {
                    complaintForm.reset();
                    complaintModal.classList.add('hidden');
                    if (window.showToast) {
                        window.showToast('Complaint Submitted', 'Your request has been sent to the society office.', 'success');
                    }
                }
            } catch (err) {
                if (window.showToast) window.showToast('Error', 'Failed to submit complaint', 'error');
            }
        });
    }
});

// Export functions for global access
window.societyManagement = {
    switchPage,
    readAnnouncement,
    quickAction
};
    