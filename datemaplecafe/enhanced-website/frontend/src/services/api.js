import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API calls
export const authAPI = {
    login: async (username, password) => {
        const response = await api.post('/auth/login', { username, password });
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    },
};

// Staff Auth API calls
export const staffAuthAPI = {
    login: async (staffId, password) => {
        const response = await api.post('/staff-auth/login', { staffId, password });
        return response.data;
    },

    getCurrentStaff: async () => {
        const response = await api.get('/staff-auth/me');
        return response.data;
    },
};

// Staff API calls
export const staffAPI = {
    getAll: async () => {
        const response = await api.get('/staff');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/staff/${id}`);
        return response.data;
    },

    create: async (staffData) => {
        const response = await api.post('/staff', staffData);
        return response.data;
    },

    update: async (id, staffData) => {
        const response = await api.put(`/staff/${id}`, staffData);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/staff/${id}`);
        return response.data;
    },

    resetPassword: async (id, newPassword) => {
        const response = await api.post(`/staff/${id}/reset-password`, { newPassword });
        return response.data;
    },
};

// Menu API calls
export const menuAPI = {
    getCategories: async () => {
        const response = await api.get('/menu/categories');
        return response.data;
    },

    getItems: async () => {
        const response = await api.get('/menu/items');
        return response.data;
    },

    createCategory: async (categoryData) => {
        const response = await api.post('/menu/categories', categoryData);
        return response.data;
    },

    createItem: async (itemData) => {
        const response = await api.post('/menu/items', itemData);
        return response.data;
    },

    updateItem: async (id, itemData) => {
        const response = await api.put(`/menu/items/${id}`, itemData);
        return response.data;
    },

    deleteItem: async (id) => {
        const response = await api.delete(`/menu/items/${id}`);
        return response.data;
    },
};

// Health check
export const healthAPI = {
    check: async () => {
        const response = await api.get('/health');
        return response.data;
    },
};

export default api;