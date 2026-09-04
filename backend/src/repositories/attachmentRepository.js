import Attachment from '../models/Attachment.js';

class AttachmentRepository {
    async findById(id) {
        return await Attachment.findById(id);
    }

    async find(query) {
        return await Attachment.find(query);
    }

    async findOne(query) {
        return await Attachment.findOne(query);
    }

    async create(data) {
        return await Attachment.create(data);
    }

    async deleteMany(query) {
        return await Attachment.deleteMany(query);
    }

    async findByIdAndDelete(id) {
        return await Attachment.findByIdAndDelete(id);
    }

    async findRecentAttachments(query, sortOptions, populateField, populateSelect) {
        return await Attachment.find(query).sort(sortOptions).populate(populateField, populateSelect);
    }
}

export default new AttachmentRepository();
