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
app.use(cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5000",  // domain FE
    credentials: true  // Cho phép gửi cookie
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("combined"));

// API Routes
app.use('/api',  userApi);
app.use('/api', productApi);
app.use('/api', categoryApi);
app.use('/api', cartApi);
app.use('/api', orderApi);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
