require('dotenv').config();
const express = require('express');

const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getPool } = require('./database'); // MySQL native pool

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
    try {
        const pool = getPool();
        const { name, password, role } = req.body;
        
        const [users] = await pool.query('SELECT * FROM users WHERE name = ? AND role = ?', [name, role]);
        const user = users[0];

        if (!user) return res.status(400).json({ error: 'User not found. Please register first.' });
        
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: 'Invalid password.' });

        const token = jwt.sign({ id: user.id, role: user.role, name: user.name, flat: user.flat }, JWT_SECRET, { expiresIn: '12h' });
        res.json({ token, user: { id: user.id, role: user.role, name: user.name, flat: user.flat } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const pool = getPool();
        const { name, email, password, role, flat, phone } = req.body;
        const identifier = email || name;
        const userRole = role || 'Resident';

        // Prevent dupes
        const [existing] = await pool.query('SELECT * FROM users WHERE name = ?', [identifier]);
        if (existing.length > 0) return res.status(400).json({ error: "Email already in use" });

        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            `INSERT INTO users (role, name, flat, phone, password) VALUES (?, ?, ?, ?, ?)`,
            [userRole, identifier, flat || '101', phone || 'N/A', hash]
        );
        res.json({ success: true, id: result.insertId });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ======== USERS ========
app.get('/api/users/profile', auth, async (req, res) => {
    const [u] = await getPool().query('SELECT id, name, flat, phone, role, vehicle_details FROM users WHERE id = ?', [req.user.id]);
    res.json(u[0]);
});
app.put('/api/users/profile', auth, async (req, res) => {
    await getPool().query('UPDATE users SET phone = ?, vehicle_details = ? WHERE id = ?',
        [req.body.phone || null, req.body.vehicle_details || null, req.user.id]);
    res.json({ success: true });
});
app.get('/api/users/residents', auth, async (req, res) => {
    const [users] = await getPool().query('SELECT id, name, flat, phone FROM users WHERE role = "Resident"');
    res.json(users);
});

// ======== DASHBOARD ========
app.get('/api/notices', auth, async (req, res) => {
    const [q] = await getPool().query('SELECT * FROM notices ORDER BY id DESC');
    res.json(q);
});
app.post('/api/notices', auth, async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });
    const [q] = await getPool().query('INSERT INTO notices (title, content, date) VALUES (?, ?, NOW())', [req.body.title, req.body.content]);
    res.json({ success: true, id: q.insertId });
});

app.get('/api/visitors', auth, async (req, res) => {
    const q = req.user.role === 'Admin' ? 'SELECT * FROM visitors ORDER BY entry_time DESC' : 'SELECT * FROM visitors WHERE flat = ? ORDER BY entry_time DESC';
    const params = req.user.role === 'Admin' ? [] : [req.user.flat];
    const [vis] = await getPool().query(q, params);
    res.json(vis);
});
app.post('/api/visitors', auth, async (req, res) => {
    const status = req.user.role === 'Resident' ? 'Pre-Approved' : 'Pending';
    const [q] = await getPool().query('INSERT INTO visitors (name, flat, purpose, phone, status, entry_time) VALUES (?, ?, ?, ?, ?, NOW())', [req.body.name, req.body.flat, req.body.purpose, req.body.phone, status]);
    res.json({ success: true, id: q.insertId });
});
app.patch('/api/visitors/:id', auth, async (req, res) => {
    await getPool().query('UPDATE visitors SET status = ?, exit_time = NOW() WHERE id = ?', [req.body.status, req.params.id]);
    res.json({ success: true });
});

app.get('/api/maintenance', auth, async (req, res) => {
    const isAdmin = req.user.role === 'Admin';
    const q = isAdmin ? 'SELECT * FROM maintenance ORDER BY id DESC' : 'SELECT * FROM maintenance WHERE resident_id = ? ORDER BY id DESC';
    const params = isAdmin ? [] : [req.user.id];
    const [items] = await getPool().query(q, params);
    res.json(items);
});
app.post('/api/maintenance', auth, async (req, res) => {
    const [item] = await getPool().query('INSERT INTO maintenance (resident_id, month, amount) VALUES (?, ?, ?)', [req.body.resident_id, req.body.month, req.body.amount]);
    res.json({ success: true, id: item.insertId });
});
app.patch('/api/maintenance/:id/pay', auth, async (req, res) => {
    await getPool().query("UPDATE maintenance SET status = 'Paid' WHERE id = ?", [req.params.id]);
    res.json({ success: true });
});

app.get('/api/complaints', auth, async (req, res) => {
    const isAdmin = req.user.role === 'Admin';
    const q = isAdmin ? 'SELECT * FROM complaints ORDER BY date DESC' : 'SELECT * FROM complaints WHERE resident_id = ? ORDER BY date DESC';
    const params = isAdmin ? [] : [req.user.id];
    const [items] = await getPool().query(q, params);
    res.json(items);
});
app.post('/api/complaints', auth, async (req, res) => {
    const [item] = await getPool().query('INSERT INTO complaints (resident_id, subject, description, date) VALUES (?, ?, ?, NOW())', [req.user.id, req.body.subject, req.body.description]);
    res.json({ success: true, id: item.insertId });
});
app.patch('/api/complaints/:id/status', auth, async (req, res) => {
    await getPool().query('UPDATE complaints SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    res.json({ success: true });
});

// ======== EVENTS ========
app.get('/api/events', auth, async (req, res) => {
    const [events] = await getPool().query('SELECT * FROM events ORDER BY id DESC');
    res.json(events);
});
app.post('/api/events', auth, async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });
    const [q] = await getPool().query('INSERT INTO events (title, date, description) VALUES (?, ?, ?)', [req.body.title, req.body.date, req.body.description]);
    res.json({ success: true, id: q.insertId });
});

// ======== STAFF ========
app.get('/api/staff', auth, async (req, res) => {
    const [staff] = await getPool().query('SELECT * FROM staff ORDER BY id DESC');
    res.json(staff);
});
app.post('/api/staff', auth, async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });
    const [q] = await getPool().query('INSERT INTO staff (name, role, shift, salary, attendance) VALUES (?, ?, ?, ?, ?)', [req.body.name, req.body.role, req.body.shift, req.body.salary, 'Present']);
    res.json({ success: true, id: q.insertId });
});

// ======== PARKING ========
app.get('/api/parking', auth, async (req, res) => {
    const [users] = await getPool().query('SELECT id, name, flat, parking_slot, vehicle_details FROM users WHERE parking_slot IS NOT NULL AND parking_slot != ""');
    res.json(users);
});
app.post('/api/parking', auth, async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });
    await getPool().query('UPDATE users SET parking_slot = ? WHERE id = ?', [req.body.parking_slot, req.body.resident_id]);
    res.json({ success: true });
});

// ======== DOCUMENTS ========
app.get('/api/documents', auth, async (req, res) => {
    const [docs] = await getPool().query('SELECT * FROM documents ORDER BY date DESC');
    res.json(docs);
});
app.post('/api/documents', auth, async (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });
    const [q] = await getPool().query('INSERT INTO documents (title, file_url, uploaded_by, date) VALUES (?, ?, ?, NOW())', [req.body.title, req.body.file_url, req.user.id]);
    res.json({ success: true, id: q.insertId });
});

// ======== MESSAGES ========
app.get('/api/messages', auth, async (req, res) => {
    const [msgs] = await getPool().query('SELECT * FROM messages WHERE sender_id = ? OR receiver_id = ? ORDER BY timestamp DESC', [req.user.id, req.user.id]);
    res.json(msgs);
});
app.post('/api/messages', auth, async (req, res) => {
    const [q] = await getPool().query('INSERT INTO messages (sender_id, receiver_id, message, timestamp) VALUES (?, ?, ?, NOW())', [req.user.id, req.body.receiver_id, req.body.message]);
    res.json({ success: true, id: q.insertId });
});

// Port configuration for Render/Local
const PORT = process.env.PORT || 5000;

// On Vercel, we export the app. On Render/Local, we listen.
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => { 
        console.log(`Backend running on port ${PORT}`); 
    });
}

module.exports = app;


