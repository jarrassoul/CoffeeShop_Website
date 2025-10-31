#!/bin/bash

# Date & Maple Café Admin System Setup Script
echo "🍁 Date & Maple Café Admin System Setup"
echo "======================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v14 or higher."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL v8.0 or higher."
    echo "   Visit: https://dev.mysql.com/downloads/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Create database (user will be prompted for credentials)
echo ""
echo "📊 Setting up database..."
echo "Please enter your MySQL root credentials:"
read -p "MySQL username: " mysql_user
read -s -p "MySQL password: " mysql_pass
echo ""

# Create database
mysql -u "$mysql_user" -p"$mysql_pass" -e "CREATE DATABASE IF NOT EXISTS date_maple_cafe;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Database 'date_maple_cafe' created successfully"
else
    echo "❌ Failed to create database. Please check your credentials and try again."
    exit 1
fi

# Update backend .env file
echo ""
echo "⚙️  Configuring backend..."
cd backend

# Update .env file with user's database credentials
sed -i "s/DB_USER=your_db_username/DB_USER=$mysql_user/" .env
sed -i "s/DB_PASSWORD=your_db_password/DB_PASSWORD=$mysql_pass/" .env

echo "✅ Backend configuration updated"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Create admin user and initialize database
echo ""
echo "👤 Creating admin user..."
node create-admin.js
if [ $? -eq 0 ]; then
    echo "✅ Admin user created successfully"
else
    echo "❌ Failed to create admin user"
    exit 1
fi

# Go back to root directory
cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "To start the application:"
echo ""
echo "1. Start the backend server (serves everything):"
echo "   cd backend && npm start"
echo ""
echo "2. Open your browser to: http://localhost:3000"
echo "   - Main website: http://localhost:3000"
echo "   - Admin dashboard: http://localhost:3000/admin"
echo ""
echo "Default admin credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "🍁 Happy managing! 🍁"