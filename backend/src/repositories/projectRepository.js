import Project from '../models/Project.js';

class ProjectRepository {
    async findWithMembers(query) {
        return await Project.find(query).populate('members.userId', 'name email avatar').exec();
    }

    async findByIdWithMembers(id) {
        return await Project.findById(id).populate('members.userId', 'name email avatar').exec();
    }

    async findById(id) {
        return await Project.findById(id);
    }

    async find(query) {
        return await Project.find(query);
    }

    async findRecent(query, limit) {
        return await Project.find(query)
            .sort({ updatedAt: -1 })
            .limit(limit)
            .populate('members.userId', 'name avatar')
            .exec();
    }

    async create(data) {
        return await Project.create(data);
    }

    async findByIdAndDelete(id) {
        return await Project.findByIdAndDelete(id);
    }

    async save(project) {
        return await project.save();
    }
}

export default new ProjectRepository();
