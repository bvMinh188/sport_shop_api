class Order {
    constructor(userId, products, price, address, status) {
        this.userId = userId;
        this.products = products;
        this.price = price;
        this.address = address;
        this.status = status;
    }

    getOrderDetails() {
        return {
            userId: this.userId,
            products: this.products,
            price: this.price,
            address: this.address,
            status: this.status
        };
    }
}

module.exports = Order; 