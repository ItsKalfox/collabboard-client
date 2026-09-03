import cloudinary from '../config/cloudinary.js';
import attachmentRepository from '../repositories/attachmentRepository.js';
import taskRepository from '../repositories/taskRepository.js';

export const getAttachmentById = async (req, res) => {
    try {
        const attachment = await attachmentRepository.findById(req.params.attachmentId);
        if (!attachment) return res.status(404).json({ status: 'error', message: 'Attachment not found' });

        res.status(200).json({ status: 'success', data: { attachment } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const deleteAttachmentById = async (req, res) => {
    try {
        const attachment = await attachmentRepository.findById(req.params.attachmentId);
        if (!attachment) return res.status(404).json({ status: 'error', message: 'Attachment not found' });

        if (attachment.publicId) {
            try { await cloudinary.uploader.destroy(attachment.publicId); } catch (e) { }
        }

        await attachmentRepository.findByIdAndDelete(req.params.attachmentId);

        if (attachment.taskId) {
            const task = await taskRepository.findById(attachment.taskId);
            if (task && task.attachments) {
                task.attachments.pull(attachment._id);
                await taskRepository.save(task);
            }
        }

        res.status(200).json({ status: 'success', message: 'Attachment deleted successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};
