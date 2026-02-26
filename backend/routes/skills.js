const express = require('express');
const router = express.Router();
const db = require('../database');
const { verifyToken } = require('../auth');

// ============================================================================
// SKILLS CRUD
// ============================================================================

// Get all skills
router.get('/', verifyToken, (req, res) => {
    db.all("SELECT * FROM skills ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

// Get skills by category
router.get('/category/:category', verifyToken, (req, res) => {
    db.all("SELECT * FROM skills WHERE category = ? ORDER BY rating DESC", 
        [req.params.category], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

// Get skills by resident
router.get('/resident/:residentId', verifyToken, (req, res) => {
    db.all("SELECT * FROM skills WHERE residentId = ?", 
        [req.params.residentId], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

// Add new skill
router.post('/', verifyToken, (req, res) => {
    const { residentId, residentName, flat, skillName, category, description, availability } = req.body;
    const createdAt = new Date().toLocaleDateString();
    
    db.run(
        `INSERT INTO skills (residentId, residentName, flat, skillName, category, description, availability, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [residentId, residentName, flat, skillName, category, description, availability, createdAt],
        function(err) {
            if (err) return res.status(500).json({ message: err.message });
            res.status(201).json({ id: this.lastID });
        }
    );
});

// Update skill
router.patch('/:id', verifyToken, (req, res) => {
    const { skillName, category, description, availability } = req.body;
    
    db.run(
        `UPDATE skills SET skillName = ?, category = ?, description = ?, availability = ? WHERE id = ?`,
        [skillName, category, description, availability, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ message: 'Skill updated successfully' });
        }
    );
});

// Delete skill
router.delete('/:id', verifyToken, (req, res) => {
    db.run("DELETE FROM skills WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: 'Skill deleted successfully' });
    });
});

// ============================================================================
// SKILL REQUESTS
// ============================================================================

// Get all requests for a skill
router.get('/:skillId/requests', verifyToken, (req, res) => {
    db.all("SELECT * FROM skill_requests WHERE skillId = ? ORDER BY createdAt DESC", 
        [req.params.skillId], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

// Get requests made by a resident
router.get('/requests/resident/:residentId', verifyToken, (req, res) => {
    db.all("SELECT sr.*, s.skillName, s.residentName as providerName FROM skill_requests sr JOIN skills s ON sr.skillId = s.id WHERE sr.requesterId = ? ORDER BY sr.createdAt DESC", 
        [req.params.residentId], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

// Create skill request
router.post('/:skillId/request', verifyToken, (req, res) => {
    const { requesterId, requesterName, requesterFlat, message } = req.body;
    const createdAt = new Date().toLocaleDateString();
    
    db.run(
        `INSERT INTO skill_requests (skillId, requesterId, requesterName, requesterFlat, message, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.params.skillId, requesterId, requesterName, requesterFlat, message, createdAt],
        function(err) {
            if (err) return res.status(500).json({ message: err.message });
            res.status(201).json({ id: this.lastID });
        }
    );
});

// Update request status
router.patch('/requests/:id/status', verifyToken, (req, res) => {
    const { status } = req.body;
    
    db.run(
        `UPDATE skill_requests SET status = ? WHERE id = ?`,
        [status, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ message: 'Request status updated' });
        }
    );
});

// ============================================================================
// SKILL REVIEWS
// ============================================================================

// Get reviews for a skill
router.get('/:skillId/reviews', verifyToken, (req, res) => {
    db.all("SELECT * FROM skill_reviews WHERE skillId = ? ORDER BY createdAt DESC", 
        [req.params.skillId], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
    });
});

// Add review
router.post('/:skillId/review', verifyToken, (req, res) => {
    const { reviewerId, reviewerName, rating, comment } = req.body;
    const createdAt = new Date().toLocaleDateString();
    
    db.run(
        `INSERT INTO skill_reviews (skillId, reviewerId, reviewerName, rating, comment, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.params.skillId, reviewerId, reviewerName, rating, comment, createdAt],
        function(err) {
            if (err) return res.status(500).json({ message: err.message });
            
            // Update skill rating
            db.all("SELECT AVG(rating) as avgRating, COUNT(*) as count FROM skill_reviews WHERE skillId = ?",
                [req.params.skillId], (err, rows) => {
                if (!err && rows.length > 0) {
                    db.run(
                        "UPDATE skills SET rating = ?, reviewCount = ? WHERE id = ?",
                        [rows[0].avgRating, rows[0].count, req.params.skillId]
                    );
                }
            });
            
            res.status(201).json({ id: this.lastID });
        }
    );
});

module.exports = router;
