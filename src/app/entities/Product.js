class Product {
    constructor(name, price, description, image, sizes, category, additionalProps = {}) {
        this.name = name;
        this.price = price;
        this.description = description;
        this.image = image;
        this.sizes = sizes;
        this.category = category;
        this.slug = name.toLowerCase().replace(/ /g, '-');
        
        // Thêm các thuộc tính bổ sung tùy theo loại sản phẩm
        Object.assign(this, additionalProps);
    }

    getProductDetails() {
        const details = {
            name: this.name,
            category: this.category,
            price: this.price,
            description: this.description,
            image: this.image,
            sizes: this.sizes,
            slug: this.slug
        };

        // Thêm thuộc tính đặc biệt nếu có
        if (this.sportType) details.sportType = this.sportType;
        if (this.style) details.style = this.style;

        return details;
    }
}

module.exports = Product; 