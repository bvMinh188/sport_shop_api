class LoggerService {
    constructor() {
        if (LoggerService.instance) {
            return LoggerService.instance;
        }
        LoggerService.instance = this;
        
        // Khởi tạo các thuộc tính
        this.logs = [];
    }

    log(type, message, data = null) {
        const logEntry = {
            timestamp: new Date(),
            type,
            message,
            data
        };
        
        this.logs.push(logEntry);
        
        // Log ra console với màu sắc khác nhau
        switch(type.toLowerCase()) {
            case 'error':
                console.error(`[ERROR] ${message}`, data || '');
                break;
            case 'warning':
                console.warn(`[WARNING] ${message}`, data || '');
                break;
            case 'info':
                console.info(`[INFO] ${message}`, data || '');
                break;
            default:
                console.log(`[LOG] ${message}`, data || '');
        }
    }

    // Các phương thức tiện ích
    error(message, data = null) {
        this.log('error', message, data);
    }

    warning(message, data = null) {
        this.log('warning', message, data);
    }

    info(message, data = null) {
        this.log('info', message, data);
    }

    // Lấy logs theo loại
    getLogs(type = null) {
        if (type) {
            return this.logs.filter(log => log.type.toLowerCase() === type.toLowerCase());
        }
        return this.logs;
    }

    // Xóa logs
    clearLogs() {
        this.logs = [];
    }
}

// Tạo và export instance duy nhất
const logger = new LoggerService();
Object.freeze(logger);
module.exports = logger; 