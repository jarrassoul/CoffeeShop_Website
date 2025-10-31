-- Date Maple Cafe Admin Database Schema

CREATE DATABASE IF NOT EXISTS date_maple_cafe;
USE date_maple_cafe;

-- Admin users table
CREATE TABLE admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Staff members table
CREATE TABLE staff_members (
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
);

-- Create the default admin user
-- Password: admin123 (hashed using bcrypt)
INSERT INTO admin_users (username, email, password_hash, first_name, last_name)
VALUES ('admin', 'admin@datemaplecafe.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User');

-- Create role counters table to track next ID number for each role
CREATE TABLE role_counters (
    role VARCHAR(20) PRIMARY KEY,
    counter INT DEFAULT 0
);

-- Initialize counters for each role
INSERT INTO role_counters (role, counter) VALUES
('Manager', 0),
('Barista', 0),
('Cashier', 0),
('Baker', 0),
('Cleaner', 0);

-- Function to generate staff ID
DELIMITER //
CREATE FUNCTION generate_staff_id(role_name VARCHAR(20))
RETURNS VARCHAR(10)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE role_prefix VARCHAR(2);
    DECLARE next_counter INT;
    DECLARE staff_id VARCHAR(10);

    -- Get role prefix
    CASE role_name
        WHEN 'Manager' THEN SET role_prefix = 'MA';
        WHEN 'Barista' THEN SET role_prefix = 'BA';
        WHEN 'Cashier' THEN SET role_prefix = 'CA';
        WHEN 'Baker' THEN SET role_prefix = 'BK';
        WHEN 'Cleaner' THEN SET role_prefix = 'CL';
        ELSE SET role_prefix = 'ST';
    END CASE;

    -- Get and increment counter
    UPDATE role_counters SET counter = counter + 1 WHERE role = role_name;
    SELECT counter INTO next_counter FROM role_counters WHERE role = role_name;

    -- Generate staff ID with zero-padded counter
    SET staff_id = CONCAT(role_prefix, LPAD(next_counter, 3, '0'));

    RETURN staff_id;
END //
DELIMITER ;