// Date & Maple Café Admin System JavaScript

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Global state
let authToken = localStorage.getItem('adminToken');
let currentUser = JSON.parse(localStorage.getItem('adminUser') || 'null');
let staffData = [];
let currentEditingStaff = null;

// Initialize admin system
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing admin system');
    checkAuthentication();
    initializeEventListeners();

    // Add click handlers for buttons that might not have onclick attributes working
    setupButtonHandlers();

    // Test modal function - make it globally available
    window.showAddStaffModal = showAddStaffModal;
    window.closeStaffModal = closeStaffModal;
    window.handleStaffSubmit = handleStaffSubmit;
    window.testModal = testModal;
    window.forceShowModal = forceShowModal;
    window.toggleStaffForm = toggleStaffForm;
    window.handleStaffFormSubmit = handleStaffFormSubmit;

    console.log('showAddStaffModal function available globally:', typeof window.showAddStaffModal);
});

// Authentication functions
function checkAuthentication() {
    if (authToken && currentUser && !isTokenExpired()) {
        showAuthenticatedState();
        showSection('dashboard');
        loadDashboardData();
    } else {
        showUnauthenticatedState();
        showSection('login');
    }
}

function isTokenExpired() {
    if (!authToken) return true;

    // For our simple token system, just check if token exists and is not too old
    try {
        const tokenTime = parseInt(authToken.split('-')[2]);
        const currentTime = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        return (currentTime - tokenTime) > maxAge;
    } catch (error) {
        return true;
    }
}

function showAuthenticatedState() {
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('userInfo').style.display = 'flex';

    if (currentUser) {
        document.getElementById('welcomeText').textContent =
            `Welcome, ${currentUser.first_name || currentUser.username}`;
    }

    // Update navigation links
    updateNavigation(true);
}

function showUnauthenticatedState() {
    document.getElementById('loginBtn').style.display = 'block';
    document.getElementById('userInfo').style.display = 'none';

    // Update navigation links
    updateNavigation(false);
}

function updateNavigation(isAuthenticated) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        // Always show navigation links for easier testing
        if (link.onclick && (link.href.includes('#dashboard') || link.href.includes('#staff'))) {
            link.style.display = 'block';
        }
    });
}

// Section management
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => section.classList.remove('active'));

    // Show requested section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update navigation active state
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));

    const activeLink = document.querySelector(`.nav-link[href="#${sectionName}"]`) ||
                      document.querySelector(`.nav-link[onclick*="${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Load section-specific data
    if (sectionName === 'dashboard') {
        loadDashboardData();
        // Setup button handlers after dashboard loads
        setTimeout(setupButtonHandlers, 100);
    } else if (sectionName === 'staff') {
        loadStaffData();
        // Setup button handlers after staff section loads
        setTimeout(setupButtonHandlers, 100);
    }
}

// Login functionality
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.getElementById('loginSubmitBtn');
    const errorDiv = document.getElementById('loginError');

    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    submitBtn.disabled = true;
    errorDiv.style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            // Store authentication data
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('adminToken', authToken);
            localStorage.setItem('adminUser', JSON.stringify(currentUser));

            // Update UI
            showAuthenticatedState();
            showSection('dashboard');

            // Clear form
            document.getElementById('loginForm').reset();

        } else {
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    } finally {
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        submitBtn.disabled = false;
    }
}

// Logout functionality
async function logout() {
    try {
        if (authToken) {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Clear local storage
        authToken = null;
        currentUser = null;
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');

        // Update UI
        showUnauthenticatedState();
        showSection('login');
    }
}

// Dashboard functionality
async function loadDashboardData() {
    try {
        const headers = {
            'Content-Type': 'application/json'
        };

        // Add auth header if token exists
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/staff`, {
            headers: headers
        });

        const data = await response.json();

        if (data.success) {
            displayDashboardStats(data.staff);
        } else {
            throw new Error(data.message || 'Failed to load dashboard data');
        }
    } catch (error) {
        console.error('Dashboard error:', error);
        displayDashboardError(error.message);
    }
}

function displayDashboardStats(staff) {
    const statsGrid = document.getElementById('statsGrid');

    // Calculate statistics
    const totalStaff = staff.length;
    const byRole = {};

    staff.forEach(member => {
        byRole[member.role] = (byRole[member.role] || 0) + 1;
    });

    const roleIcons = {
        'Manager': 'fas fa-user-tie',
        'Barista': 'fas fa-coffee',
        'Cashier': 'fas fa-cash-register',
        'Baker': 'fas fa-bread-slice',
        'Cleaner': 'fas fa-broom'
    };

    // Generate stats cards HTML
    let statsHTML = `
        <div class="stat-card">
            <i class="fas fa-users"></i>
            <div class="stat-number">${totalStaff}</div>
            <div class="stat-label">Total Staff Members</div>
        </div>
    `;

    Object.entries(byRole).forEach(([role, count]) => {
        statsHTML += `
            <div class="stat-card">
                <i class="${roleIcons[role] || 'fas fa-user'}"></i>
                <div class="stat-number">${count}</div>
                <div class="stat-label">${role}${count !== 1 ? 's' : ''}</div>
            </div>
        `;
    });

    statsGrid.innerHTML = statsHTML;
}

function displayDashboardError(message) {
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = `
        <div class="stat-card" style="grid-column: 1 / -1; color: #c33;">
            <i class="fas fa-exclamation-triangle"></i>
            <div class="stat-number">Error</div>
            <div class="stat-label">${message}</div>
        </div>
    `;
}

// Staff management functionality
async function loadStaffData() {
    const tableContainer = document.getElementById('staffTableContainer');

    // Show loading state
    tableContainer.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading staff members...</span>
        </div>
    `;

    try {
        const headers = {
            'Content-Type': 'application/json'
        };

        // Add auth header if token exists
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/staff`, {
            headers: headers
        });

        const data = await response.json();

        if (data.success) {
            staffData = data.staff;
            displayStaffTable();
            updateStaffCount();
        } else {
            throw new Error(data.message || 'Failed to load staff data');
        }
    } catch (error) {
        console.error('Staff loading error:', error);
        showStaffError(error.message);
    }
}

function displayStaffTable() {
    const tableContainer = document.getElementById('staffTableContainer');

    if (staffData.length === 0) {
        tableContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>No staff members found. Click "Add Staff" to get started.</p>
            </div>
        `;
        return;
    }

    let tableHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Staff ID</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Password Status</th>
                    <th>Hire Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    staffData.forEach(member => {
        const hireDate = new Date(member.hire_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Check password status
        const passwordStatus = member.password_set ?
            '<span class="password-status set"><i class="fas fa-check-circle"></i> Set</span>' :
            '<span class="password-status not-set"><i class="fas fa-times-circle"></i> Not Set</span>';

        tableHTML += `
            <tr>
                <td><span class="staff-id">${member.staff_id}</span></td>
                <td>${member.first_name} ${member.last_name}</td>
                <td><span class="role-badge">${member.role}</span></td>
                <td>${member.email}</td>
                <td>${member.phone}</td>
                <td>${passwordStatus}</td>
                <td>${hireDate}</td>
                <td>
                    <div class="table-actions">
                        <button onclick="editStaff(${member.id})" class="btn secondary" title="Edit Staff Member">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button onclick="resetStaffPassword(${member.id})" class="btn warning" title="Reset Password">
                            <i class="fas fa-key"></i> Reset Password
                        </button>
                        <button onclick="deleteStaff(${member.id})" class="btn danger" title="Delete Staff Member">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    tableContainer.innerHTML = tableHTML;
}

function updateStaffCount() {
    const countElement = document.getElementById('staffCount');
    if (countElement) {
        countElement.textContent = staffData.length;
    }
}

function filterStaff() {
    const roleFilter = document.getElementById('roleFilter').value;
    const searchQuery = document.getElementById('searchQuery').value.toLowerCase();

    // Filter staff data
    const filteredStaff = staffData.filter(member => {
        const matchesRole = !roleFilter || member.role === roleFilter;
        const matchesSearch = !searchQuery ||
            member.first_name.toLowerCase().includes(searchQuery) ||
            member.last_name.toLowerCase().includes(searchQuery) ||
            member.email.toLowerCase().includes(searchQuery) ||
            member.staff_id.toLowerCase().includes(searchQuery);

        return matchesRole && matchesSearch;
    });

    // Temporarily update staffData for display
    const originalStaffData = staffData;
    staffData = filteredStaff;
    displayStaffTable();
    staffData = originalStaffData;

    // Update count
    document.getElementById('staffCount').textContent = filteredStaff.length;
}

// Staff modal functions
function showAddStaffModal() {
    console.log('showAddStaffModal called');
    currentEditingStaff = null;

    const modal = document.getElementById('staffModal');
    console.log('Modal element:', modal);

    if (modal) {
        const modalTitle = document.getElementById('modalTitle');
        const submitBtn = document.getElementById('staffSubmitBtn');
        const form = document.getElementById('staffForm');
        const errorDiv = document.getElementById('modalError');

        if (modalTitle) modalTitle.textContent = 'Add New Staff Member';
        if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-plus"></i> Create Staff';
        if (form) form.reset();
        if (errorDiv) errorDiv.style.display = 'none';

        // Force modal to be visible with high z-index
        modal.style.display = 'flex';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.right = '0';
        modal.style.bottom = '0';
        modal.style.zIndex = '999999';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';

        console.log('Modal should be visible now');
        console.log('Modal display:', modal.style.display);
        console.log('Modal zIndex:', modal.style.zIndex);
        console.log('Modal computed style:', window.getComputedStyle(modal).display);
    } else {
        console.error('staffModal element not found!');
    }
}

function editStaff(staffId) {
    const staff = staffData.find(s => s.id === staffId);
    if (!staff) return;

    currentEditingStaff = staff;
    document.getElementById('modalTitle').textContent = 'Edit Staff Member';
    document.getElementById('staffSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Update Staff';

    // Populate form
    document.getElementById('staffRole').value = staff.role;
    document.getElementById('staffFirstName').value = staff.first_name;
    document.getElementById('staffLastName').value = staff.last_name;
    document.getElementById('staffEmail').value = staff.email;
    document.getElementById('staffPhone').value = staff.phone;

    document.getElementById('modalError').style.display = 'none';
    document.getElementById('staffModal').style.display = 'flex';
}

function closeStaffModal() {
    console.log('closeStaffModal called');
    const modal = document.getElementById('staffModal');
    if (modal) {
        modal.style.display = 'none';
        console.log('Modal closed');
    }
    currentEditingStaff = null;
}

function testModal() {
    console.log('testModal called - this should work if onclick is functioning');
    alert('Test Modal button clicked! Now calling showAddStaffModal...');
    showAddStaffModal();
}

function forceShowModal() {
    console.log('forceShowModal called - creating modal from scratch');

    // Remove any existing modal
    const existingModal = document.getElementById('staffModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal HTML from scratch
    const modalHTML = `
        <div id="staffModal" class="modal-overlay" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 999999;
        ">
            <div class="modal" style="
                background: white;
                border-radius: 15px;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
                padding: 20px;
            ">
                <h3>Add New Staff Member</h3>
                <p>Modal is working! This is a test.</p>
                <button onclick="document.getElementById('staffModal').remove()" style="
                    background: #8B4513;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">Close</button>
            </div>
        </div>
    `;

    // Add to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log('Modal created and should be visible');
}

async function handleStaffSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const submitBtn = document.getElementById('staffSubmitBtn');
    const errorDiv = document.getElementById('modalError');

    const staffData = {
        role: formData.get('role'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone')
    };

    // Show loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = currentEditingStaff ?
        '<i class="fas fa-spinner fa-spin"></i> Updating...' :
        '<i class="fas fa-spinner fa-spin"></i> Creating...';
    submitBtn.disabled = true;
    errorDiv.style.display = 'none';

    try {
        const url = currentEditingStaff ?
            `${API_BASE_URL}/staff/${currentEditingStaff.id}` :
            `${API_BASE_URL}/staff`;

        const method = currentEditingStaff ? 'PUT' : 'POST';

        const headers = {
            'Content-Type': 'application/json'
        };

        // Add auth header if token exists
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(staffData)
        });

        const data = await response.json();

        if (data.success) {
            const message = currentEditingStaff ?
                `${staffData.firstName} ${staffData.lastName} has been updated successfully.` :
                `${staffData.firstName} ${staffData.lastName} has been added successfully with ID: ${data.staff.staff_id}`;

            showStaffSuccess(message);
            closeStaffModal();
            loadStaffData(); // Reload staff data

        } else {
            throw new Error(data.message || 'Failed to save staff member');
        }
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function deleteStaff(staffId) {
    const staff = staffData.find(s => s.id === staffId);
    if (!staff) return;

    const confirmDelete = confirm(
        `Are you sure you want to delete ${staff.first_name} ${staff.last_name}? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
        const response = await fetch(`${API_BASE_URL}/staff/${staffId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            showStaffSuccess(`${staff.first_name} ${staff.last_name} has been deleted successfully.`);
            loadStaffData(); // Reload staff data
        } else {
            throw new Error(data.message || 'Failed to delete staff member');
        }
    } catch (error) {
        showStaffError(error.message);
    }
}

async function resetStaffPassword(staffId) {
    const staff = staffData.find(s => s.id === staffId);
    if (!staff) return;

    const newPassword = prompt(
        `Reset password for ${staff.first_name} ${staff.last_name}?\n\nEnter new password (minimum 6 characters):`
    );

    if (!newPassword) return;

    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/staff/${staffId}/reset-password`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: newPassword })
        });

        const data = await response.json();

        if (data.success) {
            showStaffSuccess(`Password has been reset successfully for ${staff.first_name} ${staff.last_name}.`);
            loadStaffData(); // Reload staff data to update password status
        } else {
            throw new Error(data.message || 'Failed to reset password');
        }
    } catch (error) {
        showStaffError('Failed to reset password: ' + error.message);
    }
}

// Message functions
function showStaffError(message) {
    const errorDiv = document.getElementById('staffError');
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i> ${message}
        <button class="close-btn" onclick="hideStaffError()">
            <i class="fas fa-times"></i>
        </button>
    `;
    errorDiv.style.display = 'flex';

    // Auto-hide after 5 seconds
    setTimeout(hideStaffError, 5000);
}

function showStaffSuccess(message) {
    const successDiv = document.getElementById('staffSuccess');
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i> ${message}
        <button class="close-btn" onclick="hideStaffSuccess()">
            <i class="fas fa-times"></i>
        </button>
    `;
    successDiv.style.display = 'flex';

    // Auto-hide after 5 seconds
    setTimeout(hideStaffSuccess, 5000);
}

function hideStaffError() {
    document.getElementById('staffError').style.display = 'none';
}

function hideStaffSuccess() {
    document.getElementById('staffSuccess').style.display = 'none';
}

// Setup button handlers
function setupButtonHandlers() {
    console.log('Setting up button handlers');

    // Handle the staff section Add Staff button by specific ID
    const addStaffButton = document.getElementById('addStaffButton');
    if (addStaffButton) {
        console.log('Found addStaffButton, adding click listener');
        addStaffButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Add Staff button clicked via ID addStaffButton, calling showAddStaffModal');
            showAddStaffModal();
        });
    } else {
        console.log('addStaffButton not found');
    }

    // Handle the main Add Staff button by ID
    const addStaffBtn = document.getElementById('addStaffBtn');
    if (addStaffBtn) {
        console.log('Found addStaffBtn, adding click listener');
        addStaffBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Add Staff button clicked via ID, calling showAddStaffModal');
            showAddStaffModal();
        });
    } else {
        console.log('addStaffBtn not found');
    }

    // Handle the test button
    const testBtn = document.getElementById('testModalBtn');
    if (testBtn) {
        console.log('Found testModalBtn, adding click listener');
        testBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Test button clicked, calling showAddStaffModal');
            showAddStaffModal();
        });
    }

    // Handle the button in the staff section
    const staffAddBtn = document.querySelector('#staff .btn.primary');
    if (staffAddBtn && staffAddBtn.textContent.includes('Add Staff')) {
        console.log('Found staff section Add Staff button');
        staffAddBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Staff section Add button clicked, calling showAddStaffModal');
            showAddStaffModal();
        });
    }

    // Find all buttons with onclick="showAddStaffModal()"
    const addStaffButtons = document.querySelectorAll('[onclick="showAddStaffModal()"]');
    console.log('Found add staff buttons with onclick:', addStaffButtons.length);

    addStaffButtons.forEach(button => {
        console.log('Adding click listener to onclick button:', button);
        button.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Button clicked via onclick, calling showAddStaffModal');
            showAddStaffModal();
        });
    });

    // Also try to find buttons by class or other attributes
    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach(card => {
        const titleElement = card.querySelector('.action-title');
        if (titleElement && titleElement.textContent.includes('Add New Staff')) {
            console.log('Found Add New Staff action card, adding click listener');
            card.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Action card clicked, calling showAddStaffModal');
                showAddStaffModal();
            });
        }
    });
}

// Event listeners
function initializeEventListeners() {
    // Modal overlay click to close
    const staffModal = document.getElementById('staffModal');
    if (staffModal) {
        staffModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeStaffModal();
            }
        });
    }

    // Escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeStaffModal();
        }
    });

    // Handle API errors globally
    window.addEventListener('unhandledrejection', function(e) {
        if (e.reason && e.reason.message && e.reason.message.includes('401')) {
            // Token expired, logout user
            logout();
        }
    });
}

// Utility functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Make functions available globally
window.showSection = showSection;
window.handleLogin = handleLogin;
window.logout = logout;
window.showAddStaffModal = showAddStaffModal;
window.editStaff = editStaff;
window.deleteStaff = deleteStaff;
window.resetStaffPassword = resetStaffPassword;
window.closeStaffModal = closeStaffModal;
window.handleStaffSubmit = handleStaffSubmit;
window.filterStaff = filterStaff;
window.hideStaffError = hideStaffError;
window.hideStaffSuccess = hideStaffSuccess;

// Simple form toggle functions
function toggleStaffForm() {
    console.log('toggleStaffForm called');
    const form = document.getElementById('addStaffForm');
    const buttonText = document.getElementById('toggleButtonText');

    if (form && buttonText) {
        const isVisible = form.style.display !== 'none';

        if (isVisible) {
            // Hide form
            form.style.display = 'none';
            buttonText.textContent = 'Add Staff';
            console.log('Form hidden');
        } else {
            // Show form
            form.style.display = 'block';
            buttonText.textContent = 'Cancel';
            console.log('Form shown');

            // Clear form
            const formElement = document.getElementById('staffForm');
            if (formElement) {
                formElement.reset();
            }

            // Hide any error messages
            const errorDiv = document.getElementById('formError');
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }
    } else {
        console.error('Form or button elements not found');
    }
}

async function handleStaffFormSubmit(event) {
    event.preventDefault();
    console.log('handleStaffFormSubmit called');

    const submitBtn = document.getElementById('staffSubmitBtn');
    const errorDiv = document.getElementById('formError');
    const originalText = submitBtn.innerHTML;

    // Show loading
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;

    // Hide previous errors
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }

    try {
        // Get form data
        const password = document.getElementById('staffPassword').value;
        const passwordConfirm = document.getElementById('staffPasswordConfirm').value;

        const formData = {
            role: document.getElementById('staffRole').value,
            firstName: document.getElementById('staffFirstName').value,
            lastName: document.getElementById('staffLastName').value,
            email: document.getElementById('staffEmail').value,
            phone: document.getElementById('staffPhone').value,
            password: password
        };

        console.log('Form data:', formData);

        // Validate
        if (!formData.role || !formData.firstName || !formData.lastName || !formData.email || !formData.phone || !password) {
            throw new Error('Please fill in all required fields');
        }

        // Validate password
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        // Validate password confirmation
        if (password !== passwordConfirm) {
            throw new Error('Passwords do not match');
        }

        // Submit to API
        const response = await fetch(`${API_BASE_URL}/staff`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        console.log('API response:', data);

        if (data.success) {
            // Success
            showStaffSuccess(`${formData.firstName} ${formData.lastName} has been added successfully! Staff ID: ${data.staff.staff_id}`);
            toggleStaffForm(); // Hide form
            loadStaffData(); // Reload staff list
        } else {
            throw new Error(data.message || 'Failed to save staff member');
        }

    } catch (error) {
        console.error('Error saving staff:', error);
        if (errorDiv) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
    } finally {
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}