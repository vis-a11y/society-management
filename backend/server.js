const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'societyhub-super-secret-key';

function auth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        req.user = user;
        next();
    });
}

// ======== AUTH ========
app.post('/api/auth/login', async (req, res) => {
    const { name, password, role } = req.body;
    const user = db.getUserByName(name, role);
    if (!user) return res.status(400).json({ error: 'User not found' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, flat: user.flat }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, user: { id: user.id, role: user.role, name: user.name, flat: user.flat } });
});

app.post('/api/auth/register', async (req, res) => {
    const { name, flat, phone, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const id = db.addUser({ role: 'Resident', name, flat, phone, password: hash });
    res.json({ success: true, id });
});

// ======== USERS ========
app.get('/api/users/profile', auth, (req, res) => {
    const user = db.getUser(req.user.id);
    res.json({ id: user.id, name: user.name, flat: user.flat, phone: user.phone, role: user.role, vehicle_details: user.vehicle_details });
});
app.put('/api/users/profile', auth, (req, res) => {
    db.updateUser(req.user.id, { phone: req.body.phone, vehicle_details: req.body.vehicle_details });
    res.json({ success: true });
});
app.get('/api/users/residents', auth, (req, res) => {
    res.json(db.getResidents().map(u => ({ id: u.id, name: u.name, flat: u.flat, phone: u.phone })));
});

// ======== NOTICES ========
app.get('/api/notices', auth, (req, res) => res.json(db.getNotices()));
app.post('/api/notices', auth, (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });
    const id = db.addNotice({ title: req.body.title, content: req.body.content, date: new Date().toISOString() });
    res.json({ success: true, id });
});

// ======== VISITORS ========
app.get('/api/visitors', auth, (req, res) => res.json(db.getVisitors(req.user.role, req.user.flat)));
app.post('/api/visitors', auth, (req, res) => {
    const status = req.user.role === 'Resident' ? 'Pre-Approved' : 'Pending';
    const id = db.addVisitor({ name: req.body.name, flat: req.body.flat, purpose: req.body.purpose, phone: req.body.phone, status, entry_time: new Date().toISOString() });
    res.json({ success: true, id });
});
app.patch('/api/visitors/:id', auth, (req, res) => {
    db.updateVisitor(parseInt(req.params.id), { status: req.body.status, exit_time: req.body.exit_time });
    res.json({ success: true });
});

// ======== STAFF ========
app.get('/api/staff', auth, (req, res) => res.json(db.getStaff()));
app.post('/api/staff', auth, (req, res) => {
    const id = db.addStaff({ name: req.body.name, role: req.body.role, shift: req.body.shift, salary: req.body.salary });
    res.json({ success: true, id });
});

// ======== EVENTS ========
app.get('/api/events', auth, (req, res) => res.json(db.getEvents()));
app.post('/api/events', auth, (req, res) => {
    const id = db.addEvent({ title: req.body.title, date: req.body.date, description: req.body.description });
    res.json({ success: true, id });
});

// ======== MAINTENANCE ========
app.get('/api/maintenance', auth, (req, res) => res.json(db.getMaintenance(req.user.role, req.user.id)));
app.post('/api/maintenance', auth, (req, res) => {
    const id = db.addMaintenance({ resident_id: req.body.resident_id, month: req.body.month, amount: req.body.amount });
    res.json({ success: true, id });
});
app.patch('/api/maintenance/:id/pay', auth, (req, res) => {
    db.updateMaintenance(parseInt(req.params.id), 'Paid');
    res.json({ success: true });
});

// ======== COMPLAINTS ========
app.get('/api/complaints', auth, (req, res) => res.json(db.getComplaints(req.user.role, req.user.id)));
app.post('/api/complaints', auth, (req, res) => {
    const id = db.addComplaint({ resident_id: req.user.id, subject: req.body.subject, description: req.body.description, date: new Date().toISOString() });
    res.json({ success: true, id });
});
app.patch('/api/complaints/:id/status', auth, (req, res) => {
    db.updateComplaint(parseInt(req.params.id), req.body.status);
    res.json({ success: true });
});

app.listen(5000, () => { console.log('Backend running on port 5000 (Pure JSON DB)'); });
