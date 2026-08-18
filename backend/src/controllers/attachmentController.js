import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinary from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockAttachmentsPath = path.join(__dirname, '../data/mockAttachments.json');

const getMockAttachments = () => {
    if (!fs.existsSync(mockAttachmentsPath)) {
        return [];
    }
    const data = fs.readFileSync(mockAttachmentsPath, 'utf8');
    return JSON.parse(data);
};

const saveMockAttachments = (data) => {
    fs.writeFileSync(mockAttachmentsPath, JSON.stringify(data, null, 2));
};

export const getAttachmentById = (req, res) => {
    try {
        const { attachmentId } = req.params;
        const attachments = getMockAttachments();
        const attachment = attachments.find(a => a.id === attachmentId);

        if (!attachment) {
            return res.status(404).json({ status: 'error', message: 'Attachment not found' });
        }

        res.status(200).json({
            status: 'success',
            data: { attachment }
        });
    } catch (error) {
        console.error('Get attachment by ID error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const deleteAttachmentById = async (req, res) => {
    try {
        const { attachmentId } = req.params;
        const attachments = getMockAttachments();
        const attachmentIndex = attachments.findIndex(a => a.id === attachmentId);

        if (attachmentIndex === -1) {
            return res.status(404).json({ status: 'error', message: 'Attachment not found' });
        }

        const attachment = attachments[attachmentIndex];

        // Delete from Cloudinary
        if (attachment.publicId) {
            try {
                await cloudinary.uploader.destroy(attachment.publicId);
            } catch (err) {
                console.error('Failed to delete attachment from Cloudinary:', err.message);
                // We still proceed to delete the local reference even if cloud deletion fails
            }
        }

        attachments.splice(attachmentIndex, 1);
        saveMockAttachments(attachments);

        res.status(200).json({
            status: 'success',
            message: 'Attachment deleted successfully'
        });
    } catch (error) {
        console.error('Delete attachment error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};
