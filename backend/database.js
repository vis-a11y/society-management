const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(__dirname, process.env.DB_NAME || 'society_management.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeSchema();
    }
});

function initializeSchema() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            name TEXT,
            email TEXT,
            status TEXT DEFAULT 'Active',
            isApproved INTEGER DEFAULT 0,
            residentId INTEGER,
            wing TEXT,
            FOREIGN KEY(residentId) REFERENCES residents(id)
        )`);

        // Society Info Table
        db.run(`CREATE TABLE IF NOT EXISTS society_info (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            name TEXT,
            address TEXT,
            flats INTEGER,
            manager TEXT,
            healthScore REAL DEFAULT 100
        )`);

        // Residents Table
        db.run(`CREATE TABLE IF NOT EXISTS residents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            flat TEXT NOT NULL,
            wing TEXT,
            phone TEXT,
            email TEXT,
            parkingSlot TEXT,
            residentType TEXT DEFAULT 'Owner', -- Owner, Tenant, Family
            status TEXT DEFAULT 'Active',
            joinDate TEXT,
            kycStatus TEXT DEFAULT 'Pending'
        )`);

        // Complaints Table
        db.run(`CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            residentId INTEGER,
            category TEXT,
            title TEXT NOT NULL,
            flat TEXT NOT NULL,
            desc TEXT,
            status TEXT DEFAULT 'Pending',
            priority TEXT DEFAULT 'Normal',
            assignedTo TEXT,
            date TEXT,
            imagePath TEXT,
            FOREIGN KEY(residentId) REFERENCES residents(id)
        )`);

        // Announcements Table
        db.run(`CREATE TABLE IF NOT EXISTS announcements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT,
            type TEXT,
            date TEXT,
            isPinned INTEGER DEFAULT 0
        )`);

        // Fees Table (Maintenance)
        db.run(`CREATE TABLE IF NOT EXISTS fees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            residentId INTEGER,
            month TEXT,
            amount INTEGER,
            lateFee INTEGER DEFAULT 0,
            status TEXT,
            dueDate TEXT,
            paymentId TEXT,
            paymentDate TEXT,
            FOREIGN KEY(residentId) REFERENCES residents(id)
        )`);

        // Visitors Table
        db.run(`CREATE TABLE IF NOT EXISTS visitors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            residentId INTEGER,
            name TEXT NOT NULL,
            phone TEXT,
            flat TEXT NOT NULL,
            purpose TEXT,
            entryTime TEXT,
            exitTime TEXT,
            status TEXT DEFAULT 'Pending',
            isBlacklisted INTEGER DEFAULT 0,
            FOREIGN KEY(residentId) REFERENCES residents(id)
        )`);

        // Facility Bookings Table
        db.run(`CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            residentId INTEGER,
            facility TEXT NOT NULL,
            date TEXT NOT NULL,
            slot TEXT NOT NULL,
            status TEXT DEFAULT 'Confirmed',
            FOREIGN KEY(residentId) REFERENCES residents(id)
        )`);

        // Polls Table (Voting)
        db.run(`CREATE TABLE IF NOT EXISTS polls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            options TEXT NOT NULL, -- JSON string
            createdAt TEXT,
            expiresAt TEXT,
            results TEXT -- Final counts JSON
        )`);

        // Energy & Water Usage (Daily/Monthly Consumption)
        db.run(`CREATE TABLE IF NOT EXISTS energy_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            residentId INTEGER,
            flat TEXT NOT NULL,
            electricityUnits REAL DEFAULT 0,
            waterUnits REAL DEFAULT 0,
            month TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(residentId) REFERENCES residents(id)
        )`);

        // KYC Documents
        db.run(`CREATE TABLE IF NOT EXISTS kyc_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            residentId INTEGER,
            docType TEXT, -- Aadhar, PAN, Rent Agreement
            docPath TEXT,
            status TEXT DEFAULT 'Pending',
            uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(residentId) REFERENCES residents(id)
        )`);

        // Service Providers (Plumbers, Electricians etc)
        db.run(`CREATE TABLE IF NOT EXISTS service_providers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            category TEXT,
            phone TEXT,
            rating REAL DEFAULT 5,
            isAvailable INTEGER DEFAULT 1
        )`);

        // Audit Logs (Transparent Expenses & Actions)
        db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT,
            description TEXT,
            performedBy TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Emergency alerts (SOS)
        db.run(`CREATE TABLE IF NOT EXISTS emergency_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            residentId INTEGER,
            flat TEXT,
            wing TEXT,
            status TEXT DEFAULT 'Active',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(residentId) REFERENCES residents(id)
        )`);

        // Parking Requests Table
        db.run(`CREATE TABLE IF NOT EXISTS parking_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            residentId INTEGER,
            visitorName TEXT,
            vehicleNumber TEXT,
            stayDuration TEXT,
            status TEXT DEFAULT 'Pending',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(residentId) REFERENCES residents(id)
        )`);

        // Skills Table (Community Skill Exchange)
        db.run(`CREATE TABLE IF NOT EXISTS skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            residentId INTEGER NOT NULL,
            residentName TEXT NOT NULL,
            flat TEXT NOT NULL,
            skillName TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            availability TEXT,
            rating REAL DEFAULT 0,
            reviewCount INTEGER DEFAULT 0,
            createdAt TEXT,
            FOREIGN KEY(residentId) REFERENCES residents(id)
        )`);

        // Skill Requests Table
        db.run(`CREATE TABLE IF NOT EXISTS skill_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            skillId INTEGER NOT NULL,
            requesterId INTEGER NOT NULL,
            requesterName TEXT NOT NULL,
            requesterFlat TEXT NOT NULL,
            message TEXT,
            status TEXT DEFAULT 'Pending',
            createdAt TEXT,
            FOREIGN KEY(skillId) REFERENCES skills(id),
            FOREIGN KEY(requesterId) REFERENCES residents(id)
        )`);

        // Skill Reviews Table
        db.run(`CREATE TABLE IF NOT EXISTS skill_reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            skillId INTEGER NOT NULL,
            reviewerId INTEGER NOT NULL,
            reviewerName TEXT NOT NULL,
            rating INTEGER NOT NULL,
            comment TEXT,
            createdAt TEXT,
            FOREIGN KEY(skillId) REFERENCES skills(id),
            FOREIGN KEY(reviewerId) REFERENCES residents(id)
        )`);

        // Credit Scores Table (Gamification)
        db.run(`CREATE TABLE IF NOT EXISTS credit_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            residentId INTEGER UNIQUE NOT NULL,
            residentName TEXT NOT NULL,
            flat TEXT NOT NULL,
            totalPoints INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            rank INTEGER,
            lastUpdated TEXT,
            FOREIGN KEY(residentId) REFERENCES residents(id)
        )`);

        // Achievements Table
        db.run(`CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            residentId INTEGER NOT NULL,
            achievementType TEXT NOT NULL,
            achievementName TEXT NOT NULL,
            description TEXT,
            points INTEGER DEFAULT 0,
            earnedAt TEXT,
            FOREIGN KEY(residentId) REFERENCES residents(id)
        )`);

        // Activity Log Table (for credit score tracking)
        db.run(`CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            residentId INTEGER NOT NULL,
            activityType TEXT NOT NULL,
            description TEXT,
            points INTEGER DEFAULT 0,
            createdAt TEXT,
            FOREIGN KEY(residentId) REFERENCES residents(id)
        )`);


        // Votes Table
        db.run(`CREATE TABLE IF NOT EXISTS votes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pollId INTEGER,
            userId TEXT,
            optionIndex INTEGER,
            FOREIGN KEY(pollId) REFERENCES polls(id),
            FOREIGN KEY(userId) REFERENCES users(id)
        )`);

        // Inject initial data if users table is empty
        db.get("SELECT count(*) as count FROM users", (err, row) => {
            if (row.count === 0) {
                const bcrypt = require('bcryptjs');
                const adminPass = bcrypt.hashSync('admin123', 10);
                const userPass = bcrypt.hashSync('user123', 10);
                
                db.run("INSERT INTO users (id, password, role, isApproved) VALUES (?, ?, ?, 1)", ['admin', adminPass, 'Admin']);
                db.run("INSERT INTO users (id, password, role, isApproved, residentId) VALUES (?, ?, ?, 1, 1)", ['user', userPass, 'User']);
            }
        });
        
        // Inject initial residents if empty
        db.get("SELECT count(*) as count FROM residents", (err, row) => {
            if (row.count === 0) {
                const residents = [
                    ['Vikas Sharma', 'A-101', '9876543210', 'vikas@example.com', 'Active', 'Jan 2024'],
                    ['Anjali Gupta', 'B-205', '8765432109', 'anjali@example.com', 'Active', 'Feb 2024'],
                    ['Rahul Patel', 'C-302', '7654321098', 'rahul@example.com', 'Inactive', 'Mar 2024']
                ];
                const stmt = db.prepare("INSERT INTO residents (name, flat, phone, email, status, joinDate) VALUES (?, ?, ?, ?, ?, ?)");
                residents.forEach(r => stmt.run(r));
                stmt.finalize();
            }
        });

        // Inject initial events if empty
        db.get("SELECT count(*) as count FROM events", (err, row) => {
            if (row.count === 0) {
                const events = [
                    ['Society AGM', '15th Sep', '6:00 PM', 'Annual General Meeting'],
                    ['Maintenance Work', '18th Sep', '10:00 AM', 'Elevator maintenance'],
                    ['Festive Celebration', '22nd Sep', '7:00 PM', 'Diwali celebration']
                ];
                const stmt = db.prepare("INSERT INTO events (title, date, time, description) VALUES (?, ?, ?, ?)");
                events.forEach(e => stmt.run(e));
                stmt.finalize();
            }
        });

        // Inject initial energy usage
        db.get("SELECT count(*) as count FROM energy_usage", (err, row) => {
            if (row && row.count === 0) {
                const units = [
                    [1, 'A-101', 120.5, 45.2, 'Aug 2024'],
                    [2, 'B-205', 95.0, 38.0, 'Aug 2024'],
                    [3, 'C-302', 150.2, 55.5, 'Aug 2024']
                ];
                const stmt = db.prepare("INSERT INTO energy_usage (residentId, flat, electricityUnits, waterUnits, month) VALUES (?, ?, ?, ?, ?)");
                units.forEach(u => stmt.run(u));
                stmt.finalize();
            }
        });

        // Inject initial audit logs
        db.get("SELECT count(*) as count FROM audit_logs", (err, row) => {
            if (row && row.count === 0) {
                const logs = [
                    ['System Startup', 'Database initialized successfully', 'System'],
                    ['Member Added', 'Vikas Sharma added to A-101', 'Admin'],
                    ['Security Check', 'Night shift security patrol completed', 'Security']
                ];
                const stmt = db.prepare("INSERT INTO audit_logs (action, description, performedBy) VALUES (?, ?, ?)");
                logs.forEach(l => stmt.run(l));
                stmt.finalize();
            }
        });

        // Inject initial service providers
        db.get("SELECT count(*) as count FROM service_providers", (err, row) => {
            if (row && row.count === 0) {
                const providers = [
                    ['Rajesh Electrician', 'Electrical', '9876500001', 4.8, 1],
                    ['Suresh Plumber', 'Plumbing', '9876500002', 4.5, 1],
                    ['Mahesh Carpenter', 'Carpentry', '9876500003', 4.9, 1]
                ];
                const stmt = db.prepare("INSERT INTO service_providers (name, category, phone, rating, isAvailable) VALUES (?, ?, ?, ?, ?)");
                providers.forEach(p => stmt.run(p));
                stmt.finalize();
            }
        });

        // Inject initial society info
        db.get("SELECT count(*) as count FROM society_info", (err, row) => {
            if (row && row.count === 0) {
                db.run("INSERT INTO society_info (id, name, address, flats, manager) VALUES (1, 'SocietyHub Premium', 'Elite Enclave, Mumbai', 120, 'Vikas Sharma')");
            }
        });

        // Migration: safely add healthScore column if it doesn't exist yet
        db.run("ALTER TABLE society_info ADD COLUMN healthScore REAL DEFAULT 94.5", (err) => {
            // Ignore error if column already exists (SQLITE_ERROR: duplicate column name)
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Migration error:', err.message);
            }
        });
    });
}

module.exports = db;
