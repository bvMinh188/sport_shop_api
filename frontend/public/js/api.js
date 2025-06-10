const API_URL = 'http://localhost:3000/api';

// Authentication API calls
const auth = {
    login: async (email, password) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            return await response.json();
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error', data: null };
        }
    },

    signup: async (userData) => {
        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            return await response.json();
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, message: 'Network error', data: null };
        }
    },

    logout: async () => {
        try {
            const response = await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, message: 'Network error', data: null };
        }
    }
};

// Products API calls
const products = {
    getAll: async () => {
        try {
            const response = await fetch(`${API_URL}/products`);
            return await response.json();
        } catch (error) {
            console.error('Get products error:', error);
            return { success: false, message: 'Network error', data: null };
        }
    },

    getByCategory: async (category) => {
        try {
            const response = await fetch(`${API_URL}/products/category/${category}`);
            return await response.json();
        } catch (error) {
            console.error('Get products by category error:', error);
            return { success: false, message: 'Network error', data: null };
        }
    },

    search: async (query) => {
        try {
            const response = await fetch(`${API_URL}/products/search?q=${encodeURIComponent(query)}`);
            return await response.json();
        } catch (error) {
            console.error('Search products error:', error);
            return { success: false, message: 'Network error', data: null };
        }
    }
}; 