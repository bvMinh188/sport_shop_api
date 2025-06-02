const Order = require('../models/Order');

class OrderFactory {
    async createOrder(orderData) {
        try {
            const { userId, products, price, address } = orderData;

            // Validate required fields
            if (!userId || !products || !price || !address) {
                throw new Error('Missing required fields');
            }

            // Validate products array
            if (!Array.isArray(products) || products.length === 0) {
                throw new Error('Products must be a non-empty array');
            }

            // Validate each product
            products.forEach(product => {
                if (!product.name || !product.price || !product.quantity || !product.size) {
                    throw new Error('Invalid product data');
                }
            });

            // Tạo đơn hàng mới với trạng thái mặc định là 'chờ xác nhận'
            const order = new Order({
                userId,
                products: products.map(p => ({
                    name: p.name,
                    image: p.image,
                    price: p.price.toString(),
                    quantity: p.quantity,
                    size: p.size
                })),
                price: price.toString(),
                address,
                status: 'chờ xác nhận'
            });

            await order.save();
            return order;
        } catch (error) {
            console.error('Error in OrderFactory.createOrder:', error);
            throw error;
        }
    }

    // Tạo đơn hàng với trạng thái cụ thể (cho admin)
    async createOrderWithStatus(orderData, status) {
        try {
            const { userId, products, price, address } = orderData;
            
            // Validate required fields
            if (!userId || !products || !price || !address) {
                throw new Error('Missing required fields');
            }

            // Kiểm tra status hợp lệ
            const validStatuses = ['chờ xác nhận', 'đang giao hàng', 'đã giao hàng', 'đã hủy'];
            if (!validStatuses.includes(status)) {
                throw new Error(`Invalid status: ${status}`);
            }

            const order = new Order({
                userId,
                products: products.map(p => ({
                    name: p.name,
                    image: p.image,
                    price: p.price.toString(),
                    quantity: p.quantity,
                    size: p.size
                })),
                price: price.toString(),
                address,
                status
            });

            await order.save();
            return order;
        } catch (error) {
            console.error('Error in OrderFactory.createOrderWithStatus:', error);
            throw error;
        }
    }
}

module.exports = new OrderFactory(); 