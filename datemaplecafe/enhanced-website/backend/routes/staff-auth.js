const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// Staff login route
router.post('/login', [
    body('staffId').trim().notEmpty().withMessage('Staff ID is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { staffId, password } = req.body;

        // Get staff from database
        db.get(
            'SELECT id, staff_id, role, first_name, last_name, email, password_hash FROM staff_members WHERE staff_id = ?',
            [staffId],
            async (err, staff) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Server error during login'
                    });
                }

                if (!staff) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid staff ID or password'
                    });
                }

                // Verify password
                const isPasswordValid = await bcrypt.compare(password, staff.password_hash);
                if (!isPasswordValid) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid staff ID or password'
                    });
                }

                // Update last login
                db.run(
                    'UPDATE staff_members SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                    [staff.id],
                    (err) => {
                        if (err) {
                            console.error('Update last login error:', err);
                        }
                    }
                );

                // Generate token with staff type
                const token = generateToken(staff.id, staff.staff_id, 'staff');

                // Return success response
                res.json({
                    success: true,
                    message: 'Staff login successful',
                    token,
                    staff: {
                        id: staff.id,
                        staffId: staff.staff_id,
                        role: staff.role,
                        firstName: staff.first_name,
                        lastName: staff.last_name,
                        email: staff.email
                    }
                });
            }
        );

    } catch (error) {
        console.error('Staff login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// Get current staff user route
router.get('/me', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Verify token and get staff info
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.userType !== 'staff') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Staff token required.'
            });
        }

        db.get(
            'SELECT id, staff_id, role, first_name, last_name, email FROM staff_members WHERE id = ?',
            [decoded.userId],
            (err, staff) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Server error during authentication.'
                    });
                }

                if (!staff) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid token. Staff not found.'
                    });
                }

                res.json({
                    success: true,
                    staff: {
                        id: staff.id,
                        staffId: staff.staff_id,
                        role: staff.role,
                        firstName: staff.first_name,
                        lastName: staff.last_name,
                        email: staff.email
                    }
                });
            }
        );
    } catch (error) {
        console.error('Staff auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        });
    }
});

module.exports = router;