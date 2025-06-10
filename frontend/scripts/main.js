import ApiService from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize variables
    let currentCategory = 'all';
    let currentSort = '';

    // Get DOM elements
    const productsContainer = document.getElementById('productsContainer');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sortButton = document.querySelector('.sort-btn');

    // Load initial products
    loadProducts();

    // Event listeners
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentCategory = button.dataset.category;
            loadProducts();
        });
    });

    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            searchProducts(query);
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                searchProducts(query);
            }
        }
    });

    sortButton.addEventListener('click', () => {
        currentSort = currentSort === 'asc' ? 'desc' : 'asc';
        sortButton.textContent = `Lọc: ${currentSort === 'asc' ? 'Giá thấp đến cao' : 'Giá cao đến thấp'}`;
        loadProducts();
    });

    // Functions
    async function loadProducts() {
        try {
            showLoading();
            const products = await ApiService.getProducts(currentCategory, currentSort);
            displayProducts(products);
        } catch (error) {
            console.error('Error:', error);
            showError('Không thể tải sản phẩm. Vui lòng thử lại sau.');
        }
    }

    async function searchProducts(query) {
        try {
            showLoading();
            const products = await ApiService.searchProducts(query);
            displayProducts(products);
        } catch (error) {
            console.error('Error:', error);
            showError('Không thể tìm kiếm sản phẩm. Vui lòng thử lại sau.');
        }
    }

    function displayProducts(products) {
        if (!products || !products.length) {
            productsContainer.innerHTML = '<p class="no-products">Không tìm thấy sản phẩm nào.</p>';
            return;
        }

        productsContainer.innerHTML = products.map(product => `
            <div class="product-card">
                ${product.bestSeller ? '<span class="bestseller-badge">Bán chạy nhất</span>' : ''}
                <img src="${product.image || 'public/images/placeholder.png'}" alt="${product.name}" class="product-image" onerror="this.src='public/images/placeholder.png'">
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-price">${formatPrice(product.price)} VND</p>
                    <p class="product-sales">Đã bán: ${product.soldCount || 0}</p>
                </div>
            </div>
        `).join('');
    }

    function formatPrice(price) {
        return new Intl.NumberFormat('vi-VN').format(price);
    }

    function showError(message) {
        productsContainer.innerHTML = `<p class="error">${message}</p>`;
    }

    function showLoading() {
        productsContainer.innerHTML = '<div class="loading">Đang tải...</div>';
    }
}); 