// Society Management JavaScript

// Sample data
const residentsData = [
    {
        id: 1,
        name: "Rajesh Kumar",
        flat: "A-204",
        phone: "+91 98765 43210",
        email: "rajesh.kumar@email.com",
        status: "Active",
        joinDate: "Jan 2023",
    },
    {
        id: 2,
        name: "Priya Sharma",
        flat: "B-305",
        phone: "+91 87654 32109",
        email: "priya.sharma@email.com",
        status: "Active",
        joinDate: "Mar 2023",
    },
    {
        id: 3,
        name: "Amit Patel",
        flat: "C-102",
        phone: "+91 76543 21098",
        email: "amit.patel@email.com",
        status: "Pending",
        joinDate: "Aug 2024",
    },
    {
        id: 4,
        name: "Sunita Gupta",
        flat: "A-506",
        phone: "+91 65432 10987",
        email: "sunita.gupta@email.com",
        status: "Active",
        joinDate: "Nov 2022",
    },
    {
        id: 5,
        name: "Mohammed Ali",
        flat: "B-201",
        phone: "+91 55555 55555",
        email: "mohammed.ali@email.com",
        status: "Active",
        joinDate: "Jul 2023",
    },
    {
        id: 6,
        name: "Sneha Reddy",
        flat: "C-408",
        phone: "+91 44444 44444",
        email: "sneha.reddy@email.com",
        status: "Pending",
        joinDate: "Sep 2024",
    }
];

const announcementsData = [
    {
        id: 1,
        title: "Society AGM Meeting",
        content: "Annual General Meeting scheduled for September 15th at 6:00 PM in the community hall. All residents are requested to attend.",
        type: "Important",
        date: "2024-09-10",
        isPinned: true,
    },
    {
        id: 2,
        title: "Maintenance Work Notice",
        content: "Elevator maintenance will be conducted on September 18th from 10:00 AM to 4:00 PM. Please plan accordingly.",
        type: "Maintenance",
        date: "2024-09-08",
        isPinned: false,
    },
    {
        id: 3,
        title: "Festive Celebration",
        content: "Join us for Ganesh Chaturthi celebration on September 22nd at 7:00 PM. Cultural programs and dinner arranged.",
        type: "Event",
        date: "2024-09-05",
        isPinned: true,
    },
    {
        id: 4,
        title: "Security Guidelines",
        content: "Please ensure to carry your ID cards and register visitors at the gate. New security measures are now in effect.",
        type: "Security",
        date: "2024-09-03",
        isPinned: false,
    }
];

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

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeMobileMenu();
    renderResidents();
    renderAnnouncements();
    initializeSearch();
});

// Navigation functionality
function initializeNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetPage = item.getAttribute('data-page');
            switchPage(targetPage);
            
            // Update active navigation item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Close mobile menu if open
            closeMobileMenu();
        });
    });
}

function switchPage(pageId) {
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
}

// Mobile menu functionality
function initializeMobileMenu() {
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    sidebarOverlay.addEventListener('click', closeMobileMenu);
}

function toggleMobileMenu() {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('show');
}

function closeMobileMenu() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
}

// Residents functionality
function renderResidents(filteredResidents = residentsData) {
    if (!residentsGrid) return;
    
    residentsGrid.innerHTML = '';
    
    filteredResidents.forEach(resident => {
        const residentCard = createResidentCard(resident);
        residentsGrid.appendChild(residentCard);
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
            <button class="btn btn-ghost" onclick="viewResidentDetails(${resident.id})">View Details</button>
        </div>
    `;
    
    return card;
}

function viewResidentDetails(residentId) {
    const resident = residentsData.find(r => r.id === residentId);
    if (resident) {
        alert(`Viewing details for ${resident.name}\nFlat: ${resident.flat}\nStatus: ${resident.status}`);
    }
}

// Search functionality
function initializeSearch() {
    if (residentSearch) {
        residentSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredResidents = residentsData.filter(resident =>
                resident.name.toLowerCase().includes(searchTerm) ||
                resident.flat.toLowerCase().includes(searchTerm) ||
                resident.email.toLowerCase().includes(searchTerm)
            );
            renderResidents(filteredResidents);
        });
    }
}

// Announcements functionality
function renderAnnouncements() {
    renderPinnedAnnouncements();
    renderRecentAnnouncements();
}

function renderPinnedAnnouncements() {
    if (!pinnedAnnouncements) return;
    
    const pinned = announcementsData.filter(ann => ann.isPinned);
    pinnedAnnouncements.innerHTML = '';
    
    pinned.forEach(announcement => {
        const card = createAnnouncementCard(announcement, true);
        pinnedAnnouncements.appendChild(card);
    });
}

function renderRecentAnnouncements() {
    if (!recentAnnouncements) return;
    
    const recent = announcementsData.filter(ann => !ann.isPinned);
    recentAnnouncements.innerHTML = '';
    
    recent.forEach(announcement => {
        const card = createAnnouncementCard(announcement, false);
        recentAnnouncements.appendChild(card);
    });
}

function createAnnouncementCard(announcement, isPinned = false) {
    const card = document.createElement('div');
    card.className = `announcement-card${isPinned ? ' pinned' : ''}`;
    
    const typeClass = announcement.type.toLowerCase();
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
                        <span class="type-badge ${typeClass}">${announcement.type}</span>
                        <span class="announcement-date">
                            <i class="fas fa-calendar"></i>
                            ${formatDate(announcement.date)}
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

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function readAnnouncement(announcementId) {
    const announcement = announcementsData.find(ann => ann.id === announcementId);
    if (announcement) {
        alert(`${announcement.title}\n\n${announcement.content}\n\nType: ${announcement.type}\nDate: ${formatDate(announcement.date)}`);
    }
}

// Utility functions for interactive elements
function addResident() {
    alert('Add New Resident functionality would be implemented here');
}

function newAnnouncement() {
    alert('New Announcement functionality would be implemented here');
}

function quickAction(action) {
    alert(`${action} functionality would be implemented here`);
}

// Add event listeners for quick actions
document.addEventListener('DOMContentLoaded', function() {
    // Quick action buttons
    const quickActionBtns = document.querySelectorAll('.quick-action-btn');
    quickActionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.querySelector('span').textContent;
            quickAction(action);
        });
    });
    
    // Primary action buttons
    const primaryBtns = document.querySelectorAll('.btn-primary');
    primaryBtns.forEach(btn => {
        if (btn.textContent.includes('Add New Resident')) {
            btn.addEventListener('click', addResident);
        } else if (btn.textContent.includes('New Announcement')) {
            btn.addEventListener('click', newAnnouncement);
        }
    });
});

// Handle window resize for responsive behavior
window.addEventListener('resize', function() {
    if (window.innerWidth > 1024) {
        closeMobileMenu();
    }
});

// Smooth scrolling for better UX
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Add loading states for better perceived performance
function showLoading(element) {
    element.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--muted-foreground);"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
}

// Export functions for global access
window.societyManagement = {
    switchPage,
    viewResidentDetails,
    readAnnouncement,
    addResident,
    newAnnouncement,
    quickAction
};