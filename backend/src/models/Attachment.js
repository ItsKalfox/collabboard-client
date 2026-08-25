import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    filename: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

attachmentSchema.virtual('id').get(function() {
    return this._id.toHexString();
});
attachmentSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
    }
});
attachmentSchema.set('toObject', { virtuals: true });

const Attachment = mongoose.model('Attachment', attachmentSchema);

export default Attachment;
