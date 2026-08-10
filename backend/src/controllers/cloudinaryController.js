import cloudinary from '../config/cloudinary.js';

export const getCloudinaryInfo = async (req, res) => {
    try {
        const usage = await cloudinary.api.usage();
        res.status(200).json({
            status: 'success',
            data: usage
        });
    } catch (error) {
        console.error('Cloudinary API Error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch Cloudinary info' });
    }
};
