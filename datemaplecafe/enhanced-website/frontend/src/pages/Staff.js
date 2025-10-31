import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { staffAPI } from '../services/api';
import StaffModal from '../components/StaffModal';

const Staff = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [staff, setStaff] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [isModalLoading, setIsModalLoading] = useState(false);

    // Filters
    const [roleFilter, setRoleFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const roles = ['Manager', 'Barista', 'Cashier', 'Baker', 'Cleaner'];

    useEffect(() => {
        fetchStaff();

        // Check if we should open the add modal based on URL params
        if (searchParams.get('action') === 'add') {
            setIsModalOpen(true);
            setSelectedStaff(null);
        }
    }, [searchParams]);

    const fetchStaff = async () => {
        try {
            setIsLoading(true);
            setError('');
            const response = await staffAPI.getAll();

            if (response.success) {
                setStaff(response.staff);
            } else {
                setError(response.message || 'Failed to fetch staff');
            }
        } catch (error) {
            console.error('Error fetching staff:', error);
            setError(error.message || 'Failed to fetch staff members');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddStaff = () => {
        setSelectedStaff(null);
        setIsModalOpen(true);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('action');
            return newParams;
        });
    };

    const handleEditStaff = (staffMember) => {
        setSelectedStaff(staffMember);
        setIsModalOpen(true);
    };

    const handleDeleteStaff = async (staffMember) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete ${staffMember.first_name} ${staffMember.last_name}? This action cannot be undone.`
        );

        if (!confirmDelete) return;

        try {
            const response = await staffAPI.delete(staffMember.id);

            if (response.success) {
                setSuccess(`${staffMember.first_name} ${staffMember.last_name} has been deleted successfully.`);
                fetchStaff(); // Refresh the list

                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.message || 'Failed to delete staff member');
            }
        } catch (error) {
            console.error('Error deleting staff:', error);
            setError(error.message || 'Failed to delete staff member');
        }
    };

    const handleResetPassword = async (staffMember) => {
        const newPassword = window.prompt(
            `Enter a new password for ${staffMember.first_name} ${staffMember.last_name}:\n(minimum 6 characters)`
        );

        if (!newPassword) return;

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        try {
            const response = await staffAPI.resetPassword(staffMember.id, newPassword);

            if (response.success) {
                setSuccess(response.message);
                // Clear success message after 5 seconds
                setTimeout(() => setSuccess(''), 5000);
            } else {
                setError(response.message || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            setError(error.message || 'Failed to reset password');
        }
    };

    const handleModalSubmit = async (formData) => {
        try {
            setIsModalLoading(true);
            setError('');

            let response;
            if (selectedStaff) {
                // Update existing staff
                response = await staffAPI.update(selectedStaff.id, formData);
            } else {
                // Create new staff
                response = await staffAPI.create(formData);
            }

            if (response.success) {
                setSuccess(
                    selectedStaff
                        ? `${formData.firstName} ${formData.lastName} has been updated successfully.`
                        : `${formData.firstName} ${formData.lastName} has been added successfully with ID: ${response.staff.staff_id}`
                );
                setIsModalOpen(false);
                fetchStaff(); // Refresh the list

                // Clear success message after 5 seconds
                setTimeout(() => setSuccess(''), 5000);
            } else {
                setError(response.message || 'Failed to save staff member');
            }
        } catch (error) {
            console.error('Error saving staff:', error);
            setError(error.message || 'Failed to save staff member');
        } finally {
            setIsModalLoading(false);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedStaff(null);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('action');
            return newParams;
        });
    };

    // Filter staff based on role and search query
    const filteredStaff = staff.filter(member => {
        const matchesRole = !roleFilter || member.role === roleFilter;
        const matchesSearch = !searchQuery ||
            member.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.staff_id.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesRole && matchesSearch;
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const clearMessages = () => {
        setError('');
        setSuccess('');
    };

    if (isLoading) {
        return (
            <div className="main-content">
                <div className="container">
                    <div className="loading">
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Loading staff members...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="main-content">
            <div className="container">
                <div className="fade-in">
                    <h1 className="page-title">Staff Management</h1>

                    {/* Success/Error Messages */}
                    {error && (
                        <div className="card" style={{
                            backgroundColor: '#fee',
                            border: '1px solid #fcc',
                            color: '#c33',
                            marginBottom: '2rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span><i className="fas fa-exclamation-triangle"></i> {error}</span>
                                <button onClick={clearMessages} style={{ background: 'none', border: 'none', color: '#c33', cursor: 'pointer' }}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="card" style={{
                            backgroundColor: '#efe',
                            border: '1px solid #cfc',
                            color: '#363',
                            marginBottom: '2rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span><i className="fas fa-check-circle"></i> {success}</span>
                                <button onClick={clearMessages} style={{ background: 'none', border: 'none', color: '#363', cursor: 'pointer' }}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Staff Members ({filteredStaff.length})</h2>
                            <button onClick={handleAddStaff} className="btn primary">
                                <i className="fas fa-user-plus"></i> Add Staff
                            </button>
                        </div>

                        {/* Filters */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '1rem',
                            marginBottom: '2rem'
                        }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label htmlFor="roleFilter">Filter by Role</label>
                                <select
                                    id="roleFilter"
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                >
                                    <option value="">All Roles</option>
                                    {roles.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label htmlFor="searchQuery">Search Staff</label>
                                <input
                                    type="text"
                                    id="searchQuery"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name, email, or ID..."
                                />
                            </div>
                        </div>

                        {/* Staff Table */}
                        {filteredStaff.length === 0 ? (
                            <div className="empty-state">
                                <i className="fas fa-users"></i>
                                <p>{staff.length === 0 ? 'No staff members found. Click "Add Staff" to get started.' : 'No staff members match your current filters.'}</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Staff ID</th>
                                            <th>Name</th>
                                            <th>Role</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Hire Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStaff.map(member => (
                                            <tr key={member.id}>
                                                <td>
                                                    <strong style={{ color: '#8B4513' }}>{member.staff_id}</strong>
                                                </td>
                                                <td>{member.first_name} {member.last_name}</td>
                                                <td>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '0.25rem 0.75rem',
                                                        backgroundColor: '#f0f0f0',
                                                        borderRadius: '15px',
                                                        fontSize: '0.9rem'
                                                    }}>
                                                        {member.role}
                                                    </span>
                                                </td>
                                                <td>{member.email}</td>
                                                <td>{member.phone}</td>
                                                <td>{formatDate(member.hire_date)}</td>
                                                <td>
                                                    <div className="table-actions">
                                                        <button
                                                            onClick={() => handleEditStaff(member)}
                                                            className="btn secondary"
                                                            title="Edit Staff Member"
                                                        >
                                                            <i className="fas fa-edit"></i> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleResetPassword(member)}
                                                            className="btn"
                                                            title="Reset Password"
                                                            style={{ backgroundColor: '#ffa500', color: 'white' }}
                                                        >
                                                            <i className="fas fa-key"></i> Reset Password
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteStaff(member)}
                                                            className="btn danger"
                                                            title="Delete Staff Member"
                                                        >
                                                            <i className="fas fa-trash"></i> Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Staff Modal */}
                <StaffModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    onSubmit={handleModalSubmit}
                    staff={selectedStaff}
                    isLoading={isModalLoading}
                />
            </div>
        </div>
    );
};

export default Staff;