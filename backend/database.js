const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'societyDB.json');

let db = {
    users: [],
    notices: [],
    visitors: [],
    staff: [],
    events: [],
    maintenance: [],
    complaints: [],
    documents: [],
    messages: []
};

// Initialize or load DB
function initDB() {
    if (fs.existsSync(dbPath)) {
        db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } else {
        // Defaults
        const adminHash = bcrypt.hashSync('admin123', 10);
        const userHash = bcrypt.hashSync('user123', 10);
        db.users.push({ id: 1, role: 'Admin', name: 'admin', password: adminHash });
        db.users.push({ id: 2, role: 'Resident', name: 'user', flat: '101', phone: '1234567890', password: userHash });
        saveDB();
    }
}

function saveDB() {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function generateId(table) {
    if (db[table].length === 0) return 1;
    return Math.max(...db[table].map(i => i.id)) + 1;
}

initDB();

module.exports = {
    // ---- READS ----
    getUsers: () => db.users,
    getUser: (id) => db.users.find(u => u.id == id),
    getUserByName: (name, role) => db.users.find(u => u.name === name && u.role === role),
    getResidents: () => db.users.filter(u => u.role === 'Resident'),
    
    getNotices: () => [...db.notices].reverse(),
    getVisitors: (role, flat) => role === 'Admin' ? [...db.visitors].reverse() : db.visitors.filter(v => v.flat === flat).reverse(),
    getStaff: () => [...db.staff],
    getEvents: () => [...db.events].reverse(),
    
    getMaintenance: (role, uid) => {
        const mList = role === 'Admin' ? [...db.maintenance] : db.maintenance.filter(m => m.resident_id == uid);
        mList.forEach(m => { const u = db.users.find(x => x.id == m.resident_id); if (u) { m.resident_name = u.name; m.flat = u.flat; } });
        return mList.reverse();
    },
    
    getComplaints: (role, uid) => {
        const cList = role === 'Admin' ? [...db.complaints] : db.complaints.filter(c => c.resident_id == uid);
        cList.forEach(c => { const u = db.users.find(x => x.id == c.resident_id); if (u) { c.resident_name = u.name; c.flat = u.flat; } });
        return cList.reverse();
    },

    getMessages: () => [...db.messages].reverse(),

    // ---- WRITES ----
    addUser: (userObj) => { const id = generateId('users'); db.users.push({id, ...userObj}); saveDB(); return id; },
    updateUser: (id, data) => { const i = db.users.findIndex(u=>u.id==id); if(i>-1) { db.users[i]={...db.users[i], ...data}; saveDB(); } },

    addNotice: (data) => { const id = generateId('notices'); db.notices.push({id, ...data}); saveDB(); return id; },

    addVisitor: (data) => { const id = generateId('visitors'); db.visitors.push({id, ...data}); saveDB(); return id; },
    updateVisitor: (id, data) => { const i = db.visitors.findIndex(v=>v.id==id); if(i>-1) { db.visitors[i]={...db.visitors[i], ...data}; saveDB(); } },

    addStaff: (data) => { const id = generateId('staff'); db.staff.push({id, ...data}); saveDB(); return id; },

    addEvent: (data) => { const id = generateId('events'); db.events.push({id, ...data}); saveDB(); return id; },

    addMaintenance: (data) => { const id = generateId('maintenance'); db.maintenance.push({id, ...data, status: 'Pending'}); saveDB(); return id; },
    updateMaintenance: (id, status) => { const i = db.maintenance.findIndex(m=>m.id==id); if(i>-1) { db.maintenance[i].status=status; saveDB(); } },

    addComplaint: (data) => { const id = generateId('complaints'); db.complaints.push({id, ...data, status: 'Pending'}); saveDB(); return id; },
    updateComplaint: (id, status) => { const i = db.complaints.findIndex(c=>c.id==id); if(i>-1) { db.complaints[i].status=status; saveDB(); } },

    addMessage: (data) => { const id = generateId('messages'); db.messages.push({id, ...data}); saveDB(); return id; }
};
