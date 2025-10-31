# 🍁 Quick Start Guide - Date & Maple Café Admin

## 🚨 If Admin Login Doesn't Work

### Option 1: Auto-Setup (Recommended)
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create admin user automatically
npm run create-admin
```

### Option 2: Manual Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Update .env file with your database credentials
nano .env

# Create database and admin user
mysql -u your_username -p -e "CREATE DATABASE IF NOT EXISTS date_maple_cafe;"
node create-admin.js
```

### Option 3: Verify Existing Admin
```bash
cd backend
npm run verify-admin
```

## 🚀 Start the Server

```bash
cd backend
npm start
```

Then visit: **http://localhost:3000/admin**

## 🔑 Default Credentials

- **Username:** `admin`
- **Password:** `admin123`

## 🔧 Troubleshooting

### "Database connection failed"
1. Make sure MySQL is running
2. Check credentials in `backend/.env`
3. Create database: `mysql -u username -p -e "CREATE DATABASE date_maple_cafe;"`

### "Invalid username or password"
1. Run: `cd backend && npm run create-admin`
2. This will reset/create the admin user

### "Admin user already exists"
- The admin user exists but might have a different password
- Run `npm run create-admin` to reset the password to `admin123`

## 📱 Features Available

✅ **Dashboard**: Staff statistics and overview
✅ **Staff Management**: Add/Edit/Delete staff members
✅ **Auto Staff IDs**: MA001, BA001, CA001, BK001, CL001
✅ **Search & Filter**: Find staff by name, role, or ID
✅ **Responsive Design**: Works on mobile and desktop

## 🌐 URLs

- **Main Website**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **API Health Check**: http://localhost:3000/api/health

---

💡 **Need help?** The admin creation script will show you exactly what credentials were created!