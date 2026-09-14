import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../../src/models/User.js';

export const generateToken = (userId, email = 'test@example.com') => {
    return jwt.sign(
        { id: userId, email },
        process.env.JWT_SECRET || 'super_secret_key_12345',
        { expiresIn: '1d' }
    );
};

export const createTestUser = async (overrides = {}) => {
    const defaultPassword = overrides.plainPassword || 'Password123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const userData = {
        name: 'Test User',
        email: `test_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`,
        password: hashedPassword,
        ...overrides
    };
    delete userData.plainPassword;

    const user = await User.create(userData);
    const token = generateToken(user._id.toString(), user.email);

    return {
        user,
        token,
        rawPassword: defaultPassword
    };
};
