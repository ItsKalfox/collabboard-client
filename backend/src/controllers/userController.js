import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinary from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockDataPath = path.join(__dirname, '../data/mockData.json');

const getMockData = () => {
    if (!fs.existsSync(mockDataPath)) {
        return [];
    }
    const data = fs.readFileSync(mockDataPath, 'utf8');
    return JSON.parse(data);
};

const saveMockData = (data) => {
    fs.writeFileSync(mockDataPath, JSON.stringify(data, null, 2));
};

// GET /api/users/search?q={query}
export const searchUsers = (req, res) => {
    try {
        const { q } = req.query;
        const users = getMockData();

        let filteredUsers = users;

        if (q && q.trim() !== '') {
            const searchTerm = q.trim().toLowerCase();
            filteredUsers = users.filter(user =>
                (user.name && user.name.toLowerCase().includes(searchTerm)) ||
                (user.email && user.email.toLowerCase().includes(searchTerm))
            );
        }

        // Exclude passwords
        const safeUsers = filteredUsers.map(({ password, ...userWithoutPassword }) => userWithoutPassword);

        res.status(200).json({
            status: 'success',
            data: {
                users: safeUsers
            }
        });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
};

// POST /api/users/avatar — Upload profile picture to Cloudinary (authenticated)
export const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'No image file provided' });
        }

        const users = getMockData();
        const userIndex = users.findIndex(u => u.id === req.user.id);

        if (userIndex === -1) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // If user already has an avatar, delete old one from Cloudinary
        if (users[userIndex].avatarPublicId) {
            try {
                await cloudinary.uploader.destroy(users[userIndex].avatarPublicId);
            } catch (err) {
                console.warn('Failed to delete old avatar from Cloudinary:', err.message);
            }
        }

        // Upload new image to Cloudinary from memory buffer
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

        // Save avatar URL and public_id to user record
        users[userIndex].avatar = uploadResult.secure_url;
        users[userIndex].avatarPublicId = uploadResult.public_id;
        saveMockData(users);

        const { password, ...updatedUser } = users[userIndex];

        res.status(200).json({
            status: 'success',
            message: 'Avatar uploaded successfully',
            data: {
                avatarUrl: uploadResult.secure_url,
                user: updatedUser
            }
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to upload avatar' });
    }
};

// DELETE /api/users/avatar — Remove profile picture (authenticated)
export const removeAvatar = async (req, res) => {
    try {
        const users = getMockData();
        const userIndex = users.findIndex(u => u.id === req.user.id);

        if (userIndex === -1) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // Delete from Cloudinary if a public_id is stored
        if (users[userIndex].avatarPublicId) {
            try {
                await cloudinary.uploader.destroy(users[userIndex].avatarPublicId);
            } catch (err) {
                console.warn('Failed to delete avatar from Cloudinary:', err.message);
            }
        }

        // Clear avatar fields from user record
        users[userIndex].avatar = null;
        users[userIndex].avatarPublicId = null;
        saveMockData(users);

        const { password, ...updatedUser } = users[userIndex];

        res.status(200).json({
            status: 'success',
            message: 'Avatar removed successfully',
            data: { user: updatedUser }
        });
    } catch (error) {
        console.error('Remove avatar error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to remove avatar' });
    }
};

