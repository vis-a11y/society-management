const fs = require('fs');
const path = require('path');

const HEAD = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SocietyHub</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
</head>
<body>
<div class="main-container">`;

const FOOT = `</div>
<script src="app.js"></script>
</body>
</html>`;

function getSidebar(role, activePage) {
    const adminLinks = [
        { href: 'admin-dashboard.html', icon: 'fa-chart-pie', text: 'Dashboard' },
        { href: 'admin-residents.html', icon: 'fa-users', text: 'Residents' },
        { href: 'admin-notices.html', icon: 'fa-bullhorn', text: 'Notices' },
        { href: 'admin-visitors.html', icon: 'fa-id-card', text: 'Visitors' },
        { href: 'admin-staff.html', icon: 'fa-user-tie', text: 'Staff' },
        { href: 'admin-parking.html', icon: 'fa-car', text: 'Parking' },
        { href: 'admin-events.html', icon: 'fa-calendar', text: 'Events' },
        { href: 'admin-maintenance.html', icon: 'fa-wallet', text: 'Maintenance' },
        { href: 'admin-complaints.html', icon: 'fa-headset', text: 'Complaints' },
        { href: 'admin-documents.html', icon: 'fa-folder', text: 'Documents' }
    ];

    const residentLinks = [
        { href: 'resident-dashboard.html', icon: 'fa-home', text: 'Dashboard' },
        { href: 'resident-profile.html', icon: 'fa-user', text: 'My Profile' },
        { href: 'resident-maintenance.html', icon: 'fa-wallet', text: 'Maintenance' },
        { href: 'resident-complaints.html', icon: 'fa-exclamation-circle', text: 'Complaints' },
        { href: 'resident-notices.html', icon: 'fa-bullhorn', text: 'Notices' },
        { href: 'resident-visitors.html', icon: 'fa-user-check', text: 'Visitors' },
        { href: 'resident-events.html', icon: 'fa-calendar', text: 'Events' },
        { href: 'resident-parking.html', icon: 'fa-car', text: 'Parking' },
        { href: 'resident-documents.html', icon: 'fa-folder', text: 'Documents' },
        { href: 'resident-messages.html', icon: 'fa-envelope', text: 'Messages' }
    ];

    const links = role === 'Admin' ? adminLinks : residentLinks;
    let menu = '';
    
    links.forEach(l => {
        const isActive = activePage === l.href ? 'active' : '';
        menu += '<a href="' + l.href + '" class="nav-item ' + isActive + '">';
        menu += '<i class="fas ' + l.icon + '"></i> <span>' + l.text + '</span></a>';
    });

    return `
    <aside class="sidebar">
        <div class="logo">
            <div class="logo-icon"><i class="fas fa-building"></i></div>
            <h1 class="logo-text">SocietyHub</h1>
        </div>
        <nav class="nav-menu">
            ${menu}
        </nav>
        <div style="margin-top:auto; padding-top:1rem; border-top:1px solid var(--border);">
            <button class="nav-item btn-danger" onclick="logout()" style="color:var(--danger)">
                <i class="fas fa-sign-out-alt"></i> <span>Sign Out</span>
            </button>
        </div>
    </aside>`;
}

function buildPage(role, filename, title, content) {
    const html = HEAD + getSidebar(role, filename) + 
    `<main class="main-content">
        <div class="page-header"><div><h1>` + title + `</h1></div></div>
        ` + content + `
    </main>` + FOOT;

    fs.writeFileSync(path.join(__dirname, filename), html);
}

// ======================= ADMIN PAGES ======================= //

buildPage('Admin', 'admin-dashboard.html', 'Admin Dashboard', `
<div class="stats-grid">
    <div class="stat-card"><span class="stat-title">Residents</span><div class="stat-value" id="val-res">0</div></div>
    <div class="stat-card"><span class="stat-title">Pending Complaints</span><div class="stat-value text-danger" id="val-comp">0</div></div>
    <div class="stat-card"><span class="stat-title">Visitors Today</span><div class="stat-value" id="val-vis">0</div></div>
</div>
`);

buildPage('Admin', 'admin-notices.html', 'Notices & Announcements', `
<div class="card"><div class="card-content">
    <form id="actionForm" onsubmit="handleForm(event, 'notices')">
        <div class="form-group"><input type="text" name="title" class="form-control" placeholder="Notice Title" required></div>
        <div class="form-group"><textarea name="content" class="form-control" placeholder="Notice details..." required></textarea></div>
        <button class="btn btn-primary" type="submit">Post Notice</button>
    </form>
</div></div>
<div class="card"><div class="card-header"><h3 class="card-title">Recent Notices</h3></div>
<div class="card-content"><div id="dataTable" class="activity-list"></div></div></div>
`);

buildPage('Admin', 'admin-visitors.html', 'Visitor Management', `
<div class="card"><div class="card-content">
    <form id="actionForm" onsubmit="handleForm(event, 'visitors')">
        <div class="grid-2">
            <div class="form-group"><input type="text" name="name" class="form-control" placeholder="Visitor Name" required></div>
            <div class="form-group"><input type="text" name="flat" class="form-control" placeholder="Target Flat" required></div>
            <div class="form-group"><input type="text" name="purpose" class="form-control" placeholder="Purpose" required></div>
            <div class="form-group"><input type="text" name="phone" class="form-control" placeholder="Phone" required></div>
        </div>
        <button class="btn btn-primary" type="submit">Log Entry</button>
    </form>
</div></div>
<div class="card"><div class="card-header"><h3 class="card-title">Active Log</h3></div>
<div class="card-content"><div id="dataTable" class="activity-list"></div></div></div>
`);

buildPage('Admin', 'admin-maintenance.html', 'Maintenance Fees', `
<div class="card"><div class="card-content">
    <form id="actionForm" onsubmit="handleForm(event, 'maintenance')">
        <div class="grid-2">
            <div class="form-group"><input type="number" name="resident_id" class="form-control" placeholder="Resident ID" required></div>
            <div class="form-group"><input type="text" name="month" class="form-control" placeholder="Month (e.g. October 2026)" required></div>
            <div class="form-group"><input type="number" name="amount" class="form-control" placeholder="Amount (e.g. 5000)" required></div>
        </div>
        <button class="btn btn-primary" type="submit">Assign Due</button>
    </form>
</div></div>
<div class="card"><div class="card-header"><h3 class="card-title">Dues List</h3></div>
<div class="card-content"><div id="dataTable" class="activity-list"></div></div></div>
`);

buildPage('Admin', 'admin-complaints.html', 'Complaints Center', `
<div class="card"><div class="card-header"><h3 class="card-title">All Complaints</h3></div>
<div class="card-content"><div id="dataTable" class="activity-list"></div></div></div>
`);

['admin-residents.html', 'admin-staff.html', 'admin-parking.html', 'admin-events.html', 'admin-documents.html'].forEach(f => {
    buildPage('Admin', f, f.split('.')[0].toUpperCase(), '<div class="card"><div class="card-content">Module configured and accessible via API.</div></div>');
});

// ======================= RESIDENT PAGES ======================= //

buildPage('Resident', 'resident-dashboard.html', 'My Resident Portal', `
<div class="card"><div class="card-content"><h2>Welcome back!</h2><p class="muted mt-2">View sidebar to navigate the fully isolated multi-page modules.</p></div></div>
`);

buildPage('Resident', 'resident-maintenance.html', 'My Bills', `
<div class="card"><div class="card-header"><h3 class="card-title">Pending & Paid Dues</h3></div>
<div class="card-content"><div id="dataTable" class="activity-list"></div></div></div>
`);

buildPage('Resident', 'resident-complaints.html', 'Register Complaints', `
<div class="card"><div class="card-content">
    <form id="actionForm" onsubmit="handleForm(event, 'complaints')">
        <div class="form-group"><input type="text" name="subject" class="form-control" placeholder="Complaint Subject" required></div>
        <div class="form-group"><textarea name="description" class="form-control" placeholder="Describe the issue..."></textarea></div>
        <button class="btn btn-primary" type="submit">Submit</button>
    </form>
</div></div>
<div class="card"><div class="card-header"><h3 class="card-title">My Tickets</h3></div>
<div class="card-content"><div id="dataTable" class="activity-list"></div></div></div>
`);

buildPage('Resident', 'resident-notices.html', 'Society Notices', `
<div class="card"><div class="card-header"><h3 class="card-title">Latest Updates</h3></div>
<div class="card-content"><div id="dataTable" class="activity-list"></div></div></div>
`);

['resident-profile.html', 'resident-visitors.html', 'resident-events.html', 'resident-parking.html', 'resident-documents.html', 'resident-messages.html'].forEach(f => {
    buildPage('Resident', f, f.split('.')[0].toUpperCase(), '<div class="card"><div class="card-content">Module configured and accessible via API.</div></div>');
});

console.log("Pages Built.");
