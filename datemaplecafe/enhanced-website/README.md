# 🍁 Date & Maple Café - Admin Dashboard

A complete staff management system for Date & Maple Café built with React, Node.js, Express, and MySQL.

## Features

- **Admin Authentication**: Secure login system with JWT tokens
- **Staff Management**: Complete CRUD operations for staff members
- **Auto-increment Staff IDs**: Automatic ID generation with role prefixes
  - Manager: MA001, MA002, etc.
  - Barista: BA001, BA002, etc.
  - Cashier: CA001, CA002, etc.
  - Baker: BK001, BK002, etc.
  - Cleaner: CL001, CL002, etc.
- **Role-based System**: Support for 5 different staff roles
- **Responsive Design**: Matches the main café website styling
- **Real-time Statistics**: Dashboard with staff counts and role distribution
- **Search and Filtering**: Easy staff member lookup

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **express-rate-limit** - API rate limiting
- **helmet** - Security middleware
- **cors** - Cross-origin resource sharing

### Frontend
- **React** - UI framework
- **React Router** - Navigation
- **Axios** - HTTP client
- **Font Awesome** - Icons
- **Google Fonts** - Typography (Playfair Display, Inter)

## Prerequisites

Before running this application, make sure you have installed:

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **MySQL** (v8.0 or higher)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd enhanced-website
```

### 2. Database Setup

1. **Create MySQL Database:**
```sql
CREATE DATABASE date_maple_cafe;
```

2. **Run the Database Schema:**
```bash
mysql -u your_username -p date_maple_cafe < database.sql
```

### 3. Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
Edit `backend/.env` file with your database credentials:
```env
DB_HOST=localhost
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=date_maple_cafe

PORT=5000
NODE_ENV=development

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h

ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@datemaplecafe.com
ADMIN_PASSWORD=admin123
```

4. **Start the backend server:**
```bash
npm start
```
For development with auto-reload:
```bash
npm run dev
```

The backend will run on `http://localhost:3000`

### 4. You're Done!

The backend server now serves both:
- **API endpoints** at http://localhost:3000/api/
- **Static website files** at http://localhost:3000/
- **Admin dashboard** at http://localhost:3000/admin

No separate frontend server needed!

## Usage

### Accessing the Admin Dashboard

1. **Start the backend server** (this serves both the API and the website):
```bash
cd backend && npm start
```

2. **Open your browser** to: http://localhost:3000

3. **Navigate to the admin page**:
   - Click the "Admin" link in the navigation menu, or
   - Go directly to: http://localhost:3000/admin

### Default Admin Credentials
- **Username:** `admin`
- **Password:** `admin123`

### Staff ID System

When creating new staff members, the system automatically generates unique IDs:

| Role | Prefix | Example IDs |
|------|--------|-------------|
| Manager | MA | MA001, MA002, MA003... |
| Barista | BA | BA001, BA002, BA003... |
| Cashier | CA | CA001, CA002, CA003... |
| Baker | BK | BK001, BK002, BK003... |
| Cleaner | CL | CL001, CL002, CL003... |

### API Endpoints

#### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

#### Staff Management
- `GET /api/staff` - Get all staff members
- `POST /api/staff` - Create new staff member
- `GET /api/staff/:id` - Get staff member by ID
- `PUT /api/staff/:id` - Update staff member
- `DELETE /api/staff/:id` - Delete staff member

#### Health Check
- `GET /api/health` - API health status

## Project Structure

```
enhanced-website/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── staff.js
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── ProtectedRoute.js
│   │   │   └── StaffModal.js
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   ├── Login.js
│   │   │   └── Staff.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── auth.js
│   │   ├── App.js
│   │   ├── index.css
│   │   └── index.js
│   └── package.json
├── css/
│   └── styles.css
├── images/
├── js/
├── database.sql
├── index.html
└── README.md
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured for secure cross-origin requests
- **Helmet Security**: Additional security headers

## Development

### Backend Development
```bash
cd backend
npm run dev  # Starts server with nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm start  # Starts React development server
```

### Building for Production
```bash
cd frontend
npm run build  # Creates optimized production build
```

## Troubleshooting

### Common Issues

1. **Database Connection Error:**
   - Verify MySQL is running
   - Check database credentials in `.env`
   - Ensure database `date_maple_cafe` exists

2. **Port Already in Use:**
   - Change `PORT` in `backend/.env`
   - Or kill the process using the port

3. **CORS Errors:**
   - Verify frontend URL in backend CORS configuration
   - Check if both servers are running

4. **Authentication Issues:**
   - Clear browser localStorage
   - Check JWT_SECRET in `.env`

### Database Reset

To reset the database with fresh data:
```bash
mysql -u your_username -p -e "DROP DATABASE date_maple_cafe; CREATE DATABASE date_maple_cafe;"
mysql -u your_username -p date_maple_cafe < database.sql
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software for Date & Maple Café.

## Support

For support, email admin@datemaplecafe.com or create an issue in the repository.