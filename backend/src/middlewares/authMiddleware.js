import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
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

        // Find user by ID in MongoDB
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ status: 'error', message: 'User not found or token invalid' });
        }

        // Attach user to request
        req.user = user;

        next();
    } catch (error) {
        return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
    }
};
