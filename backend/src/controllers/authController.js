import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockDataPath = path.join(__dirname, '../data/mockData.json');
const mockOtpsPath = path.join(__dirname, '../data/mockOtps.json');

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

const getMockOtps = () => {
    if (!fs.existsSync(mockOtpsPath)) return [];
    return JSON.parse(fs.readFileSync(mockOtpsPath, 'utf8'));
};

const saveMockOtps = (data) => {
    fs.writeFileSync(mockOtpsPath, JSON.stringify(data, null, 2));
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

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ status: 'error', message: 'Email is required' });
        }

        const users = getMockData();
        const userIndex = users.findIndex(u => u.email === email);
        if (userIndex === -1) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Expiration time: 15 minutes from now
        const otpExpires = Date.now() + 15 * 60 * 1000; 

        // Update OTP in mockOtps
        const otps = getMockOtps();
        const filteredOtps = otps.filter(o => o.id !== users[userIndex].id);
        filteredOtps.push({
            id: users[userIndex].id,
            otp,
            otpExpires
        });
        saveMockOtps(filteredOtps);

        // Send Email
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Password Reset OTP',
            text: `Your password reset OTP is: ${otp}. It will expire in 15 minutes.`
        });

        res.status(200).json({ status: 'success', message: 'OTP sent to email' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ status: 'error', message: 'Server error while sending OTP' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ status: 'error', message: 'Email, OTP, and new password are required' });
        }

        const users = getMockData();
        const userIndex = users.findIndex(u => u.email === email);
        if (userIndex === -1) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const user = users[userIndex];
        const otps = getMockOtps();
        const userOtpRecord = otps.find(o => o.id === user.id);

        // Validate OTP
        if (!userOtpRecord || userOtpRecord.otp !== otp) {
            return res.status(400).json({ status: 'error', message: 'Invalid OTP' });
        }

        if (Date.now() > userOtpRecord.otpExpires) {
            return res.status(400).json({ status: 'error', message: 'OTP has expired' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear OTP
        users[userIndex].password = hashedPassword;
        saveMockData(users);

        const newOtps = otps.filter(o => o.id !== user.id);
        saveMockOtps(newOtps);

        res.status(200).json({ status: 'success', message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};
