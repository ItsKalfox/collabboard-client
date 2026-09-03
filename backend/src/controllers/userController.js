import cloudinary from '../config/cloudinary.js';
import userService from '../services/userService.js';

export const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        let query = {};

        if (q && q.trim() !== '') {
            const searchTerm = q.trim();
            query = {
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { email: { $regex: searchTerm, $options: 'i' } }
                ]
            };
        }

        const users = await userService.searchUsers(query);

        res.status(200).json({
            status: 'success',
            data: { users }
        });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ status: 'error', message: 'No image file provided' });

        const user = await userService.getUserById(req.user.id);
        if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

        if (user.avatarPublicId) {
            try { await cloudinary.uploader.destroy(user.avatarPublicId); } catch (e) { }
        }

        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'collabboard/avatars',
                    public_id: `avatar_${req.user.id}`,
                    overwrite: true,
                    transformation: [
                        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                        { quality: 'auto', fetch_format: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });

        user.avatar = uploadResult.secure_url;
        user.avatarPublicId = uploadResult.public_id;
        await userService.saveUser(user);

        const userObj = user.toObject();
        delete userObj.password;

        res.status(200).json({
            status: 'success',
            message: 'Avatar uploaded successfully',
            data: { avatarUrl: uploadResult.secure_url, user: userObj }
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to upload avatar' });
    }
};

export const removeAvatar = async (req, res) => {
    try {
        const user = await userService.getUserById(req.user.id);
        if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

        if (user.avatarPublicId) {
            try { await cloudinary.uploader.destroy(user.avatarPublicId); } catch (e) { }
        }

        user.avatar = null;
        user.avatarPublicId = null;
        await userService.saveUser(user);

        const userObj = user.toObject();
        delete userObj.password;

        res.status(200).json({
            status: 'success',
            message: 'Avatar removed successfully',
            data: { user: userObj }
        });
    } catch (error) {
        console.error('Remove avatar error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to remove avatar' });
    }
};
