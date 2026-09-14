import request from 'supertest';
import app from '../../app.js';
import { connectDB, clearDatabase, closeDatabase } from '../setup/db.js';
import { createTestUser } from '../helpers/authHelper.js';
import Project from '../../src/models/Project.js';
import Task from '../../src/models/Task.js';

describe('Subtasks API Integration Tests', () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('Task Subtask Lifecycle', () => {
        it('should create, list, toggle status, and delete subtasks', async () => {
            const { user, token } = await createTestUser();
            const project = await Project.create({
                name: 'Subtask Board',
                ownerId: user._id,
                members: [{ userId: user._id, role: 'Admin' }]
            });

            const task = await Task.create({
                projectId: project._id,
                title: 'Parent Task',
                status: 'todo',
                assigneeId: user._id,
                subtasks: [{ title: 'Initial Subtask', completed: false }]
            });

            // 1. Fetch subtasks
            const getRes = await request(app)
                .get(`/api/tasks/${task._id}/subtasks`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(getRes.body).toHaveProperty('status', 'success');
            expect(getRes.body.data.subtasks).toHaveLength(1);
            const subtaskId = getRes.body.data.subtasks[0]._id;

            // 2. Add another subtask
            const createRes = await request(app)
                .post(`/api/tasks/${task._id}/subtasks`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'New Subtask Item'
                })
                .expect(201);

            expect(createRes.body).toHaveProperty('status', 'success');
            expect(createRes.body.data.subtasks).toHaveLength(2);

            // 3. Update subtask status
            const patchRes = await request(app)
                .patch(`/api/subtasks/${subtaskId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ completed: true, title: 'Completed Initial Subtask' })
                .expect(200);

            expect(patchRes.body).toHaveProperty('status', 'success');
            expect(patchRes.body.data.subtask.completed).toBe(true);

            // 4. Delete subtask
            const deleteRes = await request(app)
                .delete(`/api/subtasks/${subtaskId}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(deleteRes.body).toHaveProperty('status', 'success');
        });
    });
});
