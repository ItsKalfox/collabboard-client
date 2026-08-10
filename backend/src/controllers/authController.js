import bcrypt from 'bcryptjs';
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

const saveMockData = (data) => {
    fs.writeFileSync(mockDataPath, JSON.stringify(data, null, 2));
};

export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Manual validation
        if (!name || !email || !password) {
            return res.status(400).json({ status: 'error', message: 'Name, email, and password are required' });
        }

        const users = getMockData();

        // Check if user already exists
        const userExists = users.find((user) => user.email === email);
        if (userExists) {
            return res.status(409).json({ status: 'error', message: 'Email is already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password: hashedPassword,
            date: new Date().toISOString()
        };

        // Save mock user
        users.push(newUser);
        saveMockData(users);

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                date: newUser.date
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Manual validation
        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Email and password are required' });
        }

        const users = getMockData();

        // Check if user exists
        const user = users.find((u) => u.email === email);
        if (!user) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        // Generate JWT token
        const payload = {
            id: user.id,
            email: user.email
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'super_secret_key_12345',
            { expiresIn: (parseInt(process.env.JWT_EXPIRES_IN_MINUTES) || 1440) * 60 }
        );

        res.status(200).json({
            status: 'success',
            message: 'User logged in successfully',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                },
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const getCurrentUser = (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            user: req.user
        }
    });
};
