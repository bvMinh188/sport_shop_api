const bcrypt = require('bcrypt');

class User {
    constructor(username, email, password, phone, role) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.role = role;
        this.addresses = [];
    }

    addAddress(name, address, isDefault = false) {
        this.addresses.push({ name, address, isDefault });
    }

    async getUserDetails() {
        // Hash password trước khi lưu
        const hashedPassword = await bcrypt.hash(this.password, 10);
        
        return {
            username: this.username,
            email: this.email,
            password: hashedPassword,
            phone: this.phone,
            role: this.role,
            addresses: this.addresses
        };
    }

    can(action) {
        const permissions = {
            admin: ['manage_products', 'manage_orders', 'manage_users', 'view_statistics'],
            user: ['place_order', 'view_orders', 'manage_profile']
        };

        return permissions[this.role]?.includes(action) || false;
    }
}

module.exports = User; 