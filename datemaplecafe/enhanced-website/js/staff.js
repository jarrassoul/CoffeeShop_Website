// Staff Management System JavaScript
const API_BASE_URL = 'http://localhost:3000/api';

let staffData = [];
let currentEditingId = null;
let userHasModifiedUsername = false;

// Initialize the staff management system
document.addEventListener('DOMContentLoaded', function() {
    console.log('Staff management system initialized');

    // Load initial data
    loadStaffData();

    // Set up event listeners
    setupEventListeners();
    setupPasswordResetListeners();
});

function setupEventListeners() {
    const toggleFormBtn = document.getElementById('toggleFormBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const addStaffForm = document.getElementById('addStaffForm');

    // Toggle form visibility
    toggleFormBtn.addEventListener('click', function() {
        const form = document.getElementById('staffForm');
        const isVisible = form.style.display !== 'none';

        if (isVisible) {
            hideForm();
        } else {
            showAddForm();
        }
    });

    // Cancel button
    cancelBtn.addEventListener('click', function() {
        hideForm();
    });

    // Form submission
    addStaffForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmit();
    });

    // Prevent auto-generation of username from first/last name
    const firstNameField = document.getElementById('firstName');
    const lastNameField = document.getElementById('lastName');
    const usernameField = document.getElementById('username');


    // Track if user manually modifies username
    usernameField.addEventListener('input', function() {
        userHasModifiedUsername = true;
        console.log('User manually modified username to:', usernameField.value);
    });

    // Debug: Log when other fields change
    firstNameField.addEventListener('input', function() {
        console.log('First name changed to:', firstNameField.value);
        if (!userHasModifiedUsername) {
            console.log('Username will not be auto-generated');
        }
    });

    lastNameField.addEventListener('input', function() {
        console.log('Last name changed to:', lastNameField.value);
        if (!userHasModifiedUsername) {
            console.log('Username will not be auto-generated');
        }
    });
}

function showAddForm() {
    currentEditingId = null;

    // Update UI
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-plus"></i> Add New Staff Member';
    document.getElementById('submitText').textContent = 'Add Staff';
    document.getElementById('toggleFormBtn').innerHTML = '<i class="fas fa-times"></i> Cancel';

    // Clear form
    document.getElementById('addStaffForm').reset();
    document.getElementById('staffId').value = '';

    // Reset username tracking
    userHasModifiedUsername = false;

    // Show password field for new staff
    document.getElementById('password').style.display = 'block';
    document.getElementById('password').required = true;
    document.getElementById('password').parentElement.style.display = 'block';

    // Ensure username field is always visible for new staff
    document.getElementById('username').style.display = 'block';
    document.getElementById('username').required = true;
    document.getElementById('username').parentElement.style.display = 'block';

    // Show form
    document.getElementById('staffForm').style.display = 'block';

    // Scroll to form
    document.getElementById('staffForm').scrollIntoView({ behavior: 'smooth' });
}

function showEditForm(staff) {
    currentEditingId = staff.id;

    // Update UI
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Staff Member';
    document.getElementById('submitText').textContent = 'Update Staff';
    document.getElementById('toggleFormBtn').innerHTML = '<i class="fas fa-times"></i> Cancel';

    // Debug: Log staff data being loaded into form
    console.log('Loading staff data into edit form:', staff);

    // Populate form
    document.getElementById('staffId').value = staff.id;
    document.getElementById('role').value = staff.role;
    document.getElementById('firstName').value = staff.first_name;
    document.getElementById('lastName').value = staff.last_name;

    // Ensure username field is properly populated
    const usernameField = document.getElementById('username');
    const currentUsername = staff.username || '';
    usernameField.value = currentUsername;
    console.log('Username field populated with:', usernameField.value);
    console.log('Username field DOM value:', usernameField.value);
    console.log('Staff username from data:', currentUsername);

    // Force the field to show the value
    setTimeout(() => {
        usernameField.value = currentUsername;
        console.log('Username field re-populated after timeout:', usernameField.value);
    }, 100);

    document.getElementById('email').value = staff.email;
    document.getElementById('phone').value = staff.phone;

    // Hide password field for editing existing staff
    document.getElementById('password').style.display = 'none';
    document.getElementById('password').required = false;
    document.getElementById('password').parentElement.style.display = 'none';

    // Ensure username field is always visible and enabled for editing
    document.getElementById('username').style.display = 'block';
    document.getElementById('username').required = true;
    document.getElementById('username').parentElement.style.display = 'block';

    // Reset username tracking for editing
    userHasModifiedUsername = false;

    // Debug: Ensure username field is fully accessible
    console.log('Username field after edit form setup:');
    console.log('  Visible:', usernameField.style.display !== 'none');
    console.log('  Enabled:', !usernameField.disabled);
    console.log('  Required:', usernameField.required);
    console.log('  Value:', usernameField.value);

    // Show form
    document.getElementById('staffForm').style.display = 'block';

    // Scroll to form
    document.getElementById('staffForm').scrollIntoView({ behavior: 'smooth' });
}

function hideForm() {
    document.getElementById('staffForm').style.display = 'none';
    document.getElementById('toggleFormBtn').innerHTML = '<i class="fas fa-plus"></i> Add New Staff';
    currentEditingId = null;
}

async function loadStaffData() {
    try {
        console.log('Loading staff data...');

        // Force fresh data by adding timestamp to prevent caching
        const response = await fetch(`${API_BASE_URL}/staff?t=${Date.now()}`);
        const data = await response.json();

        if (data.success) {
            staffData = data.staff;
            console.log('Loaded staff data:', staffData);
            displayStaffTable();
            updateStaffCount();
        } else {
            throw new Error(data.message || 'Failed to load staff data');
        }
    } catch (error) {
        console.error('Error loading staff:', error);
        showError('Failed to load staff data: ' + error.message);
        displayEmptyState('Error loading staff data');
    }
}

function displayStaffTable() {
    const container = document.getElementById('staffTableContainer');

    if (staffData.length === 0) {
        displayEmptyState('No staff members found. Click "Add New Staff" to get started.');
        return;
    }

    let tableHTML = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Staff ID</th>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Hire Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    staffData.forEach(staff => {
        try {
            const hireDate = new Date(staff.hire_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            // Ensure all required fields exist
            const staffId = staff.staff_id || 'N/A';
            const firstName = staff.first_name || '';
            const lastName = staff.last_name || '';
            const username = staff.username || '';
            const role = staff.role || '';
            const email = staff.email || '';
            const phone = staff.phone || '';
            const id = staff.id || '';

            console.log('Rendering staff row for:', { id, staffId, firstName, lastName, username });

            // Debug: Check if all button functions exist
            if (typeof editStaff !== 'function') {
                console.error('editStaff function not found!');
            }
            if (typeof showPasswordResetModal !== 'function') {
                console.error('showPasswordResetModal function not found!');
            }
            if (typeof deleteStaff !== 'function') {
                console.error('deleteStaff function not found!');
            }

            tableHTML += `
                <tr>
                    <td><span class="staff-id">${staffId}</span></td>
                    <td>${firstName} ${lastName}</td>
                    <td>${username ? `<strong style="color: #28a745;">${username}</strong>` : `<span style="color: #dc3545; font-weight: bold;">⚠️ Missing</span>`}</td>
                    <td><span class="role-badge">${role}</span></td>
                    <td>${email}</td>
                    <td>${phone}</td>
                    <td>${hireDate}</td>
                    <td>
                        <div class="actions">
                            <button onclick="editStaff(${id})" class="btn btn-secondary" title="Edit">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button onclick="showPasswordResetModal(${id})" class="btn btn-success" title="Reset Password">
                                <i class="fas fa-key"></i> Reset Password
                            </button>
                            <button onclick="deleteStaff(${id})" class="btn btn-danger" title="Delete">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        } catch (error) {
            console.error('Error rendering staff row:', error, staff);
        }
    });

    tableHTML += `
                </tbody>
            </table>
        </div>
    `;

    console.log('Final table HTML length:', tableHTML.length);
    console.log('Table HTML contains delete button:', tableHTML.includes('btn btn-danger'));
    console.log('Table HTML contains deleteStaff function:', tableHTML.includes('deleteStaff'));

    container.innerHTML = tableHTML;

    // Debug: Check what buttons are actually rendered in the DOM
    setTimeout(() => {
        const buttons = container.querySelectorAll('button');
        console.log('Total buttons rendered:', buttons.length);
        buttons.forEach((btn, index) => {
            console.log(`Button ${index + 1}:`, btn.className, btn.textContent.trim());
        });
    }, 100);
}

function displayEmptyState(message) {
    const container = document.getElementById('staffTableContainer');
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-users"></i>
            <p>${message}</p>
        </div>
    `;
}

function updateStaffCount() {
    const countElement = document.getElementById('staffCount');
    countElement.textContent = staffData.length;
}

async function handleFormSubmit() {
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;

    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;

    try {
        const formData = {
            role: document.getElementById('role').value,
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            username: document.getElementById('username').value.trim(),
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value
        };

        // Debug: Log form data
        console.log('Form data being submitted:', formData);
        console.log('Username field value during submission:', document.getElementById('username').value);
        console.log('Username in formData:', formData.username);
        console.log('Is editing existing staff:', !!currentEditingId);

        // Add password for new staff members only
        if (!currentEditingId) {
            formData.password = document.getElementById('password').value;
        }

        // Validate required fields
        let requiredFields = ['role', 'firstName', 'lastName', 'email', 'phone'];

        // Always require username for both new and existing staff
        if (!formData.username || formData.username.trim() === '') {
            throw new Error('Username is required and cannot be empty');
        }

        if (!currentEditingId) {
            requiredFields.push('password');
        }

        for (const field of requiredFields) {
            if (!formData[field] || (field === 'password' && formData[field].length < 6)) {
                if (field === 'password') {
                    throw new Error('Password must be at least 6 characters long');
                }
                throw new Error('Please fill in all required fields');
            }
        }

        // Validate username format (only if username is provided)
        if (formData.username) {
            const usernamePattern = /^[a-zA-Z0-9_]+$/;
            if (!usernamePattern.test(formData.username)) {
                throw new Error('Username can only contain letters, numbers, and underscores');
            }
        }

        const url = currentEditingId ?
            `${API_BASE_URL}/staff/${currentEditingId}` :
            `${API_BASE_URL}/staff`;
        const method = currentEditingId ? 'PUT' : 'POST';

        console.log('Sending request to:', url, 'with method:', method);
        console.log('Request body:', JSON.stringify(formData, null, 2));

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        console.log('Server response:', data);

        if (data.success) {
            const message = currentEditingId ?
                `${formData.firstName} ${formData.lastName} has been updated successfully.` :
                `${formData.firstName} ${formData.lastName} has been added successfully with ID: ${data.staff ? data.staff.staff_id : 'N/A'}`;

            showSuccess(message);
            hideForm();

            // Force reload staff data after a short delay to ensure server has processed the update
            setTimeout(() => {
                loadStaffData();
            }, 500);
        } else {
            console.error('Server returned error:', data);
            throw new Error(data.error || data.message || 'Failed to save staff member');
        }

    } catch (error) {
        console.error('Error saving staff:', error);
        showError('Error: ' + error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function editStaff(staffId) {
    const staff = staffData.find(s => s.id === staffId);
    if (staff) {
        showEditForm(staff);
    } else {
        showError('Staff member not found');
    }
}

async function deleteStaff(staffId) {
    const staff = staffData.find(s => s.id === staffId);
    if (!staff) {
        showError('Staff member not found');
        return;
    }

    const confirmMessage = `Are you sure you want to delete ${staff.first_name} ${staff.last_name}? This action cannot be undone.`;

    if (!confirm(confirmMessage)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/staff/${staffId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            showSuccess(`${staff.first_name} ${staff.last_name} has been deleted successfully.`);
            loadStaffData(); // Reload the staff data
        } else {
            throw new Error(data.message || 'Failed to delete staff member');
        }

    } catch (error) {
        console.error('Error deleting staff:', error);
        showError('Failed to delete staff member: ' + error.message);
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.classList.add('show');

    // Hide after 5 seconds
    setTimeout(() => {
        successDiv.classList.remove('show');
    }, 5000);

    // Hide any error messages
    document.getElementById('errorMessage').classList.remove('show');
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');

    // Hide after 8 seconds
    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 8000);

    // Hide any success messages
    document.getElementById('successMessage').classList.remove('show');
}

// Password Reset Functionality
function setupPasswordResetListeners() {
    const passwordResetForm = document.getElementById('passwordResetForm');

    // Form submission
    passwordResetForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handlePasswordReset();
    });

    // Password confirmation validation
    const confirmPassword = document.getElementById('confirmPassword');
    confirmPassword.addEventListener('input', function() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPasswordValue = confirmPassword.value;

        if (confirmPasswordValue && newPassword !== confirmPasswordValue) {
            confirmPassword.setCustomValidity('Passwords do not match');
        } else {
            confirmPassword.setCustomValidity('');
        }
    });
}

function showPasswordResetModal(staffId) {
    const staff = staffData.find(s => s.id === staffId);
    if (!staff) {
        showError('Staff member not found');
        return;
    }

    // Populate modal
    document.getElementById('resetStaffId').value = staffId;
    document.getElementById('resetStaffName').textContent = `${staff.first_name} ${staff.last_name} (${staff.staff_id})`;

    // Clear form
    document.getElementById('passwordResetForm').reset();

    // Show modal
    document.getElementById('passwordResetModal').classList.add('show');
}

function closePasswordResetModal() {
    document.getElementById('passwordResetModal').classList.remove('show');
    document.getElementById('passwordResetForm').reset();
}

async function handlePasswordReset() {
    const resetBtn = document.getElementById('resetPasswordBtn');
    const originalText = resetBtn.innerHTML;

    // Show loading state
    resetBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';
    resetBtn.disabled = true;

    try {
        const staffId = document.getElementById('resetStaffId').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate passwords
        if (newPassword.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        if (newPassword !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        const response = await fetch(`${API_BASE_URL}/staff/${staffId}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newPassword })
        });

        const data = await response.json();

        if (data.success) {
            showSuccess(data.message);
            closePasswordResetModal();
        } else {
            throw new Error(data.error || 'Failed to reset password');
        }

    } catch (error) {
        console.error('Error resetting password:', error);
        showError('Error: ' + error.message);
    } finally {
        resetBtn.innerHTML = originalText;
        resetBtn.disabled = false;
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('passwordResetModal');
    if (e.target === modal) {
        closePasswordResetModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('passwordResetModal');
        if (modal.classList.contains('show')) {
            closePasswordResetModal();
        }
    }
});