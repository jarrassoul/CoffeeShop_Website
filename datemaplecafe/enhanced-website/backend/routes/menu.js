const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');

const router = express.Router();

// Middleware to verify admin or staff token
const verifyAuthToken = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user info based on token type
        if (decoded.userType === 'staff') {
            db.get(
                'SELECT id, staff_id, role, first_name, last_name FROM staff_members WHERE id = ?',
                [decoded.userId],
                (err, staff) => {
                    if (err || !staff) {
                        return res.status(401).json({
                            success: false,
                            message: 'Invalid token.'
                        });
                    }
                    req.user = { ...staff, userType: 'staff' };
                    next();
                }
            );
        } else {
            // Admin user
            db.get(
                'SELECT id, username, first_name, last_name FROM admin_users WHERE id = ?',
                [decoded.userId],
                (err, admin) => {
                    if (err || !admin) {
                        return res.status(401).json({
                            success: false,
                            message: 'Invalid token.'
                        });
                    }
                    req.user = { ...admin, userType: 'admin' };
                    next();
                }
            );
        }
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

// Middleware to check if user can edit menu (Admin or Manager)
const canEditMenu = (req, res, next) => {
    if (req.user.userType === 'admin' || req.user.role === 'Manager') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. Admin or Manager role required.'
        });
    }
};

// Get all menu categories
router.get('/categories', verifyAuthToken, (req, res) => {
    db.all(
        'SELECT * FROM menu_categories ORDER BY display_order ASC',
        [],
        (err, categories) => {
            if (err) {
                console.error('Get categories error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Server error while fetching categories'
                });
            }

            res.json({
                success: true,
                categories
            });
        }
    );
});

// Get all menu items with category info
router.get('/items', verifyAuthToken, (req, res) => {
    db.all(`
        SELECT
            mi.*,
            mc.name as category_name,
            au.username as created_by_username
        FROM menu_items mi
        LEFT JOIN menu_categories mc ON mi.category_id = mc.id
        LEFT JOIN admin_users au ON mi.created_by = au.id
        ORDER BY mc.display_order ASC, mi.display_order ASC
    `, [], (err, items) => {
        if (err) {
            console.error('Get menu items error:', err);
            return res.status(500).json({
                success: false,
                message: 'Server error while fetching menu items'
            });
        }

        res.json({
            success: true,
            items
        });
    });
});

// Create new menu category
router.post('/categories', [
    verifyAuthToken,
    canEditMenu,
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Category name is required (1-100 characters)'),
    body('description').optional().isLength({ max: 255 }).withMessage('Description must be less than 255 characters'),
    body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a positive integer')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const { name, description, displayOrder } = req.body;

    db.run(
        'INSERT INTO menu_categories (name, description, display_order) VALUES (?, ?, ?)',
        [name, description || null, displayOrder || 0],
        function(err) {
            if (err) {
                console.error('Create category error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Server error while creating category'
                });
            }

            res.status(201).json({
                success: true,
                message: 'Category created successfully',
                category: {
                    id: this.lastID,
                    name,
                    description: description || null,
                    display_order: displayOrder || 0
                }
            });
        }
    );
});

// Create new menu item
router.post('/items', [
    verifyAuthToken,
    canEditMenu,
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Item name is required (1-100 characters)'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('categoryId').isInt({ min: 1 }).withMessage('Valid category ID is required'),
    body('imageUrl').optional().isURL().withMessage('Image URL must be valid'),
    body('allergens').optional().isLength({ max: 255 }).withMessage('Allergens must be less than 255 characters'),
    body('preparationTime').optional().isInt({ min: 1, max: 120 }).withMessage('Preparation time must be 1-120 minutes')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }

    const {
        name, description, price, categoryId, imageUrl,
        isAvailable, isFeatured, allergens, preparationTime, displayOrder
    } = req.body;

    const createdBy = req.user.userType === 'admin' ? req.user.id : null;

    db.run(`
        INSERT INTO menu_items (
            name, description, price, category_id, image_url,
            is_available, is_featured, allergens, preparation_time,
            display_order, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        name, description || null, price, categoryId, imageUrl || null,
        isAvailable !== false ? 1 : 0, isFeatured === true ? 1 : 0,
        allergens || null, preparationTime || 5, displayOrder || 0, createdBy
    ], function(err) {
        if (err) {
            console.error('Create menu item error:', err);
            return res.status(500).json({
                success: false,
                message: 'Server error while creating menu item'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Menu item created successfully',
            item: {
                id: this.lastID,
                name,
                description: description || null,
                price,
                category_id: categoryId,
                image_url: imageUrl || null,
                is_available: isAvailable !== false ? 1 : 0,
                is_featured: isFeatured === true ? 1 : 0,
                allergens: allergens || null,
                preparation_time: preparationTime || 5,
                display_order: displayOrder || 0
            }
        });
    });
});

// Update menu item
router.put('/items/:id', [
    verifyAuthToken,
    canEditMenu,
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Item name must be 1-100 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('categoryId').optional().isInt({ min: 1 }).withMessage('Valid category ID is required')
], (req, res) => {
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

    // Build update query
    const updateFields = [];
    const updateValues = [];

    Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
            switch(key) {
                case 'categoryId':
                    updateFields.push('category_id = ?');
                    updateValues.push(value);
                    break;
                case 'imageUrl':
                    updateFields.push('image_url = ?');
                    updateValues.push(value);
                    break;
                case 'isAvailable':
                    updateFields.push('is_available = ?');
                    updateValues.push(value ? 1 : 0);
                    break;
                case 'isFeatured':
                    updateFields.push('is_featured = ?');
                    updateValues.push(value ? 1 : 0);
                    break;
                case 'preparationTime':
                    updateFields.push('preparation_time = ?');
                    updateValues.push(value);
                    break;
                case 'displayOrder':
                    updateFields.push('display_order = ?');
                    updateValues.push(value);
                    break;
                default:
                    if (['name', 'description', 'price', 'allergens'].includes(key)) {
                        updateFields.push(`${key} = ?`);
                        updateValues.push(value);
                    }
                    break;
            }
        }
    });

    if (updateFields.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No valid fields to update'
        });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    db.run(
        `UPDATE menu_items SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues,
        function(err) {
            if (err) {
                console.error('Update menu item error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Server error while updating menu item'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Menu item not found'
                });
            }

            res.json({
                success: true,
                message: 'Menu item updated successfully'
            });
        }
    );
});

// Delete menu item
router.delete('/items/:id', [verifyAuthToken, canEditMenu], (req, res) => {
    const { id } = req.params;

    db.run(
        'DELETE FROM menu_items WHERE id = ?',
        [id],
        function(err) {
            if (err) {
                console.error('Delete menu item error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Server error while deleting menu item'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Menu item not found'
                });
            }

            res.json({
                success: true,
                message: 'Menu item deleted successfully'
            });
        }
    );
});

module.exports = router;