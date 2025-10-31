require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from enhanced-website directory
app.use(express.static(path.join(__dirname, 'enhanced-website')));

// Data storage paths
const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const STAFF_FILE = path.join(DATA_DIR, 'staff.json');

// Ensure data directory exists
async function ensureDataDirectory() {
    try {
        await fs.access(DATA_DIR);
    } catch (error) {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// Utility functions for file operations
async function readJSONFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function writeJSONFile(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Password hashing utilities
function hashPassword(password) {
    const salt = crypto.randomBytes(32).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return {
        salt: salt,
        hash: hash
    };
}

function verifyPassword(password, salt, hash) {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
}

// Email Configuration
let transporter;

// Configure email service based on environment or use Gmail as default for real sending
function configureEmailService() {
    // For real email sending, let's use Gmail SMTP which works reliably
    // You can change this to other services like Outlook, Yahoo, etc.

    const emailConfig = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER || 'datemaplecafe.orders@gmail.com', // Default demo email
            pass: process.env.EMAIL_PASS || 'your-app-password-here'          // Need real app password
        },
        tls: {
            rejectUnauthorized: false
        }
    };

    // Alternative configuration for Outlook/Hotmail
    if (process.env.EMAIL_SERVICE === 'outlook') {
        emailConfig.host = 'smtp-mail.outlook.com';
        emailConfig.port = 587;
        emailConfig.secure = false;
    }

    // Alternative configuration for Yahoo
    if (process.env.EMAIL_SERVICE === 'yahoo') {
        emailConfig.host = 'smtp.mail.yahoo.com';
        emailConfig.port = 587;
        emailConfig.secure = false;
    }

    transporter = nodemailer.createTransport(emailConfig);

    console.log('📧 Email service configured:');
    console.log('   Service:', emailConfig.host);
    console.log('   Port:', emailConfig.port);
    console.log('   User:', emailConfig.auth.user);

    return transporter;
}

// Initialize email service
configureEmailService();

// Email Templates
function createOrderConfirmationEmail(order) {
    const items = order.cart?.items || [];
    const total = order.cart?.total || 0;
    const pickupTime = order.cart?.pickupTime || 'ASAP';
    const customerName = `${order.customerInfo.firstName} ${order.customerInfo.lastName}`;

    const itemsHTML = items.map(item => {
        const itemTotal = (item.finalPrice || item.basePrice || 0) * (item.quantity || 1);
        const optionsText = item.options ? Object.entries(item.options)
            .filter(([key, value]) => value && value !== 'None' && value !== '')
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ') : '';

        return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 5px;">
                    <strong>${item.quantity || 1}x ${item.name}</strong>
                    ${optionsText ? `<br><small style="color: #666;">• ${optionsText}</small>` : ''}
                </td>
                <td style="padding: 10px 5px; text-align: right; font-weight: bold;">$${itemTotal.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    return {
        subject: `Order Confirmation #${order.id} - DateMapleCafe`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Order Confirmation</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
                    .header { background: linear-gradient(135deg, #8B4513, #A0522D); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: white; padding: 20px; border: 1px solid #ddd; }
                    .footer { background: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
                    .order-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    .total-row { background: #e8f5e8; font-weight: bold; }
                    .status-badge { background: #ffc107; color: #856404; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🍁 DateMapleCafe</h1>
                    <p>Order Confirmation</p>
                </div>

                <div class="content">
                    <h2>Thank you for your order, ${customerName}!</h2>
                    <p>We've received your order and are preparing it with care. Here are the details:</p>

                    <div class="order-details">
                        <h3>📋 Order Information</h3>
                        <p><strong>Order Number:</strong> #${order.id}</p>
                        <p><strong>Date:</strong> ${new Date(order.timestamp).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> ${new Date(order.timestamp).toLocaleTimeString()}</p>
                        <p><strong>Status:</strong> <span class="status-badge">${order.status.toUpperCase()}</span></p>
                        <p><strong>Pickup Time:</strong> ${pickupTime}</p>
                        <p><strong>Payment Method:</strong> ${order.paymentMethod === 'cash' ? 'Cash on Pickup' : 'Card (Paid)'}</p>
                    </div>

                    <h3>☕ Your Order</h3>
                    <table class="items-table">
                        <thead>
                            <tr style="background: #8B4513; color: white;">
                                <th style="padding: 10px 5px; text-align: left;">Item</th>
                                <th style="padding: 10px 5px; text-align: right;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHTML}
                            <tr class="total-row">
                                <td style="padding: 15px 5px; text-align: right;"><strong>Total:</strong></td>
                                <td style="padding: 15px 5px; text-align: right; font-size: 18px;"><strong>$${total.toFixed(2)}</strong></td>
                            </tr>
                        </tbody>
                    </table>

                    ${order.specialInstructions ? `
                        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 15px 0;">
                            <h4 style="margin: 0 0 5px 0; color: #856404;">📝 Special Instructions</h4>
                            <p style="margin: 0; color: #856404;">${order.specialInstructions}</p>
                        </div>
                    ` : ''}

                    <div style="background: #d4edda; border: 1px solid #28a745; border-radius: 8px; padding: 15px; margin: 20px 0;">
                        <h4 style="margin: 0 0 10px 0; color: #155724;">🕐 What's Next?</h4>
                        <ul style="margin: 0; color: #155724;">
                            <li>We're preparing your order now</li>
                            <li>You'll receive updates if there are any changes</li>
                            <li>Come to DateMapleCafe at your pickup time</li>
                            <li>Show this email or mention order #${order.id}</li>
                        </ul>
                    </div>
                </div>

                <div class="footer">
                    <p><strong>DateMapleCafe</strong><br>
                    Premium Coffee & More<br>
                    Thank you for choosing us!</p>
                    <p style="margin-top: 15px;">
                        <small>This is an automated email. Please save this for your records.</small>
                    </p>
                </div>
            </body>
            </html>
        `
    };
}

// Send Order Confirmation Email
async function sendOrderConfirmationEmail(order) {
    try {
        console.log(`📧 Attempting to send email to: ${order.customerInfo.email}`);

        const emailContent = createOrderConfirmationEmail(order);

        const mailOptions = {
            from: `"DateMapleCafe Orders" <${process.env.EMAIL_USER || 'datemaplecafe.orders@gmail.com'}>`,
            to: order.customerInfo.email,
            subject: emailContent.subject,
            html: emailContent.html,
            // Add text version as fallback
            text: `
Order Confirmation #${order.id}

Dear ${order.customerInfo.firstName} ${order.customerInfo.lastName},

Thank you for your order at DateMapleCafe!

Order Details:
- Order Number: #${order.id}
- Total: $${order.cart?.total?.toFixed(2) || '0.00'}
- Pickup Time: ${order.cart?.pickupTime || 'ASAP'}
- Status: ${order.status.toUpperCase()}

We're preparing your order now. Please come to DateMapleCafe at your pickup time and mention order #${order.id}.

Thank you for choosing DateMapleCafe!
            `.trim()
        };

        console.log('📤 Sending email via:', transporter.options.host);
        const info = await transporter.sendMail(mailOptions);

        console.log('✅ Order confirmation email sent successfully!');
        console.log('   Message ID:', info.messageId);
        console.log('   Response:', info.response);

        return {
            success: true,
            messageId: info.messageId,
            response: info.response
        };
    } catch (error) {
        console.error('❌ Error sending order confirmation email:');
        console.error('   Error Code:', error.code);
        console.error('   Error Message:', error.message);
        console.error('   Command:', error.command);

        // Provide specific error messages based on common issues
        let userFriendlyMessage = error.message;
        if (error.code === 'EAUTH') {
            userFriendlyMessage = 'Email authentication failed - please check email credentials';
        } else if (error.code === 'ECONNECTION') {
            userFriendlyMessage = 'Could not connect to email server';
        } else if (error.code === 'ETIMEDOUT') {
            userFriendlyMessage = 'Email sending timed out';
        }

        return {
            success: false,
            error: userFriendlyMessage,
            code: error.code
        };
    }
}

// API Routes

// Orders endpoints
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await readJSONFile(ORDERS_FILE);
        res.json(orders);
    } catch (error) {
        console.error('Error reading orders:', error);
        res.status(500).json({ error: 'Failed to read orders' });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const newOrder = {
            id: Date.now().toString(),
            ...req.body,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        const orders = await readJSONFile(ORDERS_FILE);
        orders.push(newOrder);
        await writeJSONFile(ORDERS_FILE, orders);

        // Send order confirmation email to customer
        console.log('📧 Sending order confirmation email to:', newOrder.customerInfo.email);
        const emailResult = await sendOrderConfirmationEmail(newOrder);

        if (emailResult.success) {
            console.log('✅ Order confirmation email sent successfully');
            newOrder.emailSent = true;
            newOrder.emailMessageId = emailResult.messageId;
        } else {
            console.error('❌ Failed to send order confirmation email:', emailResult.error);
            newOrder.emailSent = false;
            newOrder.emailError = emailResult.error;
        }

        // Update the order with email status
        const updatedOrders = await readJSONFile(ORDERS_FILE);
        const orderIndex = updatedOrders.findIndex(order => order.id === newOrder.id);
        if (orderIndex !== -1) {
            updatedOrders[orderIndex] = newOrder;
            await writeJSONFile(ORDERS_FILE, updatedOrders);
        }

        res.status(201).json({
            ...newOrder,
            message: emailResult.success ? 'Order created and confirmation email sent!' : 'Order created, but email failed to send'
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const orders = await readJSONFile(ORDERS_FILE);
        const orderIndex = orders.findIndex(order => order.id === id);
        
        if (orderIndex === -1) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        orders[orderIndex].status = status;
        orders[orderIndex].lastUpdated = new Date().toISOString();
        await writeJSONFile(ORDERS_FILE, orders);
        
        res.json(orders[orderIndex]);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// Messages endpoints
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await readJSONFile(MESSAGES_FILE);
        res.json(messages);
    } catch (error) {
        console.error('Error reading messages:', error);
        res.status(500).json({ error: 'Failed to read messages' });
    }
});

app.post('/api/messages', async (req, res) => {
    try {
        const newMessage = {
            id: Date.now().toString(),
            ...req.body,
            timestamp: new Date().toISOString()
        };
        
        const messages = await readJSONFile(MESSAGES_FILE);
        messages.push(newMessage);
        await writeJSONFile(MESSAGES_FILE, messages);
        
        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ error: 'Failed to create message' });
    }
});

// Reviews endpoints
app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await readJSONFile(REVIEWS_FILE);
        res.json(reviews);
    } catch (error) {
        console.error('Error reading reviews:', error);
        res.status(500).json({ error: 'Failed to read reviews' });
    }
});

app.post('/api/reviews', async (req, res) => {
    try {
        const newReview = {
            id: Date.now().toString(),
            ...req.body,
            timestamp: new Date().toISOString()
        };
        
        const reviews = await readJSONFile(REVIEWS_FILE);
        reviews.unshift(newReview); // Add to beginning
        await writeJSONFile(REVIEWS_FILE, reviews);
        
        res.status(201).json(newReview);
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Failed to create review' });
    }
});


// Statistics endpoint
app.get('/api/stats', async (req, res) => {
    try {
        const orders = await readJSONFile(ORDERS_FILE);
        const messages = await readJSONFile(MESSAGES_FILE);
        const reviews = await readJSONFile(REVIEWS_FILE);
        
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => {
            return sum + (order.cart ? order.cart.total : 0);
        }, 0);
        const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const pendingOrders = orders.filter(order => order.status === 'pending').length;
        
        const stats = {
            totalOrders,
            totalRevenue,
            averageOrder,
            pendingOrders,
            totalMessages: messages.length,
            totalReviews: reviews.length,
            averageRating: reviews.length > 0 ? 
                reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Error calculating stats:', error);
        res.status(500).json({ error: 'Failed to calculate statistics' });
    }
});

// Data export endpoint
app.get('/api/export', async (req, res) => {
    try {
        const orders = await readJSONFile(ORDERS_FILE);
        const messages = await readJSONFile(MESSAGES_FILE);
        const reviews = await readJSONFile(REVIEWS_FILE);
        
        const exportData = {
            orders,
            messages,
            reviews,
            exportDate: new Date().toISOString()
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="cafe-data-${new Date().toISOString().split('T')[0]}.json"`);
        res.json(exportData);
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

// Admin Authentication endpoints
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    // Simple hardcoded authentication (replace with proper auth in production)
    if (username === 'admin' && password === 'admin123') {
        const token = 'admin-token-' + Date.now(); // Simple token
        const user = {
            id: 1,
            username: 'admin',
            first_name: 'Admin'
        };

        res.json({
            success: true,
            token: token,
            user: user,
            message: 'Login successful'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid username or password'
        });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

// Staff management endpoints with data persistence
app.get('/api/staff', async (req, res) => {
    try {
        const staff = await readJSONFile(STAFF_FILE);
        res.json({
            success: true,
            staff: staff
        });
    } catch (error) {
        console.error('Error reading staff:', error);
        res.status(500).json({ error: 'Failed to read staff data' });
    }
});

app.post('/api/staff', async (req, res) => {
    try {
        console.log('POST /api/staff - Full request body:', req.body);
        const { role, firstName, lastName, username, email, phone, password } = req.body;
        console.log('POST /api/staff - Extracted fields:', { role, firstName, lastName, username, email, phone, password: password ? '***masked***' : undefined });

        // Validate required fields
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        // Validate password
        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Check if username already exists
        const existingStaff = await readJSONFile(STAFF_FILE);
        const existingUsername = existingStaff.find(s => s.username === username);
        if (existingUsername) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Generate staff ID
        const rolePrefix = {
            'Manager': 'MA',
            'Barista': 'BA',
            'Cashier': 'CA',
            'Baker': 'BK',
            'Cleaner': 'CL'
        };

        // Hash the password
        const passwordHash = hashPassword(password);

        // Generate staff ID from existing data
        const roleStaff = existingStaff.filter(s => s.role === role);
        const nextNumber = String(roleStaff.length + 1).padStart(3, '0');

        const newStaff = {
            id: Date.now(),
            staff_id: `${rolePrefix[role] || 'ST'}${nextNumber}`,
            role,
            first_name: firstName,
            last_name: lastName,
            username,
            email,
            phone,
            password_hash: passwordHash.hash,
            password_salt: passwordHash.salt,
            password_set: true,
            hire_date: new Date().toISOString()
        };

        // Add to staff list
        existingStaff.push(newStaff);
        await writeJSONFile(STAFF_FILE, existingStaff);

        res.json({
            success: true,
            staff: newStaff,
            message: 'Staff member created successfully'
        });
    } catch (error) {
        console.error('Error creating staff:', error);
        res.status(500).json({ error: 'Failed to create staff member' });
    }
});

app.put('/api/staff/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { role, firstName, lastName, username, email, phone } = req.body;

        // Debug: Log what we received
        console.log('PUT /api/staff/:id - Received data:', { id, role, firstName, lastName, username, email, phone });

        const staff = await readJSONFile(STAFF_FILE);
        const staffIndex = staff.findIndex(s => s.id == id);

        if (staffIndex === -1) {
            return res.status(404).json({ error: 'Staff member not found' });
        }

        // Check if username already exists (exclude current staff member)
        if (username) {
            const existingUsername = staff.find(s => s.username === username && s.id != id);
            if (existingUsername) {
                return res.status(400).json({ error: 'Username already exists' });
            }
        }

        // Debug: Log current staff data
        console.log('Before update:', staff[staffIndex]);

        // Update staff member
        staff[staffIndex] = {
            ...staff[staffIndex],
            role,
            first_name: firstName,
            last_name: lastName,
            username,
            email,
            phone,
            updated_date: new Date().toISOString()
        };

        // Debug: Log updated staff data
        console.log('After update:', staff[staffIndex]);

        await writeJSONFile(STAFF_FILE, staff);

        res.json({
            success: true,
            staff: staff[staffIndex],
            message: 'Staff member updated successfully'
        });
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).json({ error: 'Failed to update staff member' });
    }
});

app.delete('/api/staff/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const staff = await readJSONFile(STAFF_FILE);
        const staffIndex = staff.findIndex(s => s.id == id);

        if (staffIndex === -1) {
            return res.status(404).json({ error: 'Staff member not found' });
        }

        const deletedStaff = staff[staffIndex];
        staff.splice(staffIndex, 1);

        await writeJSONFile(STAFF_FILE, staff);

        res.json({
            success: true,
            message: `Staff member ${deletedStaff.first_name} ${deletedStaff.last_name} deleted successfully`
        });
    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).json({ error: 'Failed to delete staff member' });
    }
});

// Reset staff password endpoint
app.post('/api/staff/:id/reset-password', async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        // Validate new password
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const staff = await readJSONFile(STAFF_FILE);
        const staffIndex = staff.findIndex(s => s.id == id);

        if (staffIndex === -1) {
            return res.status(404).json({ error: 'Staff member not found' });
        }

        // Hash the new password
        const passwordHash = hashPassword(newPassword);

        // Update staff member with new password
        staff[staffIndex] = {
            ...staff[staffIndex],
            password_hash: passwordHash.hash,
            password_salt: passwordHash.salt,
            password_set: true,
            password_reset_date: new Date().toISOString()
        };

        await writeJSONFile(STAFF_FILE, staff);

        res.json({
            success: true,
            message: `Password reset successfully for ${staff[staffIndex].first_name} ${staff[staffIndex].last_name}`
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// Data management endpoints (for admin)
app.delete('/api/orders', async (req, res) => {
    try {
        await writeJSONFile(ORDERS_FILE, []);
        res.json({ message: 'All orders cleared' });
    } catch (error) {
        console.error('Error clearing orders:', error);
        res.status(500).json({ error: 'Failed to clear orders' });
    }
});

app.delete('/api/messages', async (req, res) => {
    try {
        await writeJSONFile(MESSAGES_FILE, []);
        res.json({ message: 'All messages cleared' });
    } catch (error) {
        console.error('Error clearing messages:', error);
        res.status(500).json({ error: 'Failed to clear messages' });
    }
});

app.delete('/api/reviews', async (req, res) => {
    try {
        await writeJSONFile(REVIEWS_FILE, []);
        res.json({ message: 'All reviews cleared' });
    } catch (error) {
        console.error('Error clearing reviews:', error);
        res.status(500).json({ error: 'Failed to clear reviews' });
    }
});


// Serve main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'enhanced-website', 'index.html'));
});

// Serve admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'enhanced-website', 'admin.html'));
});

// Serve staff management page
app.get('/staff', (req, res) => {
    res.sendFile(path.join(__dirname, 'enhanced-website', 'staff.html'));
});


// Handle 404 errors
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'enhanced-website', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
    try {
        await ensureDataDirectory();
        
        app.listen(PORT, () => {
            console.log(`🍁 Date & Maple Café Server is running on http://localhost:${PORT}`);
            console.log(`🔗 API endpoints available at http://localhost:${PORT}/api/`);
            console.log('\n📋 Available API endpoints:');
            console.log('  GET    /api/orders       - Get all orders');
            console.log('  POST   /api/orders       - Create new order');
            console.log('  PUT    /api/orders/:id/status - Update order status');
            console.log('  GET    /api/messages     - Get all messages');
            console.log('  POST   /api/messages     - Create new message');
            console.log('  GET    /api/reviews      - Get all reviews');
            console.log('  POST   /api/reviews      - Create new review');
            console.log('  GET    /api/stats        - Get statistics');
            console.log('  GET    /api/export       - Export all data');
            console.log('  DELETE /api/orders       - Clear all orders');
            console.log('  DELETE /api/messages     - Clear all messages');
            console.log('  DELETE /api/reviews      - Clear all reviews');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();