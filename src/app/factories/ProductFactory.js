const Product = require('../models/Product');

class ProductFactory {
    createProduct(productData) {
        const { name, price, description, image, sizes, category } = productData;
        
        let additionalProps = {};
        
        // Thêm thuộc tính đặc biệt tùy theo loại sản phẩm
        switch (category.toLowerCase()) {
            case 'sport':
                additionalProps.sportType = productData.sportType || 'General';
                break;
            case 'casual':
                additionalProps.style = productData.style || 'Classic';
                break;
            default:
                // Không có thuộc tính đặc biệt cho category khác
                break;
        }

        // Trả về instance của model Mongoose
        return new Product({
            name,
            price,
            description,
            image,
            sizes,
            category,
            ...additionalProps
        });
    }

    static getInstance() {
        if (!ProductFactory.instance) {
            ProductFactory.instance = new ProductFactory();
        }
        return ProductFactory.instance;
    }
}

module.exports = ProductFactory.getInstance(); 