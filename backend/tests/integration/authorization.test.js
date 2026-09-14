import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../../app.js';
import { connectDB, clearDatabase, closeDatabase } from '../setup/db.js';
import { createTestUser, generateToken } from '../helpers/authHelper.js';
import Project from '../../src/models/Project.js';
import Task from '../../src/models/Task.js';

describe('Security & Authorization Integration Tests', () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('JWT Token Validation Middleware', () => {
        it('should return 401 when Authorization header is missing', async () => {
            const res = await request(app)
                .get('/api/projects')
                .expect(401);

            expect(res.body).toHaveProperty('status', 'error');
            expect(res.body.message).toMatch(/token is required/i);
        });

        it('should return 401 when token format is malformed or invalid', async () => {
            const res = await request(app)
                .get('/api/projects')
                .set('Authorization', 'Bearer invalid.jwt.token')
                .expect(401);

            expect(res.body).toHaveProperty('status', 'error');
            expect(res.body.message).toMatch(/invalid or expired token/i);
        });

        it('should return 401 when token is expired', async () => {
            const expiredToken = jwt.sign(
                { id: new mongoose.Types.ObjectId().toString(), email: 'expired@example.com' },
                process.env.JWT_SECRET || 'super_secret_key_12345',
                { expiresIn: '-10s' }
            );

            const res = await request(app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401);

            expect(res.body).toHaveProperty('status', 'error');
            expect(res.body.message).toMatch(/invalid or expired token/i);
        });

        it('should return 401 when token contains a non-existent user ID', async () => {
            const nonExistentId = new mongoose.Types.ObjectId().toString();
            const orphanToken = generateToken(nonExistentId, 'ghost@example.com');

            const res = await request(app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${orphanToken}`)
                .expect(401);

            expect(res.body).toHaveProperty('status', 'error');
            expect(res.body.message).toMatch(/user not found or token invalid/i);
        });
    });

    describe('Resource Access & Role-Based Authorization', () => {
        it('should deny (403) a non-owner user from updating another user\'s project', async () => {
            const owner = await createTestUser({ email: 'owner@example.com' });
            const stranger = await createTestUser({ email: 'stranger@example.com' });

            const project = await Project.create({
                name: 'Owner Secret Project',
                ownerId: owner.user._id,
                members: [{ userId: owner.user._id, role: 'Admin' }]
            });

            const res = await request(app)
                .put(`/api/projects/${project._id}`)
                .set('Authorization', `Bearer ${stranger.token}`)
                .send({ name: 'Hacked Project Name' })
                .expect(403);

            expect(res.body).toHaveProperty('status', 'error');
            expect(res.body.message).toMatch(/not authorized/i);
        });

        it('should deny (403) an unauthorized user from modifying a task they do not own or are not assigned to', async () => {
            const owner = await createTestUser({ email: 'task_owner@example.com' });
            const unauthorizedUser = await createTestUser({ email: 'intruder@example.com' });

            const project = await Project.create({
                name: 'Team Project',
                ownerId: owner.user._id,
                members: [{ userId: owner.user._id, role: 'Admin' }]
            });

            const task = await Task.create({
                projectId: project._id,
                title: 'Sensitive Task',
                assigneeId: owner.user._id,
                status: 'todo'
            });

            const res = await request(app)
                .patch(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${unauthorizedUser.token}`)
                .send({ title: 'Unauthorized Modification' })
                .expect(403);

            expect(res.body).toHaveProperty('status', 'error');
            expect(res.body.message).toMatch(/not authorized/i);
        });
    });
});
