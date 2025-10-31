require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'date_maple_cafe'
};

async function createAdmin() {
    let connection;
    try {
        console.log('🍁 Creating Admin User for Date & Maple Café');
        console.log('============================================');

        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected');

        // Create database if it doesn't exist
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        await connection.execute(`USE ${dbConfig.database}`);
        console.log('✅ Database selected');

        // Create admin_users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS admin_users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL
            )
        `);
        console.log('✅ admin_users table created');

        // Create staff_members table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS staff_members (
                id INT AUTO_INCREMENT PRIMARY KEY,
                staff_id VARCHAR(10) UNIQUE NOT NULL,
                role ENUM('Manager', 'Barista', 'Cashier', 'Baker', 'Cleaner') NOT NULL,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(20) NOT NULL,
                hire_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by INT,
                FOREIGN KEY (created_by) REFERENCES admin_users(id)
            )
        `);
        console.log('✅ staff_members table created');

        // Create role_counters table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS role_counters (
                role VARCHAR(20) PRIMARY KEY,
                counter INT DEFAULT 0
            )
        `);
        console.log('✅ role_counters table created');

        // Initialize role counters
        const roles = ['Manager', 'Barista', 'Cashier', 'Baker', 'Cleaner'];
        for (const role of roles) {
            await connection.execute(
                'INSERT IGNORE INTO role_counters (role, counter) VALUES (?, 0)',
                [role]
            );
        }
        console.log('✅ Role counters initialized');

        // Check if admin user exists
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@datemaplecafe.com';

        const [existing] = await connection.execute(
            'SELECT id FROM admin_users WHERE username = ? OR email = ?',
            [adminUsername, adminEmail]
        );

        if (existing.length > 0) {
            console.log('⚠️  Admin user already exists, updating password...');

            // Update existing admin password
            const hashedPassword = await bcrypt.hash(adminPassword, 12);
            await connection.execute(
                'UPDATE admin_users SET password_hash = ? WHERE username = ?',
                [hashedPassword, adminUsername]
            );
            console.log('✅ Admin password updated');
        } else {
            console.log('🔧 Creating new admin user...');

            // Create new admin user
            const hashedPassword = await bcrypt.hash(adminPassword, 12);
            await connection.execute(`
                INSERT INTO admin_users (username, email, password_hash, first_name, last_name)
                VALUES (?, ?, ?, 'Admin', 'User')
            `, [adminUsername, adminEmail, hashedPassword]);
            console.log('✅ Admin user created');
        }

        // Verify the admin user
        const [admin] = await connection.execute(
            'SELECT username, email, first_name, last_name, created_at FROM admin_users WHERE username = ?',
            [adminUsername]
        );

        console.log('');
        console.log('🎉 Setup Complete!');
        console.log('==================');
        console.log(`👤 Admin: ${admin[0].first_name} ${admin[0].last_name}`);
        console.log(`📧 Email: ${admin[0].email}`);
        console.log(`🔑 Username: ${admin[0].username}`);
        console.log(`🗝️  Password: ${adminPassword}`);
        console.log('');
        console.log('🌐 Access Admin Dashboard:');
        console.log('   http://localhost:3000/admin');
        console.log('');
        console.log('To start the server:');
        console.log('   cd backend && npm start');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('');
        console.log('💡 Make sure MySQL is running and credentials in .env are correct');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

createAdmin();