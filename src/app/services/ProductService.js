const productFactory = require('../factories/ProductFactory');
const Product = require('../models/Product');

class ProductService {
    async createProduct(productData) {
        try {
            // Tạo sản phẩm sử dụng factory
            const product = productFactory.createProduct(productData);
            
            // Lấy thông tin chi tiết sản phẩm
            const productDetails = product.getProductDetails();

            // Lưu vào database
            const newProduct = new Product(productDetails);
            await newProduct.save();

            return newProduct;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new ProductService(); 