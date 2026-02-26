const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123';

function generateToken(user) {
    return jwt.sign({ id: user.id, role: user.role, residentId: user.residentId }, SECRET, { expiresIn: '24h' });
}

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Failed to authenticate token' });
        req.user = decoded;
        next();
    });
}

module.exports = { generateToken, verifyToken };
