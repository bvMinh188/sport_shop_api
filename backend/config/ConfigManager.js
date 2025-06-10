const path = require('path');
require('dotenv').config();

class ConfigManager {
    constructor() {
        if (ConfigManager.instance) {
            return ConfigManager.instance;
        }
        ConfigManager.instance = this;

        // Khởi tạo cấu hình mặc định
        this.config = {
            app: {
                port: process.env.PORT || 3000,
                env: process.env.NODE_ENV || 'development'
            },
            database: {
                url: process.env.MONGODB_URI || 'mongodb://localhost:27017/sport_shop'
            },
            auth: {
                jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
                jwtExpiration: process.env.JWT_EXPIRATION || '24h'
            },
            upload: {
                path: path.join(__dirname, '../public/uploads'),
                maxSize: 5 * 1024 * 1024 // 5MB
            },
            pagination: {
                defaultLimit: 10,
                maxLimit: 100
            }
        };

        // Freeze các object con để tránh thay đổi trực tiếp
        Object.keys(this.config).forEach(key => {
            Object.freeze(this.config[key]);
        });
    }

    get(key) {
        // Hỗ trợ dot notation, ví dụ: 'database.url'
        return key.split('.').reduce((obj, k) => obj && obj[k], this.config);
    }

    // Chỉ cho phép cập nhật một số cấu hình nhất định trong runtime
    updateRuntimeConfig(key, value) {
        const allowedRuntimeUpdates = ['pagination.defaultLimit', 'upload.maxSize'];
        
        if (!allowedRuntimeUpdates.includes(key)) {
            throw new Error(`Cannot update configuration key: ${key}`);
        }

        const keys = key.split('.');
        let current = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        
        // Tạo object mới với giá trị mới
        const newObj = { ...current };
        newObj[keys[keys.length - 1]] = value;
        Object.freeze(newObj);
        
        // Cập nhật reference
        current = newObj;
    }
}

// Tạo và export instance duy nhất
const configManager = new ConfigManager();
Object.freeze(configManager);
module.exports = configManager; 