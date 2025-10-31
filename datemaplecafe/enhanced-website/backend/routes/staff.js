const express = require('express');
const { body, validationResult } = require('express-validator');
const { db, generateStaffId } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Get all staff members
router.get('/', verifyToken, async (req, res) => {
    try {
        db.all(`
            SELECT
                s.id,
                s.staff_id,
                s.role,
                s.first_name,
                s.last_name,
                s.email,
                s.phone,
                s.hire_date,
                s.created_at,
                a.username as created_by_username
            FROM staff_members s
            LEFT JOIN admin_users a ON s.created_by = a.id
            ORDER BY s.created_at DESC
        `, [], (err, staff) => {
            if (err) {
                console.error('Get staff error:', err);
                res.status(500).json({
                    success: false,
                    message: 'Server error while fetching staff members'
                });
                return;
            }

            res.json({
                success: true,
                staff
            });
        });
    } catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching staff members'
        });
    }
});

// Create new staff member
router.post('/', [
    verifyToken,
    body('role').isIn(['Manager', 'Barista', 'Cashier', 'Baker', 'Cleaner']).withMessage('Invalid role'),
    body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
    body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('phone').matches(/^[\d\s\-\+\(\)]+$/).withMessage('Invalid phone number'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
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

        const { role, firstName, lastName, email, phone, password } = req.body;
        const hireDate = new Date().toISOString().split('T')[0]; // Today's date

        // Hash the password
        const passwordHash = await bcrypt.hash(password, 12);

        // Generate unique staff ID
        const staffId = await generateStaffId(role);

        // Check if email already exists
        db.get(
            'SELECT id FROM staff_members WHERE email = ?',
            [email],
            (err, existingEmail) => {
                if (err) {
                    console.error('Database error:', err);
                    res.status(500).json({
                        success: false,
                        message: 'Server error while creating staff member'
                    });
                    return;
                }

                if (existingEmail) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email address already exists'
                    });
                }

                // Insert staff member
                db.run(`
                    INSERT INTO staff_members (staff_id, role, first_name, last_name, email, phone, password_hash, hire_date, created_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [staffId, role, firstName, lastName, email, phone, passwordHash, hireDate, req.user.id],
                function(err) {
                    if (err) {
                        console.error('Insert error:', err);
                        res.status(500).json({
                            success: false,
                            message: 'Server error while creating staff member'
                        });
                        return;
                    }

                    // Get the created staff member
                    db.get(`
                        SELECT
                            s.*,
                            a.username as created_by_username
                        FROM staff_members s
                        LEFT JOIN admin_users a ON s.created_by = a.id
                        WHERE s.id = ?
                    `, [this.lastID], (err, newStaff) => {
                        if (err) {
                            console.error('Select error:', err);
                            res.status(500).json({
                                success: false,
                                message: 'Server error while creating staff member'
                            });
                            return;
                        }

                        res.status(201).json({
                            success: true,
                            message: 'Staff member created successfully',
                            staff: newStaff
                        });
                    });
                });
            }
        );

    } catch (error) {
        console.error('Create staff error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating staff member'
        });
    }
});

// Get staff member by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const connection = await pool.getConnection();
        const [staff] = await connection.execute(`
            SELECT
                s.*,
                a.username as created_by_username
            FROM staff_members s
            LEFT JOIN admin_users a ON s.created_by = a.id
            WHERE s.id = ?
        `, [id]);
        connection.release();

        if (staff.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        res.json({
            success: true,
            staff: staff[0]
        });
    } catch (error) {
        console.error('Get staff by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching staff member'
        });
    }
});

// Update staff member
router.put('/:id', [
    verifyToken,
    body('role').optional().isIn(['Manager', 'Barista', 'Cashier', 'Baker', 'Cleaner']).withMessage('Invalid role'),
    body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
    body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
    body('email').optional().isEmail().withMessage('Invalid email address'),
    body('phone').optional().matches(/^[\d\s\-\+\(\)]+$/).withMessage('Invalid phone number'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const updates = req.body;

        const connection = await pool.getConnection();

        // Check if staff member exists
        const [existing] = await connection.execute(
            'SELECT id FROM staff_members WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        // Build update query
        const updateFields = [];
        const updateValues = [];

        for (const [key, value] of Object.entries(updates)) {
            if (key === 'password' && value.trim()) {
                // Hash password if provided
                const passwordHash = await bcrypt.hash(value, 12);
                updateFields.push('password_hash = ?');
                updateValues.push(passwordHash);
            } else if (key !== 'password') {
                // Handle other fields
                const dbKey = key === 'firstName' ? 'first_name' :
                             key === 'lastName' ? 'last_name' : key;
                updateFields.push(`${dbKey} = ?`);
                updateValues.push(value);
            }
        }

        if (updateFields.length > 0) {
            updateValues.push(id);
            await connection.execute(
                `UPDATE staff_members SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );
        }

        // Get updated staff member
        const [updatedStaff] = await connection.execute(`
            SELECT
                s.*,
                a.username as created_by_username
            FROM staff_members s
            LEFT JOIN admin_users a ON s.created_by = a.id
            WHERE s.id = ?
        `, [id]);

        connection.release();

        res.json({
            success: true,
            message: 'Staff member updated successfully',
            staff: updatedStaff[0]
        });

    } catch (error) {
        console.error('Update staff error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating staff member'
        });
    }
});

// Reset staff member password
router.post('/:id/reset-password', [
    verifyToken,
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
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

        const { id } = req.params;
        const { newPassword } = req.body;

        // Check if staff member exists
        db.get(
            'SELECT id, first_name, last_name FROM staff_members WHERE id = ?',
            [id],
            async (err, existing) => {
                if (err) {
                    console.error('Database error:', err);
                    res.status(500).json({
                        success: false,
                        message: 'Server error while resetting password'
                    });
                    return;
                }

                if (!existing) {
                    return res.status(404).json({
                        success: false,
                        message: 'Staff member not found'
                    });
                }

                // Hash the new password
                const passwordHash = await bcrypt.hash(newPassword, 12);

                // Update the password
                db.run(
                    'UPDATE staff_members SET password_hash = ? WHERE id = ?',
                    [passwordHash, id],
                    function(err) {
                        if (err) {
                            console.error('Update error:', err);
                            res.status(500).json({
                                success: false,
                                message: 'Server error while resetting password'
                            });
                            return;
                        }

                        res.json({
                            success: true,
                            message: `Password for ${existing.first_name} ${existing.last_name} has been reset successfully`
                        });
                    }
                );
            }
        );

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while resetting password'
        });
    }
});

// Delete staff member
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const connection = await pool.getConnection();

        // Check if staff member exists
        const [existing] = await connection.execute(
            'SELECT id FROM staff_members WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        // Delete staff member
        await connection.execute('DELETE FROM staff_members WHERE id = ?', [id]);
        connection.release();

        res.json({
            success: true,
            message: 'Staff member deleted successfully'
        });

    } catch (error) {
        console.error('Delete staff error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting staff member'
        });
    }
});

module.exports = router;