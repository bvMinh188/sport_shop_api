class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    async findAll(filters = {}) {
        return await this.model.find(filters);
    }

    async findById(id) {
        return await this.model.findById(id);
    }

    async create(data) {
        const entity = new this.model(data);
        return await entity.save();
    }

    async update(id, data) {
        return await this.model.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id) {
        return await this.model.findByIdAndDelete(id);
    }

    async findOne(conditions) {
        return await this.model.findOne(conditions);
    }

    async count(filters = {}) {
        return await this.model.countDocuments(filters);
    }
}

module.exports = BaseRepository; 