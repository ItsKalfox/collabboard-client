import request from 'supertest';
import app from '../../app.js';
import { connectDB, clearDatabase, closeDatabase } from '../setup/db.js';
import { createTestUser } from '../helpers/authHelper.js';
import Project from '../../src/models/Project.js';
import Task from '../../src/models/Task.js';

describe('Optimistic Concurrency Control (OCC 409) Integration Tests', () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('Concurrent Task Modification and Version Conflicts', () => {
        it('should detect stale version and return 409 Conflict on simultaneous edits', async () => {
            const userA = await createTestUser({ email: 'client_a@example.com' });
            const userB = await createTestUser({ email: 'client_b@example.com' });

            const project = await Project.create({
                name: 'Concurrency Board',
                ownerId: userA.user._id,
                members: [
                    { userId: userA.user._id, role: 'Admin' },
                    { userId: userB.user._id, role: 'Editor' }
                ]
            });

            const initialTask = await Task.create({
                projectId: project._id,
                title: 'Design System Architecture',
                description: 'Original description',
                status: 'todo',
                assigneeId: userA.user._id
            });

            // Both clients read the task at version 0
            expect(initialTask.__v).toBe(0);
            const staleVersion = initialTask.__v;

            // Client A updates the task first
            const clientARes = await request(app)
                .patch(`/api/tasks/${initialTask._id}`)
                .set('Authorization', `Bearer ${userA.token}`)
                .send({
                    title: 'Design System Architecture (by Client A)',
                    version: staleVersion
                })
                .expect(200);

            expect(clientARes.body).toHaveProperty('status', 'success');
            expect(clientARes.body.data.task.__v).toBe(1);

            // Client B attempts to update the task using the now-stale version 0
            const clientBRes = await request(app)
                .patch(`/api/tasks/${initialTask._id}`)
                .set('Authorization', `Bearer ${userA.token}`)
                .send({
                    title: 'Design System Architecture (by Client B conflicting edit)',
                    version: staleVersion
                })
                .expect(409);

            expect(clientBRes.body).toHaveProperty('status', 'error');
            expect(clientBRes.body.message).toMatch(/conflict/i);
        });

        it('should resolve conflict when retrying with force: true', async () => {
            const user = await createTestUser();
            const project = await Project.create({
                name: 'Force Update Board',
                ownerId: user.user._id,
                members: [{ userId: user.user._id, role: 'Admin' }]
            });

            const task = await Task.create({
                projectId: project._id,
                title: 'High Priority Bugfix',
                status: 'todo',
                assigneeId: user.user._id
            });

            // Make a first update so DB version advances to 1
            await request(app)
                .patch(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${user.token}`)
                .send({ title: 'First Update', version: 0 })
                .expect(200);

            // Now send an update with stale version 0 but force: true
            const forceRes = await request(app)
                .patch(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${user.token}`)
                .send({
                    title: 'Force Overwritten Title',
                    version: 0,
                    force: true
                })
                .expect(200);

            expect(forceRes.body).toHaveProperty('status', 'success');
            expect(forceRes.body.data.task.title).toBe('Force Overwritten Title');
        });

        it('should resolve conflict when client fetches fresh version before updating', async () => {
            const user = await createTestUser();
            const project = await Project.create({
                name: 'Refresh Board',
                ownerId: user.user._id,
                members: [{ userId: user.user._id, role: 'Admin' }]
            });

            const task = await Task.create({
                projectId: project._id,
                title: 'Feature Implementation',
                status: 'todo',
                assigneeId: user.user._id
            });

            // Update 1 (advances version to 1)
            await request(app)
                .patch(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${user.token}`)
                .send({ title: 'Revision 1', version: 0 })
                .expect(200);

            // Client fetches latest task from server
            const getRes = await request(app)
                .get(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${user.token}`)
                .expect(200);

            const latestVersion = getRes.body.data.task.version ?? getRes.body.data.task.__v;
            expect(latestVersion).toBe(1);

            // Client updates using the fresh version
            const updateRes = await request(app)
                .patch(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${user.token}`)
                .send({
                    title: 'Revision 2 (Clean Update)',
                    version: latestVersion
                })
                .expect(200);

            expect(updateRes.body).toHaveProperty('status', 'success');
            expect(updateRes.body.data.task.title).toBe('Revision 2 (Clean Update)');
        });
    });
});
