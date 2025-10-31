import React, { useState, useEffect } from 'react';

const StaffModal = ({ isOpen, onClose, onSubmit, staff = null, isLoading = false }) => {
    const [formData, setFormData] = useState({
        role: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: ''
    });

    const [errors, setErrors] = useState({});

    const roles = ['Manager', 'Barista', 'Cashier', 'Baker', 'Cleaner'];

    useEffect(() => {
        if (staff) {
            setFormData({
                role: staff.role || '',
                firstName: staff.first_name || '',
                lastName: staff.last_name || '',
                email: staff.email || '',
                phone: staff.phone || '',
                password: ''
            });
        } else {
            setFormData({
                role: '',
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                password: ''
            });
        }
        setErrors({});
    }, [staff, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.role.trim()) {
            newErrors.role = 'Role is required';
        }

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        } else if (formData.firstName.trim().length < 2) {
            newErrors.firstName = 'First name must be at least 2 characters';
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        } else if (formData.lastName.trim().length < 2) {
            newErrors.lastName = 'Last name must be at least 2 characters';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        // Password validation - only required for new staff
        if (!staff && !formData.password.trim()) {
            newErrors.password = 'Password is required for new staff members';
        } else if (formData.password.trim() && formData.password.trim().length < 6) {
            newErrors.password = 'Password must be at least 6 characters long';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            onSubmit(formData);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h3 className="modal-title">
                        {staff ? 'Edit Staff Member' : 'Add New Staff Member'}
                    </h3>
                    <button className="modal-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="role">Role *</label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className={errors.role ? 'error' : ''}
                                disabled={isLoading}
                            >
                                <option value="">Select a role</option>
                                {roles.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                            {errors.role && <div className="error-message">{errors.role}</div>}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="firstName">First Name *</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className={errors.firstName ? 'error' : ''}
                                    disabled={isLoading}
                                    placeholder="Enter first name"
                                />
                                {errors.firstName && <div className="error-message">{errors.firstName}</div>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName">Last Name *</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className={errors.lastName ? 'error' : ''}
                                    disabled={isLoading}
                                    placeholder="Enter last name"
                                />
                                {errors.lastName && <div className="error-message">{errors.lastName}</div>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address *</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={errors.email ? 'error' : ''}
                                disabled={isLoading}
                                placeholder="Enter email address"
                            />
                            {errors.email && <div className="error-message">{errors.email}</div>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">Phone Number *</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className={errors.phone ? 'error' : ''}
                                disabled={isLoading}
                                placeholder="Enter phone number"
                            />
                            {errors.phone && <div className="error-message">{errors.phone}</div>}
                        </div>

                        {/* PASSWORD FIELD - ADDED FOR STAFF AUTHENTICATION */}
                        <div className="form-group" style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '2px solid #007bff' }}>
                            <label htmlFor="password" style={{ fontWeight: 'bold', color: '#007bff' }}>
                                🔐 {staff ? 'New Password (leave blank to keep current)' : 'Password *'}
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={errors.password ? 'error' : ''}
                                disabled={isLoading}
                                placeholder={staff ? 'Enter new password to change' : 'Enter password'}
                                style={{
                                    border: '2px solid #007bff',
                                    borderRadius: '4px',
                                    padding: '8px 12px',
                                    fontSize: '14px'
                                }}
                            />
                            {errors.password && <div className="error-message">{errors.password}</div>}
                            {staff && (
                                <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                                    💡 Leave empty to keep the current password unchanged
                                </div>
                            )}
                            {!staff && (
                                <div style={{ fontSize: '0.9rem', color: '#007bff', marginTop: '0.5rem' }}>
                                    🔒 Password must be at least 6 characters long
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button
                                type="submit"
                                className="btn primary"
                                disabled={isLoading}
                                style={{ flex: 1 }}
                            >
                                {isLoading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i>
                                        {staff ? ' Updating...' : ' Creating...'}
                                    </>
                                ) : (
                                    <>
                                        <i className={`fas ${staff ? 'fa-save' : 'fa-plus'}`}></i>
                                        {staff ? ' Update Staff' : ' Create Staff'}
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                className="btn secondary"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StaffModal;