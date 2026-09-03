import cloudinary from '../config/cloudinary.js';

export const getCloudinaryInfo = async (req, res) => {
    try {
        const usage = await cloudinary.api.usage();
        res.status(200).json({
            status: 'success',
            data: usage
        });
    } catch (error) {
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(404).json({ status: 'error', message: 'Resource not found' });
        }
        console.error('Cloudinary API Error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch Cloudinary info' });
    }
};
