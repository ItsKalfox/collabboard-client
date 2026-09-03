import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import userService from '../services/userService.js';
import otpRepository from '../repositories/otpRepository.js';

export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ status: 'error', message: 'Name, email, and password are required' });
        }

        const userExists = await userService.getUserByEmail(email);
        if (userExists) {
            return res.status(409).json({ status: 'error', message: 'Email is already registered' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await userService.createUser({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                date: newUser.date
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1);
            return res.status(409).json({ status: 'error', message: `${capitalizedField} already exists` });
        }
        console.error('Registration error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Email and password are required' });
        }

        const user = await userService.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        const payload = {
            id: user._id,
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
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    team: user.team
                },
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const getCurrentUser = async (req, res) => {
    try {
        const user = await userService.getUserByIdWithoutPassword(req.user.id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    team: user.team
                }
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ status: 'error', message: 'Email is required' });
        }

        const user = await userService.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await otpRepository.deleteMany({ userId: user._id });
        await otpRepository.create({
            userId: user._id,
            otp,
            expiresAt
        });

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

        const user = await userService.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const userOtpRecord = await otpRepository.findOne({ userId: user._id });

        if (!userOtpRecord || userOtpRecord.otp !== otp) {
            return res.status(400).json({ status: 'error', message: 'Invalid OTP' });
        }

        if (new Date() > userOtpRecord.expiresAt) {
            return res.status(400).json({ status: 'error', message: 'OTP has expired' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await userService.saveUser(user);

        await otpRepository.deleteOne({ _id: userOtpRecord._id });

        res.status(200).json({ status: 'success', message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName } = req.body;

        if (!firstName || !lastName) {
            return res.status(400).json({ status: 'error', message: 'First name and last name are required' });
        }

        const user = await userService.getUserById(req.user.id);

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        user.firstName = firstName.trim();
        user.lastName = lastName.trim();
        user.name = `${firstName.trim()} ${lastName.trim()}`;

        await userService.saveUser(user);

        res.status(200).json({
            status: 'success',
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    team: user.team
                }
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const updateEmail = async (req, res) => {
    try {
        const { email, currentPassword } = req.body;

        if (!email || !currentPassword) {
            return res.status(400).json({ status: 'error', message: 'New email and current password are required' });
        }

        const user = await userService.getUserById(req.user.id);

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Current password is incorrect' });
        }

        const emailTaken = await userService.findOne({ email: email.trim().toLowerCase(), _id: { $ne: user._id } });
        if (emailTaken) {
            return res.status(409).json({ status: 'error', message: 'Email is already registered to another account' });
        }

        user.email = email.trim().toLowerCase();
        await userService.saveUser(user);

        res.status(200).json({
            status: 'success',
            message: 'Email updated successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    team: user.team
                }
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1);
            return res.status(409).json({ status: 'error', message: `${capitalizedField} already exists` });
        }
        console.error('Update email error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmNewPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({ status: 'error', message: 'Current password, new password, and confirm password are required' });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ status: 'error', message: 'New password and confirm password do not match' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ status: 'error', message: 'New password must be at least 6 characters' });
        }

        const user = await userService.getUserById(req.user.id);

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await userService.saveUser(user);

        res.status(200).json({
            status: 'success',
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};
