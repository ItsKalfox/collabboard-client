import Otp from '../models/Otp.js';

class OtpRepository {
    async create(data) {
        return await Otp.create(data);
    }

    async findOne(query) {
        return await Otp.findOne(query);
    }

    async deleteOne(query) {
        return await Otp.deleteOne(query);
    }

    async deleteMany(query) {
        return await Otp.deleteMany(query);
    }
}

export default new OtpRepository();
