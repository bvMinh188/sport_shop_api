// Define API URL
const API_URL = 'http://localhost:3000/api';

// Export the ApiService class
export default class ApiService {
    static async getProducts(category = '', sort = '') {
        try {
            let url = `${API_URL}/products`;
            const params = new URLSearchParams();
            
            if (category && category !== 'all') {
                params.append('category', category);
            }
            if (sort) {
                params.append('sort', sort);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data.products || [];
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    }

    static async searchProducts(query) {
        try {
            const response = await fetch(`${API_URL}/products/search?keyword=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data.products || [];
        } catch (error) {
            console.error('Error searching products:', error);
            throw error;
        }
    }

    static async getCategories() {
        try {
            const response = await fetch(`${API_URL}/categories`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data.categories || [];
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    }
} 