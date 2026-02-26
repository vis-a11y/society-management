const express = require('express');
const router = express.Router();
const db = require('../database');
const { verifyToken } = require('../auth');

// ============================================================================
// CREDIT SCORE SYSTEM
// ============================================================================

// Points configuration
const POINTS = {
    BILL_PAYMENT: 10,
    POLL_VOTE: 3,
    MEETING_ATTENDANCE: 5,
    SKILL_SHARE: 8,
    COMPLAINT_RESOLUTION: 5,
    ECO_FRIENDLY: 15,
    LATE_PAYMENT_PENALTY: -5,
    RULE_VIOLATION: -10
};

// Achievement thresholds
const ACHIEVEMENTS = {
    FIRST_PAYMENT: { name: 'First Payment', points: 5, description: 'Made your first payment' },
    EARLY_BIRD: { name: 'Early Bird', points: 10, description: 'Paid 5 bills on time' },
    COMMUNITY_HELPER: { name: 'Community Helper', points: 15, description: 'Shared 3 skills' },
    ECO_WARRIOR: { name: 'Eco Warrior', points: 20, description: '10 eco-friendly actions' },
    SUPER_RESIDENT: { name: 'Super Resident', points: 50, description: 'Reached 500 points' }
};

// Get credit score for a resident
router.get('/resident/:residentId', verifyToken, (req, res) => {
    db.get("SELECT * FROM credit_scores WHERE residentId = ?", 
        [req.params.residentId], (err, row) => {
        if (err) return res.status(500).json({ message: err.message });
        if (!row) {
            // Create initial credit score
            const { residentId } = req.params;
            db.get("SELECT * FROM residents WHERE id = ?", [residentId], (err, resident) => {
                if (err || !resident) return res.status(404).json({ message: 'Resident not found' });
                
                db.run(
                    `INSERT INTO credit_scores (residentId, residentName, flat, totalPoints, level, lastUpdated) 
                     VALUES (?, ?, ?, 0, 1, ?)`,
                    [residentId, resident.name, resident.flat, new Date().toLocaleDateString()],
                    function(err) {
                        if (err) return res.status(500).json({ message: err.message });
                        res.json({ residentId, residentName: resident.name, flat: resident.flat, totalPoints: 0, level: 1 });
                    }
                );
            });
        } else {
            res.json(row);
        }
    });
});

// Get leaderboard
router.get('/leaderboard', verifyToken, (req, res) => {
    db.all("SELECT * FROM credit_scores ORDER BY totalPoints DESC LIMIT 10", [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        
        // Update ranks
        rows.forEach((row, index) => {
            db.run("UPDATE credit_scores SET rank = ? WHERE id = ?", [index + 1, row.id]);
        });
        
        res.json(rows);
    });
});

// Add points to resident
router.post('/add-points', verifyToken, (req, res) => {
    const { residentId, activityType, description, points } = req.body;
    const createdAt = new Date().toLocaleDateString();
    
    // Log activity
    db.run(
        `INSERT INTO activity_log (residentId, activityType, description, points, createdAt) 
         VALUES (?, ?, ?, ?, ?)`,
        [residentId, activityType, description, points, createdAt],
        function(err) {
            if (err) return res.status(500).json({ message: err.message });
            
            // Update credit score
            db.run(
                `UPDATE credit_scores 
                 SET totalPoints = totalPoints + ?, 
                     level = CASE WHEN (totalPoints + ?) >= 500 THEN 5
                                  WHEN (totalPoints + ?) >= 300 THEN 4
                                  WHEN (totalPoints + ?) >= 150 THEN 3
                                  WHEN (totalPoints + ?) >= 50 THEN 2
                                  ELSE 1 END,
                     lastUpdated = ?
                 WHERE residentId = ?`,
                [points, points, points, points, points, createdAt, residentId],
                function(err) {
                    if (err) return res.status(500).json({ message: err.message });
                    res.json({ message: 'Points added successfully' });
                }
            );
        }
    );
});

// Get activity log for resident
router.get('/activity/:residentId', verifyToken, (req, res) => {
    db.all("SELECT * FROM activity_log WHERE residentId = ? ORDER BY createdAt DESC LIMIT 20", 
        [req.params.residentId], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

// Get achievements for resident
router.get('/achievements/:residentId', verifyToken, (req, res) => {
    db.all("SELECT * FROM achievements WHERE residentId = ? ORDER BY earnedAt DESC", 
        [req.params.residentId], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

// Award achievement
router.post('/achievements', verifyToken, (req, res) => {
    const { residentId, achievementType, achievementName, description, points } = req.body;
    const earnedAt = new Date().toLocaleDateString();
    
    db.run(
        `INSERT INTO achievements (residentId, achievementType, achievementName, description, points, earnedAt) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [residentId, achievementType, achievementName, description, points, earnedAt],
        function(err) {
            if (err) return res.status(500).json({ message: err.message });
            
            // Add points for achievement
            db.run(
                `UPDATE credit_scores SET totalPoints = totalPoints + ? WHERE residentId = ?`,
                [points, residentId]
            );
            
            res.status(201).json({ id: this.lastID });
        }
    );
});

// Export points configuration
router.get('/points-config', verifyToken, (req, res) => {
    res.json({ points: POINTS, achievements: ACHIEVEMENTS });
});

module.exports = router;
