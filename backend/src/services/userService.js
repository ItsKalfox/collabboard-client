import userRepository from '../repositories/userRepository.js';

class UserService {
    async searchUsers(query) {
        return await userRepository.findWithoutPassword(query);
    }

    async getUserByIdWithoutPassword(id) {
        return await userRepository.findByIdWithoutPassword(id);
    }

    async getUserById(id) {
        return await userRepository.findById(id);
    }

    async getUserByEmail(email) {
        return await userRepository.findOne({ email });
    }

    async findOne(query) {
        return await userRepository.findOne(query);
    }

    async createUser(data) {
        return await userRepository.create(data);
    }

    async saveUser(user) {
        return await userRepository.save(user);
    }
}

export default new UserService();
