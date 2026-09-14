import request from 'supertest';
import { jest } from '@jest/globals';
import nodemailer from 'nodemailer';
import app from '../../app.js';
import { connectDB, clearDatabase, closeDatabase } from '../setup/db.js';
import { createTestUser } from '../helpers/authHelper.js';
import Otp from '../../src/models/Otp.js';

describe('Account Management & Profile Integration Tests', () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('PATCH /api/auth/profile', () => {
        it('should update user profile (first name, last name, combined name)', async () => {
            const { token } = await createTestUser();

            const res = await request(app)
                .patch('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    firstName: 'Jane',
                    lastName: 'Smith'
                })
                .expect(200);

            expect(res.body).toHaveProperty('status', 'success');
            expect(res.body.data.user.firstName).toBe('Jane');
            expect(res.body.data.user.lastName).toBe('Smith');
            expect(res.body.data.user.name).toBe('Jane Smith');
        });

        it('should return 400 when required profile fields are missing', async () => {
            const { token } = await createTestUser();

            const res = await request(app)
                .patch('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({ firstName: 'OnlyFirst' })
                .expect(400);

            expect(res.body).toHaveProperty('status', 'error');
        });
    });

    describe('PATCH /api/auth/email', () => {
        it('should update email when correct current password is provided', async () => {
            const { token, rawPassword } = await createTestUser();
            const newEmail = `updated_${Date.now()}@example.com`;

            const res = await request(app)
                .patch('/api/auth/email')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    email: newEmail,
                    currentPassword: rawPassword
                })
                .expect(200);

            expect(res.body).toHaveProperty('status', 'success');
            expect(res.body.data.user.email).toBe(newEmail);
        });

        it('should return 401 when current password is wrong', async () => {
            const { token } = await createTestUser();

            const res = await request(app)
                .patch('/api/auth/email')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    email: 'newemail@example.com',
                    currentPassword: 'IncorrectPassword!'
                })
                .expect(401);

            expect(res.body).toHaveProperty('status', 'error');
            expect(res.body.message).toMatch(/incorrect/i);
        });

        it('should return 409 when target email is already taken by another account', async () => {
            const existing = await createTestUser({ email: 'existing_owner@example.com' });
            const { token, rawPassword } = await createTestUser();

            const res = await request(app)
                .patch('/api/auth/email')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    email: existing.user.email,
                    currentPassword: rawPassword
                })
                .expect(409);

            expect(res.body).toHaveProperty('status', 'error');
            expect(res.body.message).toMatch(/already/i);
        });
    });

    describe('PATCH /api/auth/password', () => {
        it('should successfully change password with valid current password', async () => {
            const { token, rawPassword } = await createTestUser();

            const res = await request(app)
                .patch('/api/auth/password')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    currentPassword: rawPassword,
                    newPassword: 'BrandNewPassword123!',
                    confirmNewPassword: 'BrandNewPassword123!'
                })
                .expect(200);

            expect(res.body).toHaveProperty('status', 'success');
            expect(res.body.message).toMatch(/changed successfully/i);
        });

        it('should return 400 when new password and confirmation do not match', async () => {
            const { token, rawPassword } = await createTestUser();

            const res = await request(app)
                .patch('/api/auth/password')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    currentPassword: rawPassword,
                    newPassword: 'NewPassword123!',
                    confirmNewPassword: 'MismatchPassword123!'
                })
                .expect(400);

            expect(res.body).toHaveProperty('status', 'error');
            expect(res.body.message).toMatch(/match/i);
        });
    });

    describe('POST /api/auth/forgot-password & /api/auth/reset-password', () => {
        beforeEach(() => {
            jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
                sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' })
            });
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should trigger OTP email dispatch and allow password reset with valid OTP', async () => {
            const { user } = await createTestUser({ email: 'forgot_user@example.com' });

            const forgotRes = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: user.email })
                .expect(200);

            expect(forgotRes.body).toHaveProperty('status', 'success');

            const otpRecord = await Otp.findOne({ userId: user._id });
            expect(otpRecord).toBeDefined();
            expect(otpRecord.otp).toBeDefined();

            const resetRes = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    email: user.email,
                    otp: otpRecord.otp,
                    newPassword: 'NewlyResetPassword123!'
                })
                .expect(200);

            expect(resetRes.body).toHaveProperty('status', 'success');
        });

        it('should return 400 when invalid OTP is provided for password reset', async () => {
            const { user } = await createTestUser({ email: 'bad_otp_user@example.com' });

            await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: user.email })
                .expect(200);

            const resetRes = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    email: user.email,
                    otp: '000000',
                    newPassword: 'NewlyResetPassword123!'
                })
                .expect(400);

            expect(resetRes.body).toHaveProperty('status', 'error');
            expect(resetRes.body.message).toMatch(/invalid otp/i);
        });
    });
});
