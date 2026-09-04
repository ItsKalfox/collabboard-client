import User from '../models/User.js';

class UserRepository {
    async findById(id) {
        return await User.findById(id);
    }

    async findByIdWithoutPassword(id) {
        return await User.findById(id).select('-password');
    }

    async findOne(query) {
        return await User.findOne(query);
    }

    async findWithoutPassword(query) {
        return await User.find(query).select('-password').exec();
    }

    async create(data) {
        return await User.create(data);
    }

    async save(user) {
        return await user.save();
    }
}

export default new UserRepository();
