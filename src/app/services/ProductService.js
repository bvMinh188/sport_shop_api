const Product = require('../models/Product');

class ProductService {
    async createProduct(productData) {
        try {
            // Create new product directly
            const newProduct = new Product(productData);
            await newProduct.save();
            return newProduct;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new ProductService(); 