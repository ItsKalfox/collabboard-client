import Task from '../models/Task.js';

class TaskRepository {
    async findById(id) {
        return await Task.findById(id);
    }

    async findByIdWithProject(id) {
        return await Task.findById(id).populate('projectId');
    }

    async findWithAssigneeAndAttachments(query) {
        return await Task.find(query).populate('assigneeId', 'name avatar').populate('attachments').exec();
    }

    async create(data) {
        return await Task.create(data);
    }

    async findByIdAndUpdate(id, data, options) {
        return await Task.findByIdAndUpdate(id, data, options);
    }

    async findByIdAndDelete(id) {
        return await Task.findByIdAndDelete(id);
    }

    async findByIdWithAssignee(id) {
        return await Task.findById(id).populate('assigneeId', 'name avatar').exec();
    }

    async findByIdWithReviews(id) {
        return await Task.findById(id).populate('reviews.reviewerId', 'name avatar').exec();
    }

    async find(query) {
        return await Task.find(query);
    }

    async findOne(query) {
        return await Task.findOne(query);
    }

    async insertMany(data) {
        return await Task.insertMany(data);
    }

    async deleteMany(query) {
        return await Task.deleteMany(query);
    }

    async findWithAssignee(query) {
        return await Task.find(query).populate('assigneeId', 'name avatar');
    }

    async findRecentTasks(query, limit) {
        return await Task.find(query).sort({ createdAt: -1 }).limit(limit).populate('assigneeId', 'name');
    }

    async findWithAttachments(query) {
        return await Task.find(query).populate('attachments');
    }

    async save(task) {
        return await task.save();
    }
}

export default new TaskRepository();
