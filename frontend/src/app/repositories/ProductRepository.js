const BaseRepository = require('./BaseRepository');
const Product = require('../models/Product');

class ProductRepository extends BaseRepository {
    constructor() {
        super(Product);
    }

    async findBySlug(slug) {
        return await this.model.findOne({ slug }).exec();
    }

    async findByCategory(category) {
        return await this.model.find({ category });
    }

    async search(keyword) {
        const searchRegex = new RegExp(keyword.trim(), 'i');
        return await this.model.find({
            $or: [
                { name: searchRegex },
                { description: searchRegex },
                { category: searchRegex }
            ]
        }).lean();
    }

    async findWithPagination(filter = {}, sort = {}, skip = 0, limit = 10) {
        return await this.model.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();
    }

    async findWithSuggestions(ids) {
        return await this.model.find({ _id: { $in: ids } })
            .select('name image price slug')
            .lean();
    }
}

module.exports = new ProductRepository(); 