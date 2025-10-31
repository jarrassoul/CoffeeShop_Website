require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'date_maple_cafe'
};

async function verifyAdmin() {
    let connection;
    try {
        console.log('🍁 Date & Maple Café - Admin Verification');
        console.log('==========================================');

        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected successfully');

        // Check if admin_users table exists
        const [tables] = await connection.execute(
            "SHOW TABLES LIKE 'admin_users'"
        );

        if (tables.length === 0) {
            console.log('❌ admin_users table does not exist');
            console.log('💡 Run the database schema first: mysql -u username -p date_maple_cafe < database.sql');
            return;
        }

        console.log('✅ admin_users table exists');

        // Check for admin user
        const [users] = await connection.execute(
            'SELECT id, username, email, first_name, last_name, created_at FROM admin_users WHERE username = ?',
            [process.env.ADMIN_USERNAME || 'admin']
        );

        if (users.length === 0) {
            console.log('❌ Admin user does not exist');
            console.log('🔧 Creating admin user...');

            // Create admin user
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
            await connection.execute(`
                INSERT INTO admin_users (username, email, password_hash, first_name, last_name)
                VALUES (?, ?, ?, 'Admin', 'User')
            `, [
                process.env.ADMIN_USERNAME || 'admin',
                process.env.ADMIN_EMAIL || 'admin@datemaplecafe.com',
                hashedPassword
            ]);

            console.log('✅ Admin user created successfully');
        } else {
            console.log('✅ Admin user exists');
        }

        // Display admin info
        const [adminUsers] = await connection.execute(
            'SELECT username, email, first_name, last_name, created_at FROM admin_users WHERE username = ?',
            [process.env.ADMIN_USERNAME || 'admin']
        );

        const admin = adminUsers[0];
        console.log('');
        console.log('👤 Admin User Details:');
        console.log(`   Username: ${admin.username}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Name: ${admin.first_name} ${admin.last_name}`);
        console.log(`   Created: ${admin.created_at}`);
        console.log('');
        console.log('🔑 Login Credentials:');
        console.log(`   Username: ${admin.username}`);
        console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
        console.log('');
        console.log('🌐 Admin Dashboard: http://localhost:3000/admin');

        // Test password hash
        const testPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const [passwordCheck] = await connection.execute(
            'SELECT password_hash FROM admin_users WHERE username = ?',
            [process.env.ADMIN_USERNAME || 'admin']
        );

        const isPasswordValid = await bcrypt.compare(testPassword, passwordCheck[0].password_hash);
        console.log(`🔐 Password verification: ${isPasswordValid ? '✅ Valid' : '❌ Invalid'}`);

    } catch (error) {
        console.error('❌ Error:', error.message);

        if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('💡 Database does not exist. Create it first:');
            console.log('   mysql -u username -p -e "CREATE DATABASE date_maple_cafe;"');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('💡 Database credentials are incorrect. Check your .env file.');
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

verifyAdmin();