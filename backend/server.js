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
        
        let [users] = await pool.query('SELECT * FROM users WHERE name = ? AND role = ?', [name, role]);
        let user = users[0];

        // Any Gmail -> Registration Handle via specific format checking 
        if (!user && name.includes('@')) {
            const hash = await bcrypt.hash(password, 10);
            const [result] = await pool.query(`INSERT INTO users (role, name, flat, phone, password) VALUES (?, ?, '101', 'Dynamic', ?)`, [role, name, hash]);
            const [newUsers] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
            user = newUsers[0];
        }

        if (!user) return res.status(400).json({ error: 'User not found' });
        
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, role: user.role, name: user.name, flat: user.flat }, JWT_SECRET, { expiresIn: '12h' });
        res.json({ token, user: { id: user.id, role: user.role, name: user.name, flat: user.flat } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const pool = getPool();
        const { name, email, password } = req.body;
        
        // Prevent dupes
        const [existing] = await pool.query('SELECT * FROM users WHERE name = ?', [email || name]);
        if (existing.length > 0) return res.status(400).json({ error: "Email already in use" });
        
        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(`INSERT INTO users (role, name, flat, phone, password) VALUES (?, ?, '101', 'N/A', ?)`, ['Resident', email || name, hash]);
        res.json({ success: true, id: result.insertId });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ======== USERS ========
app.get('/api/users/profile', auth, async (req, res) => {
    const [u] = await getPool().query('SELECT id, name, flat, phone, role, vehicle_details FROM users WHERE id = ?', [req.user.id]);
    res.json(u[0]);
});
app.put('/api/users/profile', auth, async (req, res) => {
    await getPool().query('UPDATE users SET phone = ?, vehicle_details = ? WHERE id = ?', [req.body.phone, req.body.vehicle_details, req.user.id]);
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
    const [items] = await getPool().query('SELECT * FROM maintenance ' + (req.user.role === 'Admin' ? '' : 'WHERE resident_id = ?') + ' ORDER BY id DESC', [req.user.role === 'Admin' ? '' : req.user.id]);
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
    const [items] = await getPool().query('SELECT * FROM complaints ' + (req.user.role === 'Admin' ? '' : 'WHERE resident_id = ?') + ' ORDER BY date DESC', [req.user.role === 'Admin' ? '' : req.user.id]);
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

app.listen(5000, () => { console.log('Backend & MySQL Database successfully established running on port 5000'); });
