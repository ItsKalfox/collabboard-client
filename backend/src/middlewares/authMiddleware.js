import jwt from 'jsonwebtoken';
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

export const protect = (req, res, next) => {
    try {
        let token;
        
        // Check for Bearer token in headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ status: 'error', message: 'Authentication token is required' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_12345');

        // Find user by ID
        const users = getMockData();
        const user = users.find(u => u.id === decoded.id);

        if (!user) {
            return res.status(401).json({ status: 'error', message: 'User not found or token invalid' });
        }

        // Attach user to request (exclude password)
        const { password, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;

        next();
    } catch (error) {
        return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
    }
};

export const optionalProtect = (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_12345');
            const users = getMockData();
            const user = users.find(u => u.id === decoded.id);
            if (user) {
                const { password, ...userWithoutPassword } = user;
                req.user = userWithoutPassword;
            }
        }
        next();
    } catch (error) {
        next();
    }
};
