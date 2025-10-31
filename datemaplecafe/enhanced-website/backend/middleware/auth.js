const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

// Generate JWT token
const generateToken = (userId, username, userType = 'admin') => {
    return jwt.sign(
        { userId, username, userType },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists in database
        db.get(
            'SELECT id, username, email, first_name, last_name FROM admin_users WHERE id = ?',
            [decoded.userId],
            (err, user) => {
                if (err) {
                    console.error('Database error in auth middleware:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Server error during authentication.'
                    });
                }

                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid token. User not found.'
                    });
                }

                req.user = user;
                next();
            }
        );
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired.'
            });
        }

        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during authentication.'
        });
    }
};

module.exports = {
    generateToken,
    verifyToken
};