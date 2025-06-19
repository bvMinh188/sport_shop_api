const mongoose = require('mongoose');

async function connect() {
    try {
        await mongoose.connect('mongodb+srv://sangcua:SangCua1905%40@cluster0.gdfduzn.mongodb.net/shop_shoe');
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1); // Exit if database connection fails
    }
}

module.exports = { connect }; 