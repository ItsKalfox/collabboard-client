import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    status: { type: String, default: 'todo' },
    priority: { type: String, default: 'medium' },
    assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dueDate: { type: Date },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    reviews: [{
        reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['approved', 'rejected'] },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now }
    }],
    subtasks: [{
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
        description: { type: String }
    }],
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],
    activities: [{
        text: String,
        type: { type: String, enum: ['created', 'moved', 'completed', 'approved', 'rejected', 'updated'] },
        fromStatus: String,
        toStatus: String,
        timestamp: { type: Date, default: Date.now },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
}, {
    timestamps: true
});

taskSchema.virtual('id').get(function() {
    return this._id.toHexString();
});
taskSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
    }
});
taskSchema.set('toObject', { virtuals: true });

const Task = mongoose.model('Task', taskSchema);

export default Task;
