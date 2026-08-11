import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
