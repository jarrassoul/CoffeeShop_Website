// Simple test server for admin page routing
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// CORS configuration
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle admin route BEFORE static files
app.get('/admin', (req, res) => {
    console.log('🍁 Admin route accessed - serving admin.html');
    const adminPath = path.join(__dirname, '..', 'admin.html');
    console.log('Admin file path:', adminPath);
    res.sendFile(adminPath, (err) => {
        if (err) {
            console.error('Error serving admin.html:', err);
            res.status(500).send('Error loading admin page');
        } else {
            console.log('✅ Admin.html served successfully');
        }
    });
});

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Test server is working!', timestamp: new Date().toISOString() });
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Date Maple Cafe TEST API is running',
        timestamp: new Date().toISOString()
    });
});

// Serve static files from the parent directory (main website)
app.use(express.static(path.join(__dirname, '..')));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found (test mode - no database)'
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🍁 Date Maple Cafe TEST Server running on port', PORT);
    console.log('🌐 Main website: http://localhost:' + PORT);
    console.log('🔧 Admin dashboard: http://localhost:' + PORT + '/admin');
    console.log('🏥 Health check: http://localhost:' + PORT + '/api/health');
    console.log('⚡ Test endpoint: http://localhost:' + PORT + '/test');
    console.log('');
    console.log('Note: This is a test server without database connection');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});