// ---------------- Navigation ----------------
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

// ---------------- Logout ----------------
const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("adminLoggedIn"); // optional if using login tracking
    window.location.href = "login.html";
});

// ---------------- Sample / Persistent Data ----------------
// Members from Add Resident page (localStorage)
let residents = JSON.parse(localStorage.getItem("residentsData")) || [];

// Complaints sample
let complaints = JSON.parse(localStorage.getItem("complaintsData")) || [
    {title: "Leaking pipe", flat: "A101", status: "Pending"},
    {title: "Elevator not working", flat: "B102", status: "Resolved"}
];

// Announcements sample
let announcements = JSON.parse(localStorage.getItem("announcementsData")) || [
    {title: "Society AGM", date: "15th Oct"},
    {title: "Maintenance Work", date: "20th Oct"}
];

// ---------------- Populate Members ----------------
const membersGrid = document.getElementById("membersGrid");
function loadMembers() {
    membersGrid.innerHTML = residents.map(m => `
        <div class="resident-card">
            <div class="resident-header">
                <div class="resident-info">
                    <div class="resident-avatar">${m.name.charAt(0)}</div>
                    <div class="resident-details">
                        <h4>${m.name}</h4>
                        <p class="resident-flat">${m.flat}</p>
                        <p>${m.phone}</p>
                        <p>${m.email}</p>
                    </div>
                </div>
            </div>
        </div>
    `).join("");
    document.getElementById("totalMembers").textContent = residents.length;
}
loadMembers();

// ---------------- Populate Complaints ----------------
const complaintsGrid = document.getElementById("complaintsGrid");
function loadComplaints() {
    complaintsGrid.innerHTML = complaints.map(c => `
        <div class="resident-card">
            <div class="resident-header">
                <h4>${c.title}</h4>
                <span class="status-badge ${c.status.toLowerCase()}">${c.status}</span>
            </div>
            <p>Flat: ${c.flat}</p>
        </div>
    `).join("");
    const pendingCount = complaints.filter(c => c.status.toLowerCase() === "pending").length;
    document.getElementById("pendingComplaints").textContent = pendingCount;
}
loadComplaints();

// ---------------- Populate Announcements ----------------
const announcementsList = document.getElementById("announcementsList");
function loadAnnouncements() {
    announcementsList.innerHTML = announcements.map(a => `
        <div class="announcement-card">
            <div class="announcement-content">
                <h4>${a.title}</h4>
                <p>Date: ${a.date}</p>
            </div>
        </div>
    `).join("");
}
loadAnnouncements();

// ---------------- Finance ----------------
document.getElementById("totalCollection").textContent = "₹" + (residents.length * 2000); // example
document.getElementById("maintenanceFee").textContent = "₹" + (residents.length * 150); // example
document.getElementById("financeTotalCollection").textContent = "₹" + (residents.length * 2000);
document.getElementById("financePending").textContent = "₹" + (residents.length * 150);

