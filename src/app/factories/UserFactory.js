const bcrypt = require('bcrypt');
const UserModel = require('../models/User');

class UserEntity {
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

class UserFactory {
    async createUser(userData) {
        try {
            const { username, email, password, phone } = userData;
            
            // Validate required fields
            if (!username || !email || !password || !phone) {
                throw new Error('Missing required fields');
            }

            // Tạo user entity
            const userEntity = new UserEntity(username, email, password, phone, 'user');
            
            // Thêm địa chỉ nếu có
            if (userData.address) {
                userEntity.addAddress('Default', userData.address, true);
            }

            // Lấy thông tin đã được xử lý (bao gồm password đã hash)
            const userDetails = await userEntity.getUserDetails();

            // Tạo và lưu user vào database
            const user = new UserModel(userDetails);
            await user.save();

            return user;
        } catch (error) {
            console.error('Error in UserFactory.createUser:', error);
            throw error;
        }
    }

    async createAdmin(userData) {
        try {
            const { username, email, password, phone } = userData;
            
            // Validate required fields
            if (!username || !email || !password || !phone) {
                throw new Error('Missing required fields');
            }

            // Tạo admin entity
            const adminEntity = new UserEntity(username, email, password, phone, 'admin');
            
            // Thêm địa chỉ nếu có
            if (userData.address) {
                adminEntity.addAddress('Default', userData.address, true);
            }

            // Lấy thông tin đã được xử lý
            const adminDetails = await adminEntity.getUserDetails();

            // Tạo và lưu admin vào database
            const admin = new UserModel(adminDetails);
            await admin.save();

            return admin;
        } catch (error) {
            console.error('Error in UserFactory.createAdmin:', error);
            throw error;
        }
    }

    async updateUser(userId, updateData) {
        try {
            const user = await UserModel.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Nếu cập nhật password, hash password mới
            if (updateData.password) {
                updateData.password = await bcrypt.hash(updateData.password, 10);
            }

            // Nếu thêm địa chỉ mới
            if (updateData.address) {
                const isDefault = !user.addresses || user.addresses.length === 0;
                if (!user.addresses) user.addresses = [];
                user.addresses.push({
                    name: updateData.addressName || 'Default',
                    address: updateData.address,
                    isDefault
                });
                delete updateData.address;
                delete updateData.addressName;
            }

            // Cập nhật thông tin user
            Object.assign(user, updateData);
            await user.save();

            return user;
        } catch (error) {
            console.error('Error in UserFactory.updateUser:', error);
            throw error;
        }
    }
}

module.exports = new UserFactory(); 