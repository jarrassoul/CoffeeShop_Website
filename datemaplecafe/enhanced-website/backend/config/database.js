const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'coffee_shop.db');

// Create database directory if it doesn't exist
const fs = require('fs');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initializeDatabase = async () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Create admin_users table
            db.run(`
                CREATE TABLE IF NOT EXISTS admin_users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    first_name VARCHAR(50) NOT NULL,
                    last_name VARCHAR(50) NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME NULL
                )
            `);

            // Create staff_members table
            db.run(`
                CREATE TABLE IF NOT EXISTS staff_members (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    staff_id VARCHAR(10) UNIQUE NOT NULL,
                    role TEXT CHECK(role IN ('Manager', 'Barista', 'Cashier', 'Baker', 'Cleaner')) NOT NULL,
                    first_name VARCHAR(50) NOT NULL,
                    last_name VARCHAR(50) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    phone VARCHAR(20) NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    hire_date DATE NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_by INTEGER,
                    last_login DATETIME NULL,
                    FOREIGN KEY (created_by) REFERENCES admin_users(id)
                )
            `);

            // Create menu_categories table
            db.run(`
                CREATE TABLE IF NOT EXISTS menu_categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    display_order INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create menu_items table
            db.run(`
                CREATE TABLE IF NOT EXISTS menu_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    price DECIMAL(8,2) NOT NULL,
                    category_id INTEGER NOT NULL,
                    image_url VARCHAR(255),
                    is_available BOOLEAN DEFAULT 1,
                    is_featured BOOLEAN DEFAULT 0,
                    allergens TEXT,
                    preparation_time INTEGER DEFAULT 5,
                    display_order INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_by INTEGER,
                    FOREIGN KEY (category_id) REFERENCES menu_categories(id),
                    FOREIGN KEY (created_by) REFERENCES admin_users(id)
                )
            `);

            // Create role_counters table
            db.run(`
                CREATE TABLE IF NOT EXISTS role_counters (
                    role VARCHAR(20) PRIMARY KEY,
                    counter INTEGER DEFAULT 0
                )
            `);

            // Check if admin user exists
            db.get(
                'SELECT COUNT(*) as count FROM admin_users WHERE username = ?',
                [process.env.ADMIN_USERNAME || 'admin'],
                async (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Create default admin user if doesn't exist
                    if (row.count === 0) {
                        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
                        db.run(`
                            INSERT INTO admin_users (username, email, password_hash, first_name, last_name)
                            VALUES (?, ?, ?, 'Admin', 'User')
                        `, [
                            process.env.ADMIN_USERNAME || 'admin',
                            process.env.ADMIN_EMAIL || 'admin@datemaplecafe.com',
                            hashedPassword
                        ], (err) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            console.log('Default admin user created');
                        });
                    }
                }
            );

            // Initialize role counters
            const roles = ['Manager', 'Barista', 'Cashier', 'Baker', 'Cleaner'];
            roles.forEach(role => {
                db.run(`
                    INSERT OR IGNORE INTO role_counters (role, counter) VALUES (?, 0)
                `, [role]);
            });

            // Initialize default menu categories
            const defaultCategories = [
                { name: 'Coffee & Espresso', description: 'Hot and cold coffee beverages', display_order: 1 },
                { name: 'Tea & Infusions', description: 'Premium teas and herbal infusions', display_order: 2 },
                { name: 'Cold Beverages', description: 'Iced drinks and refreshers', display_order: 3 },
                { name: 'Pastries & Desserts', description: 'Fresh baked goods and sweet treats', display_order: 4 },
                { name: 'Breakfast & Light Meals', description: 'Sandwiches, salads, and breakfast items', display_order: 5 }
            ];

            defaultCategories.forEach(category => {
                db.run(`
                    INSERT OR IGNORE INTO menu_categories (name, description, display_order) VALUES (?, ?, ?)
                `, [category.name, category.description, category.display_order]);
            });

            console.log('Database initialized successfully');
            resolve();
        });
    });
};

// Generate staff ID function
const generateStaffId = async (role) => {
    return new Promise((resolve, reject) => {
        // Get role prefix
        const rolePrefixes = {
            'Manager': 'MA',
            'Barista': 'BA',
            'Cashier': 'CA',
            'Baker': 'BK',
            'Cleaner': 'CL'
        };

        const prefix = rolePrefixes[role] || 'ST';

        db.serialize(() => {
            // Increment counter and get new value
            db.run(
                'UPDATE role_counters SET counter = counter + 1 WHERE role = ?',
                [role],
                function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Get the updated counter
                    db.get(
                        'SELECT counter FROM role_counters WHERE role = ?',
                        [role],
                        (err, row) => {
                            if (err) {
                                reject(err);
                                return;
                            }

                            const counter = row.counter;
                            const staffId = `${prefix}${counter.toString().padStart(3, '0')}`;
                            resolve(staffId);
                        }
                    );
                }
            );
        });
    });
};

module.exports = {
    db,
    initializeDatabase,
    generateStaffId
};