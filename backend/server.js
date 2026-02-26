const express = require('express');
const cors = require('cors');
const db = require('./database');
const { generateToken, verifyToken } = require('./auth');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const path = require('path');
const paymentRoutes = require('./routes/payment');
const skillsRoutes = require('./routes/skills');
const creditScoreRoutes = require('./routes/creditScore');
const upload = require('./middleware/upload');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Payment routes
app.use('/api/payment', paymentRoutes);
// Skills routes
app.use('/api/skills', skillsRoutes);
// Credit score routes
app.use('/api/credit-score', creditScoreRoutes);

// Root route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// --- Auth Routes ---
app.post('/api/auth/login', (req, res) => {
    const { id, password } = req.body;
    // Use LOWER() to allow case-insensitive IDs (e.g., 'Admin' or 'admin')
    db.get("SELECT * FROM users WHERE LOWER(id) = LOWER(?)", [id], (err, user) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) return res.status(401).json({ message: 'Invalid credentials' });

        // Admins don't need approval; Users must be approved by Admin
        if (user.role !== 'Admin' && user.isApproved === 0) {
            return res.status(403).json({ message: 'Account pending approval from Admin' });
        }

        const token = generateToken(user);
        res.json({ token, role: user.role, id: user.id, residentId: user.residentId });
    });
});

app.post('/api/auth/register', (req, res) => {
    const { id, password, role } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run("INSERT INTO users (id, password, role) VALUES (?, ?, ?)", [id, hashedPassword, 'User'], (err) => {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ message: 'User already exists' });
            }
            return res.status(500).json({ message: 'Database error' });
        }
        res.status(201).json({ message: 'User registered successfully' });
    });
});

// --- Resident Routes ---
app.get('/api/residents', verifyToken, (req, res) => {
    db.all("SELECT * FROM residents", [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

app.get('/api/residents/:id', verifyToken, (req, res) => {
    db.get("SELECT * FROM residents WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!row) return res.status(404).json({ message: 'Resident not found' });
        res.json(row);
    });
});

app.post('/api/residents', verifyToken, (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Unauthorized' });
    const { name, flat, phone, email, status, joinDate } = req.body;
    db.run("INSERT INTO residents (name, flat, phone, email, status, joinDate) VALUES (?, ?, ?, ?, ?, ?)",
        [name, flat, phone, email, status || 'Active', joinDate], function(err) {
            if (err) return res.status(500).json({ message: err.message });
            res.status(201).json({ id: this.lastID });
        });
});

app.put('/api/residents/:id', verifyToken, (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Unauthorized' });
    const { name, flat, phone, email, status } = req.body;
    db.run("UPDATE residents SET name = ?, flat = ?, phone = ?, email = ?, status = ? WHERE id = ?",
        [name, flat, phone, email, status, req.params.id], function(err) {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ message: 'Resident updated' });
        });
});

// --- Complaint Routes ---
app.get('/api/complaints', verifyToken, (req, res) => {
    let query = "SELECT * FROM complaints";
    const params = [];
    
    if (req.user.role !== 'Admin') {
        // For non-admins, we might need a better way to link user to resident
        // For now, if residentId is passed, use it
        if (req.query.residentId) {
            query += " WHERE residentId = ?";
            params.push(req.query.residentId);
        } else if (req.query.flat) {
            query += " WHERE flat = ?";
            params.push(req.query.flat);
        }
    } else if (req.query.residentId) {
        query += " WHERE residentId = ?";
        params.push(req.query.residentId);
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

app.post('/api/complaints', verifyToken, upload.single('image'), (req, res) => {
    const { title, desc, category, priority, flat, date, status, residentId } = req.body;
    const imagePath = req.file ? `/uploads/complaints/${req.file.filename}` : null;
    
    // SMART AUTO-ROUTING LOGIC
    let assignedTo = "Unassigned";
    const cat = (category || "").toLowerCase();
    if (cat.includes("plumbing")) assignedTo = "Society Plumber";
    else if (cat.includes("electric")) assignedTo = "Society Electrician";
    else if (cat.includes("security") || cat.includes("parking")) assignedTo = "Security Supervisor";
    else if (cat.includes("lift")) assignedTo = "Lift Technician";

    db.run(
        "INSERT INTO complaints (title, desc, category, priority, flat, date, status, imagePath, residentId, assignedTo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [title, desc, category, priority, flat, date, status || 'Pending', imagePath, residentId || req.user.residentId, assignedTo],
        function(err) {
            if (err) return res.status(500).json({ message: err.message });
            
            // Log for audit
            db.run("INSERT INTO audit_logs (action, description, performedBy) VALUES (?, ?, ?)", 
                ['New Complaint', `Complaint #${this.lastID} raised for ${flat}`, req.user.id]);

            res.status(201).json({ id: this.lastID, imagePath, assignedTo });
        }
    );
});

app.patch('/api/complaints/:id/resolve', verifyToken, (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Unauthorized' });
    
    db.get("SELECT * FROM complaints WHERE id = ?", [req.params.id], (err, complaint) => {
        if (err || !complaint) return res.status(404).json({ message: 'Complaint not found' });
        
        db.run("UPDATE complaints SET status = 'Resolved' WHERE id = ?", [req.params.id], function(err) {
            if (err) return res.status(500).json({ message: err.message });
            
            // Award points for complaint resolution (patience)
            if (complaint.residentId) {
                db.run(`UPDATE credit_scores SET totalPoints = totalPoints + 5 WHERE residentId = ?`, [complaint.residentId]);
                const createdAt = new Date().toLocaleDateString();
                db.run(`INSERT INTO activity_log (residentId, activityType, description, points, createdAt) VALUES (?, 'COMPLAINT_RESOLUTION', 'Patience during complaint resolution', 5, ?)`, [complaint.residentId, createdAt]);
            }
            
            res.json({ message: 'Complaint resolved and points awarded' });
        });
    });
});

// --- Announcement Routes ---
app.get('/api/announcements', (req, res) => {
    db.all("SELECT * FROM announcements", [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

app.post('/api/announcements', verifyToken, (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Unauthorized' });
    const { title, content, type, date, isPinned } = req.body;
    db.run("INSERT INTO announcements (title, content, type, date, isPinned) VALUES (?, ?, ?, ?, ?)",
        [title, content, type, date, isPinned ? 1 : 0], function(err) {
            if (err) return res.status(500).json({ message: err.message });
            res.status(201).json({ id: this.lastID });
        });
});

// --- Fee Routes ---
app.get('/api/fees', verifyToken, (req, res) => {
    let query = "SELECT * FROM fees";
    const params = [];
    if (req.query.residentId) {
        query += " WHERE residentId = ?";
        params.push(req.query.residentId);
    }
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

app.post('/api/fees', verifyToken, (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Unauthorized' });
    const { residentId, month, amount, status } = req.body;
    db.run("INSERT INTO fees (residentId, month, amount, status) VALUES (?, ?, ?, ?)",
        [residentId, month, amount, status], function(err) {
            if (err) return res.status(500).json({ message: err.message });
            res.status(201).json({ id: this.lastID });
        });
});

// --- Maintenance Routes ---
app.get('/api/maintenance', verifyToken, (req, res) => {
    let query = "SELECT * FROM maintenance";
    const params = [];
    if (req.query.residentId) {
        query += " WHERE residentId = ?";
        params.push(req.query.residentId);
    }
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

app.post('/api/maintenance', verifyToken, (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Unauthorized' });
    const { residentId, month, amount, remark, status } = req.body;
    db.run("INSERT INTO maintenance (residentId, month, amount, remark, status) VALUES (?, ?, ?, ?, ?)",
        [residentId, month, amount, remark, status], function(err) {
            if (err) return res.status(500).json({ message: err.message });
            res.status(201).json({ id: this.lastID });
        });
});

// --- User Routes ---
app.get('/api/users', verifyToken, (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Unauthorized' });
    db.all("SELECT id, role, name, email, status, isApproved FROM users", [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

app.patch('/api/users/:id/approve', verifyToken, (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Unauthorized' });
    db.run("UPDATE users SET isApproved = 1 WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: 'User approved' });
    });
});

// --- Society Info Routes ---
app.get('/api/society-info', verifyToken, (req, res) => {
    db.get("SELECT * FROM society_info WHERE id = 1", [], (err, row) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(row || { name: "SocietyHub", address: "123 Street", flats: 100, manager: "John Doe" });
    });
});

app.post('/api/society-info', verifyToken, (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Unauthorized' });
    const { name, address, flats, manager } = req.body;
    db.run(`INSERT INTO society_info (id, name, address, flats, manager) 
            VALUES (1, ?, ?, ?, ?) 
            ON CONFLICT(id) DO UPDATE SET 
            name=excluded.name, address=excluded.address, flats=excluded.flats, manager=excluded.manager`,
        [name, address, flats, manager], (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ message: 'Updated successfully' });
        });
});

// --- Event Routes ---
app.get('/api/events', (req, res) => {
    db.all("SELECT * FROM events", [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

app.post('/api/events', verifyToken, (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Unauthorized' });
    const { title, date, time, description } = req.body;
    db.run("INSERT INTO events (title, date, time, description) VALUES (?, ?, ?, ?)",
        [title, date, time, description], function(err) {
            if (err) return res.status(500).json({ message: err.message });
            res.status(201).json({ id: this.lastID });
        });
});

// --- Visitor Routes ---
app.get('/api/visitors', verifyToken, (req, res) => {
    let query = "SELECT * FROM visitors";
    const params = [];
    if (req.query.residentId) {
        // Assuming visitors table might have residentId in future
        // For now, if we have flat or other filters
        query += " WHERE flat IN (SELECT flat FROM residents WHERE id = ?)";
        params.push(req.query.residentId);
    }
    query += " ORDER BY id DESC";
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

app.post('/api/visitors', verifyToken, (req, res) => {
    const { name, phone, flat, purpose, residentId } = req.body;
    const entryTime = new Date().toLocaleString();
    db.run("INSERT INTO visitors (name, phone, flat, purpose, entryTime, residentId, status) VALUES (?, ?, ?, ?, ?, ?, 'Approved')",
        [name, phone, flat, purpose, entryTime, residentId || req.user.residentId], function(err) {
            if (err) return res.status(500).json({ message: err.message });
            res.status(201).json({ id: this.lastID });
        });
});

app.patch('/api/visitors/:id/out', verifyToken, (req, res) => {
    const exitTime = new Date().toLocaleString();
    db.run("UPDATE visitors SET exitTime = ? WHERE id = ?", [exitTime, req.params.id], function(err) {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: 'Visitor marked as OUT' });
    });
});

// --- Booking Routes ---
app.get('/api/bookings', verifyToken, (req, res) => {
    let query = "SELECT * FROM bookings";
    const params = [];
    if (req.query.residentId) {
        query += " WHERE residentId = ?";
        params.push(req.query.residentId);
    }
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

app.post('/api/bookings', verifyToken, (req, res) => {
    const { residentId, facility, date, slot } = req.body;
    db.get("SELECT * FROM bookings WHERE facility = ? AND date = ? AND slot = ? AND status = 'Confirmed'",
        [facility, date, slot], (err, row) => {
            if (err) return res.status(500).json({ message: err.message });
            if (row) return res.status(400).json({ message: 'Slot already booked' });

            db.run("INSERT INTO bookings (residentId, facility, date, slot) VALUES (?, ?, ?, ?)",
                [residentId, facility, date, slot], function(err) {
                    if (err) return res.status(500).json({ message: err.message });
                    res.status(201).json({ id: this.lastID });
                });
        });
});

// --- Poll Routes ---
app.get('/api/polls', (req, res) => {
    db.all("SELECT * FROM polls", [], async (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        
        const results = await Promise.all(rows.map(poll => {
            return new Promise((resolve) => {
                db.all("SELECT optionIndex, count(*) as count FROM votes WHERE pollId = ? GROUP BY optionIndex", [poll.id], (err, votes) => {
                    poll.options = JSON.parse(poll.options);
                    poll.voteCounts = votes || [];
                    resolve(poll);
                });
            });
        }));
        res.json(results);
    });
});

app.post('/api/polls', verifyToken, (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Unauthorized' });
    const { question, options, expiresAt } = req.body;
    const createdAt = new Date().toISOString();
    db.run("INSERT INTO polls (question, options, createdAt, expiresAt) VALUES (?, ?, ?, ?)",
        [question, JSON.stringify(options), createdAt, expiresAt], function(err) {
            if (err) return res.status(500).json({ message: err.message });
            res.status(201).json({ id: this.lastID });
        });
});

app.post('/api/polls/:id/vote', verifyToken, (req, res) => {
    const { optionIndex } = req.body;
    const userId = req.user.id;
    const residentId = req.user.residentId;
    
    db.get("SELECT * FROM votes WHERE pollId = ? AND userId = ?", [req.params.id, userId], (err, row) => {
        if (err) return res.status(500).json({ message: err.message });
        if (row) return res.status(400).json({ message: 'Already voted' });

        db.run("INSERT INTO votes (pollId, userId, optionIndex) VALUES (?, ?, ?)",
            [req.params.id, userId, optionIndex], function(err) {
                if (err) return res.status(500).json({ message: err.message });
                
                // Award points for voting
                if (residentId) {
                    db.run(`UPDATE credit_scores SET totalPoints = totalPoints + 3 WHERE residentId = ?`, [residentId]);
                    const createdAt = new Date().toLocaleDateString();
                    db.run(`INSERT INTO activity_log (residentId, activityType, description, points, createdAt) VALUES (?, 'POLL_VOTE', 'Voted in community poll', 3, ?)`, [residentId, createdAt]);
                }
                res.status(201).json({ message: 'Vote recorded and points awarded' });
            });
    });
});

// ============================================================================
// PARKING MANAGEMENT
// ============================================================================
app.get('/api/parking-requests', verifyToken, (req, res) => {
    let query = "SELECT pr.*, r.flat FROM parking_requests pr JOIN residents r ON pr.residentId = r.id";
    const params = [];
    if (req.user.role !== 'Admin') {
        query += " WHERE pr.residentId = ?";
        params.push(req.user.residentId);
    }
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

app.post('/api/parking-requests', verifyToken, (req, res) => {
    const { visitorName, vehicleNumber, stayDuration } = req.body;
    const residentId = req.user.residentId;
    db.run("INSERT INTO parking_requests (residentId, visitorName, vehicleNumber, stayDuration) VALUES (?, ?, ?, ?)",
        [residentId, visitorName, vehicleNumber, stayDuration], function(err) {
            if (err) return res.status(500).json({ message: err.message });
            res.status(201).json({ id: this.lastID });
        });
});

app.patch('/api/parking-requests/:id/status', verifyToken, (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Unauthorized' });
    const { status } = req.body;
    db.run("UPDATE parking_requests SET status = ? WHERE id = ?", [status, req.params.id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Status updated" });
    });
});

// ============================================================================
// KYC & VERIFICATION
// ============================================================================
app.get('/api/kyc-documents', verifyToken, (req, res) => {
    let query = "SELECT k.*, r.name as residentName, r.flat FROM kyc_documents k JOIN residents r ON k.residentId = r.id";
    const params = [];
    if (req.user.role !== 'Admin') {
        query += " WHERE k.residentId = ?";
        params.push(req.user.residentId);
    }
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

app.post('/api/kyc-documents', verifyToken, upload.single('document'), (req, res) => {
    const { documentType } = req.body;
    const residentId = req.user.residentId;
    const documentPath = req.file ? `/uploads/kyc/${req.file.filename}` : null;
    db.run("INSERT INTO kyc_documents (residentId, documentType, documentPath) VALUES (?, ?, ?)",
        [residentId, documentType, documentPath], function(err) {
            if (err) return res.status(500).json({ message: err.message });
            db.run("UPDATE residents SET kycStatus = 'Pending' WHERE id = ?", [residentId]);
            res.status(201).json({ id: this.lastID, documentPath });
        });
});

app.patch('/api/kyc-documents/:id/status', verifyToken, (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Unauthorized' });
    const { status, residentId } = req.body; 
    db.run("UPDATE kyc_documents SET status = ? WHERE id = ?", [status, req.params.id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        if (status === 'Approved') {
            db.run("UPDATE residents SET kycStatus = 'Verified' WHERE id = ?", [residentId]);
        }
        db.run("INSERT INTO audit_logs (action, description, performedBy) VALUES (?, ?, ?)", 
            ['KYC Update', `KYC document #${req.params.id} marked as ${status}`, req.user.id]);
        res.json({ message: "Status updated" });
    });
});

// ============================================================================
// FINANCE & DEFAULTERS
// ============================================================================
app.get('/api/finance/defaulters', verifyToken, (req, res) => {
    const query = `
        SELECT r.id as residentId, r.name, r.flat, COUNT(f.id) as pendingMonths, SUM(f.amount) as totalDue
        FROM residents r
        JOIN fees f ON r.id = f.residentId
        WHERE f.status = 'Pending'
        GROUP BY r.id
        HAVING pendingMonths > 0
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

// --- ENERGY & WATER USAGE ROUTES ---
app.get('/api/energy-usage', verifyToken, (req, res) => {
    let query = "SELECT * FROM energy_usage";
    const params = [];
    if (req.user.role !== 'Admin') {
        query += " WHERE residentId = ?";
        params.push(req.user.residentId);
    } else if (req.query.residentId) {
        query += " WHERE residentId = ?";
        params.push(req.query.residentId);
    }
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

app.post('/api/energy-usage', verifyToken, (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Unauthorized' });
    const { residentId, flat, electricityUnits, waterUnits, month } = req.body;
    db.run("INSERT INTO energy_usage (residentId, flat, electricityUnits, waterUnits, month) VALUES (?, ?, ?, ?, ?)",
        [residentId, flat, electricityUnits, waterUnits, month], function(err) {
            if (err) return res.status(500).json({ message: err.message });
            res.status(201).json({ id: this.lastID });
        });
});

// --- EMERGENCY SOS ROUTES ---
app.post('/api/sos', verifyToken, (req, res) => {
    const { flat, wing } = req.body;
    const residentId = req.user.residentId;
    db.run("INSERT INTO emergency_alerts (residentId, flat, wing, status) VALUES (?, ?, ?, 'Active')",
        [residentId, flat, wing], function(err) {
            if (err) return res.status(500).json({ message: err.message });
            
            // Audit log for emergency
            db.run("INSERT INTO audit_logs (action, description, performedBy) VALUES (?, ?, ?)", 
                ['SOS ALERT', `Emergency triggered by Flat ${flat}`, req.user.id]);
            
            res.status(201).json({ message: 'Emergency alert sent to security and admin!', id: this.lastID });
        });
});

app.get('/api/sos', verifyToken, (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Unauthorized' });
    db.all("SELECT * FROM emergency_alerts WHERE status = 'Active' ORDER BY timestamp DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

// --- SERVICE PROVIDERS ROUTES ---
app.get('/api/service-providers', (req, res) => {
    db.all("SELECT * FROM service_providers WHERE isAvailable = 1", [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

// --- AUDIT LOGS ROUTES ---
app.get('/api/audit-logs', verifyToken, (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Unauthorized' });
    db.all("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50", [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

// --- AI MAINTENANCE PREDICTION (SIMULATED) ---
app.get('/api/predictions/maintenance', verifyToken, (req, res) => {
    // Simulated prediction based on complaint frequency
    db.all("SELECT category, count(*) as count FROM complaints WHERE date > date('now', '-30 days') GROUP BY category", [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        
        const predictions = rows.map(r => {
            let risk = "Low";
            let suggestion = "Routine check";
            if (r.count > 5) { risk = "High"; suggestion = "Immediate Overhaul needed"; }
            else if (r.count > 2) { risk = "Medium"; suggestion = "Schedule service soon"; }
            
            return {
                equipment: r.category,
                riskScore: risk,
                prediction: suggestion,
                nextServiceDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
            };
        });

        // Add default predictions if no complaints
        if (predictions.length === 0) {
            predictions.push({ equipment: "Water Tank", riskScore: "Low", prediction: "Clean by month end", nextServiceDate: "30th Sep" });
            predictions.push({ equipment: "Lift A", riskScore: "Medium", prediction: "Greasing required", nextServiceDate: "15th Sep" });
        }

        res.json(predictions);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

