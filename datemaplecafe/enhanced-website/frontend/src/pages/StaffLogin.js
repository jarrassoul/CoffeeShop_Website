import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffAuthAPI } from '../services/api';
import './Login.css';

const StaffLogin = () => {
    const [formData, setFormData] = useState({
        staffId: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(''); // Clear error when user types
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await staffAuthAPI.login(formData.staffId, formData.password);

            if (response.success) {
                // Store staff token and info
                localStorage.setItem('staffToken', response.token);
                localStorage.setItem('staffUser', JSON.stringify(response.staff));

                // Redirect based on role
                const role = response.staff.role;
                if (role === 'Manager') {
                    navigate('/staff/dashboard');
                } else if (role === 'Cashier') {
                    navigate('/staff/orders');
                } else {
                    navigate('/staff/dashboard'); // Default for Barista, Baker, etc.
                }
            }
        } catch (error) {
            console.error('Staff login error:', error);
            setError(error.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h2>🍁 Date Maple Cafe</h2>
                    <h3>Staff Login</h3>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="staffId">Staff ID:</label>
                        <input
                            type="text"
                            id="staffId"
                            name="staffId"
                            value={formData.staffId}
                            onChange={handleChange}
                            required
                            placeholder="Enter your Staff ID (e.g., MA001)"
                            style={{
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                color: '#2c5aa0'
                            }}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Enter your password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                        style={{
                            backgroundColor: '#8B4513',
                            borderColor: '#8B4513'
                        }}
                    >
                        {loading ? 'Signing In...' : 'Staff Sign In'}
                    </button>
                </form>

                <div className="login-footer">
                    <p style={{ color: '#666', fontSize: '0.9em', textAlign: 'center', marginTop: '20px' }}>
                        Need help? Contact your manager
                    </p>
                    <p style={{ color: '#999', fontSize: '0.8em', textAlign: 'center', marginTop: '10px' }}>
                        <a href="/login" style={{ color: '#8B4513', textDecoration: 'none' }}>
                            Admin Login →
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StaffLogin;