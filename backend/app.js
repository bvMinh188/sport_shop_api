const path = require("path");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require('cookie-parser');
const db = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database
db.connect();

// Import API routes
const productApi = require('./api/productApi');
const categoryApi = require('./api/categoryApi');
const cartApi = require('./api/cartApi');
const orderApi = require('./api/orderApi');
const userApi = require('./api/userApi');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); 
app.use(morgan("combined"));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// API Routes
app.use('/api', productApi);
app.use('/api', categoryApi);
app.use('/api', cartApi);
app.use('/api', orderApi);
app.use('/api', userApi);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

app.listen(PORT, () => console.log(`API backend listening at http://localhost:${PORT}`));
