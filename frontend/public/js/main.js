document.addEventListener('DOMContentLoaded', () => {
    // Load partials
    loadPartials();
    
    // Initialize products
    initializeProducts();
    
    // Setup event listeners
    setupEventListeners();
});

// API endpoint
const API_URL = 'http://localhost:3000/api';

// State management
let state = {
    products: [],
    categories: [],
    currentPage: 1,
    totalPages: 1,
    selectedCategory: null,
    sort: ''
};

// DOM Elements
const productsContainer = document.getElementById('productsContainer');
const categoriesContainer = document.querySelector('.categories');
const sortButton = document.querySelector('.sort-btn');
const sortDropdown = document.querySelector('.sort-dropdown');
const searchInput = document.getElementById('searchInput');

async function loadPartials() {
    // Load header
    const headerResponse = await fetch('/views/partials/header.html');
    const headerHtml = await headerResponse.text();
    document.getElementById('header').innerHTML = headerHtml;

    // Load footer
    const footerResponse = await fetch('/views/partials/footer.html');
    const footerHtml = await footerResponse.text();
    document.getElementById('footer').innerHTML = footerHtml;

    // Setup auth button after header is loaded
    setupAuthButton();
}

async function initializeProducts() {
    const productsContainer = document.getElementById('productsContainer');
    productsContainer.innerHTML = '<div class="loading">Đang tải sản phẩm...</div>';

    try {
        // Load categories
        const categories = ['Giày FUTSAL', 'Giày bóng rổ', 'Giày chạy bộ', 'Giày đá bóng', 'Giày cầu lông'];
        loadCategories(categories);

        // Load products
        await fetchProducts();
    } catch (error) {
        console.error('Error initializing products:', error);
        productsContainer.innerHTML = '<div class="error">Không thể tải sản phẩm</div>';
    }
}

function loadCategories(categories) {
    const categoryFilters = document.getElementById('categoryFilters');
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'filter-btn';
        button.setAttribute('data-category', category);
        button.textContent = category;
        categoryFilters.appendChild(button);
    });
}

function setupEventListeners() {
    // Category filter
    document.getElementById('categoryFilters').addEventListener('click', async (e) => {
        if (e.target.classList.contains('filter-btn')) {
            const category = e.target.getAttribute('data-category');
            
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(btn => 
                btn.classList.remove('active')
            );
            e.target.classList.add('active');

            // Update state and display
            state.selectedCategory = category === 'Tất Cả' ? null : category;
            state.currentPage = 1;
            await fetchProducts();
        }
    });

    // Sort dropdown
    const sortButton = document.getElementById('sortButton');
    const sortMenu = document.getElementById('sortMenu');
    
    sortButton.addEventListener('click', () => {
        sortMenu.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    window.addEventListener('click', (e) => {
        if (!e.target.matches('#sortButton')) {
            sortMenu.classList.remove('show');
        }
    });

    // Sort items
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            state.sort = e.target.getAttribute('data-sort');
            await fetchProducts();
            sortMenu.classList.remove('show');
        });
    });

    // Pagination
    document.getElementById('pagination').addEventListener('click', async (e) => {
        if (e.target.classList.contains('page-btn')) {
            const page = parseInt(e.target.getAttribute('data-page'));
            if (page !== state.currentPage) {
                state.currentPage = page;
                await fetchProducts();
                window.scrollTo(0, 0);
            }
        }
    });

    // Listen for search events from header
    document.addEventListener('productSearch', (e) => {
        state.products = e.detail.products;
        state.currentPage = 1;
        updateProductsDisplay();
    });
}

// Format price to VND
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price) + ' VND';
}

// Render categories
function renderCategories() {
    if (!state.categories.length) return;
    
    categoriesContainer.innerHTML = `
        <button class="category-btn ${!state.selectedCategory ? 'active' : ''}">Tất Cả</button>
        ${state.categories.map(category => `
            <button class="category-btn ${state.selectedCategory === category ? 'active' : ''}">${category}</button>
        `).join('')}
    `;
}

// Render products
function renderProducts() {
    if (!state.products.length) {
        productsContainer.innerHTML = '<div class="error">Không thể tải sản phẩm</div>';
        return;
    }

    productsContainer.innerHTML = state.products.map(product => `
        <div class="product-card">
            ${product.sold >= 10 ? '<span class="best-seller">Bán chạy nhất</span>' : ''}
            <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">${formatPrice(product.price)}</div>
                <div class="product-sold">Đã bán: ${product.sold || 0}</div>
            </div>
        </div>
    `).join('');
}

// Fetch products from API
async function fetchProducts() {
    try {
        const queryParams = new URLSearchParams({
            page: state.currentPage,
            ...(state.selectedCategory && { category: state.selectedCategory }),
            ...(state.sort && { _sort: state.sort })
        });

        const response = await fetch(`${API_URL}?${queryParams}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        
        state.products = data.products || [];
        state.categories = data.categories || [];
        state.currentPage = data.currentPage || 1;
        state.totalPages = data.totalPages || 1;
        
        renderProducts();
        renderCategories();
        updatePagination();
    } catch (error) {
        console.error('Error fetching products:', error);
        productsContainer.innerHTML = '<div class="error">Không thể tải sản phẩm</div>';
    }
}

// Update pagination
function updatePagination() {
    const pagination = document.querySelector('.pagination');
    let paginationHTML = '';
    
    for (let i = 1; i <= state.totalPages; i++) {
        paginationHTML += `
            <button class="page-btn ${i === state.currentPage ? 'active' : ''}">${i}</button>
        `;
    }
    
    if (state.currentPage < state.totalPages) {
        paginationHTML += '<button class="page-btn next">›</button>';
    }
    
    pagination.innerHTML = paginationHTML;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initial load
    fetchProducts();

    // Category buttons
    categoriesContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            const category = e.target.textContent;
            state.selectedCategory = category === 'Tất Cả' ? null : category;
            state.currentPage = 1;
            
            // Update active state
            document.querySelectorAll('.category-btn').forEach(btn => 
                btn.classList.remove('active')
            );
            e.target.classList.add('active');
            
            fetchProducts();
        }
    });

    // Sort button and dropdown
    sortButton.addEventListener('click', () => {
        sortDropdown.style.display = sortDropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Sort options
    document.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', () => {
            const sortValue = option.dataset.sort;
            state.sort = sortValue;
            sortButton.textContent = option.textContent;
            sortDropdown.style.display = 'none';
            fetchProducts();
        });
    });

    // Close sort dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.sort-container')) {
            sortDropdown.style.display = 'none';
        }
    });

    // Pagination
    document.querySelector('.pagination').addEventListener('click', (e) => {
        if (e.target.classList.contains('page-btn')) {
            if (e.target.classList.contains('next')) {
                state.currentPage++;
            } else {
                state.currentPage = parseInt(e.target.textContent);
            }
            fetchProducts();
            window.scrollTo(0, 0);
        }
    });

    // Search input
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            // TODO: Implement search functionality when API is ready
            console.log('Searching for:', e.target.value);
        }, 300);
    });
});

function setupAuthButton() {
    const loginBtn = document.getElementById('loginBtn');
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
        loginBtn.innerHTML = `
            <i class="fas fa-user"></i>
            ${user.username}
        `;
        loginBtn.addEventListener('click', handleLogout);
    } else {
        loginBtn.innerHTML = `
            <i class="fas fa-user"></i>
            Đăng nhập
        `;
        loginBtn.addEventListener('click', showLoginModal);
    }
}

async function handleLogout() {
    const response = await auth.logout();
    if (response.success) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
    }
}

function showLoginModal() {
    // Implementation of login modal will go here
    console.log('Show login modal');
}

function updateProductsDisplay() {
    const productsContainer = document.getElementById('productsContainer');
    
    // Calculate pagination
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const paginatedProducts = state.products.slice(startIndex, endIndex);
    state.totalPages = Math.ceil(state.products.length / state.itemsPerPage);

    // Display products
    productsContainer.innerHTML = paginatedProducts.map(product => `
        <div class="product-card">
            ${product.sold >= 10 ? '<div class="product-tags"><span class="status-tag">Bán chạy nhất</span></div>' : ''}
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" class="product-image">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">
                    <span class="current-price">${formatPrice(product.price)}</span>
                    ${product.originalPrice ? `
                        <span class="original-price">${formatPrice(product.originalPrice)}</span>
                    ` : ''}
                </div>
                <div class="sold-count">Đã bán: ${product.sold}</div>
            </div>
        </div>
    `).join('');

    // Update pagination
    updatePagination();
} 