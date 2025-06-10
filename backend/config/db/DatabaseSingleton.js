const mongoose = require('mongoose');

class Database {
    constructor() {
        if (Database.instance) {
            return Database.instance;
        }
        this._connection = null;
        Database.instance = this;
        return this;
    }

    async connect() {
        if (this._connection) {
            return this._connection;
        }

        try {
            this._connection = await mongoose.connect('mongodb://localhost:27017/sport_shop');
            console.log('Connect successfully');
            return this._connection;
        } catch (error) {
            console.log('Connect failed');
            throw error;
        }
    }

    getConnection() {
        return this._connection;
    }
}

// Tạo instance duy nhất
const instance = new Database();

module.exports = instance;