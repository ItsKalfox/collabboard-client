import request from 'supertest';
import app from '../../app.js';
import { connectDB, clearDatabase, closeDatabase } from '../setup/db.js';
import { createTestUser } from '../helpers/authHelper.js';
import Project from '../../src/models/Project.js';
import Task from '../../src/models/Task.js';

describe('Kanban Tasks API Integration Tests', () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('POST /api/projects/:projectId/tasks', () => {
        it('should create a new task in the project', async () => {
            const { user, token } = await createTestUser();
            const project = await Project.create({
                name: 'Sprint Board',
                ownerId: user._id,
                members: [{ userId: user._id, role: 'Admin' }]
            });

            const res = await request(app)
                .post(`/api/projects/${project._id}/tasks`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'Implement Database Migrations',
                    description: 'Set up initial migration scripts',
                    status: 'todo',
                    priority: 'high'
                })
                .expect(201);

            expect(res.body).toHaveProperty('status', 'success');
            expect(res.body.data.task.title).toBe('Implement Database Migrations');
            expect(res.body.data.task.status).toBe('todo');
            expect(res.body.data.task.priority).toBe('high');
            expect(res.body.data.task.projectId).toBe(project._id.toString());
        });

        it('should return 400 when task title is missing', async () => {
            const { user, token } = await createTestUser();
            const project = await Project.create({
                name: 'Board',
                ownerId: user._id,
                members: [{ userId: user._id, role: 'Admin' }]
            });

            const res = await request(app)
                .post(`/api/projects/${project._id}/tasks`)
                .set('Authorization', `Bearer ${token}`)
                .send({ description: 'No title' })
                .expect(400);

            expect(res.body).toHaveProperty('status', 'error');
            expect(res.body.message).toMatch(/title.*required/i);
        });
    });

    describe('GET /api/projects/:projectId/tasks', () => {
        it('should fetch all tasks for a specific project', async () => {
            const { user, token } = await createTestUser();
            const project = await Project.create({
                name: 'Kanban Project',
                ownerId: user._id,
                members: [{ userId: user._id, role: 'Admin' }]
            });

            await Task.create([
                { projectId: project._id, title: 'Task 1', status: 'todo', assigneeId: user._id },
                { projectId: project._id, title: 'Task 2', status: 'in-progress', assigneeId: user._id }
            ]);

            const res = await request(app)
                .get(`/api/projects/${project._id}/tasks`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(res.body).toHaveProperty('status', 'success');
            expect(res.body.data.tasks).toHaveLength(2);
            expect(res.body.data.pagination).toHaveProperty('total', 2);
        });
    });

    describe('GET /api/tasks/:taskId', () => {
        it('should retrieve single task by ID', async () => {
            const { user, token } = await createTestUser();
            const project = await Project.create({
                name: 'Project Single',
                ownerId: user._id,
                members: [{ userId: user._id, role: 'Admin' }]
            });

            const task = await Task.create({
                projectId: project._id,
                title: 'Individual Task',
                status: 'todo',
                assigneeId: user._id
            });

            const res = await request(app)
                .get(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(res.body).toHaveProperty('status', 'success');
            expect(res.body.data.task.title).toBe('Individual Task');
        });
    });

    describe('PATCH /api/tasks/:taskId', () => {
        it('should update task details', async () => {
            const { user, token } = await createTestUser();
            const project = await Project.create({
                name: 'Project Modify',
                ownerId: user._id,
                members: [{ userId: user._id, role: 'Admin' }]
            });

            const task = await Task.create({
                projectId: project._id,
                title: 'Original Title',
                status: 'todo',
                priority: 'low',
                assigneeId: user._id
            });

            const res = await request(app)
                .patch(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'Updated Task Title',
                    priority: 'high'
                })
                .expect(200);

            expect(res.body).toHaveProperty('status', 'success');
            expect(res.body.data.task.title).toBe('Updated Task Title');
            expect(res.body.data.task.priority).toBe('high');
        });
    });

    describe('PATCH /api/tasks/:taskId/status', () => {
        it('should transition status from todo -> in-progress -> done and record activity', async () => {
            const { user, token } = await createTestUser();
            const project = await Project.create({
                name: 'Workflow Project',
                ownerId: user._id,
                members: [{ userId: user._id, role: 'Admin' }]
            });

            const task = await Task.create({
                projectId: project._id,
                title: 'Workflow Item',
                status: 'todo',
                assigneeId: user._id
            });

            const res1 = await request(app)
                .patch(`/api/tasks/${task._id}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'in-progress' })
                .expect(200);

            expect(res1.body.data.task.status).toBe('in-progress');

            const res2 = await request(app)
                .patch(`/api/tasks/${task._id}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'done' })
                .expect(200);

            expect(res2.body.data.task.status).toBe('done');
        });
    });

    describe('DELETE /api/tasks/:taskId', () => {
        it('should delete a task from the project', async () => {
            const { user, token } = await createTestUser();
            const project = await Project.create({
                name: 'Delete Project',
                ownerId: user._id,
                members: [{ userId: user._id, role: 'Admin' }]
            });

            const task = await Task.create({
                projectId: project._id,
                title: 'To Be Removed',
                status: 'todo',
                assigneeId: user._id
            });

            const res = await request(app)
                .delete(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(res.body).toHaveProperty('status', 'success');

            const check = await Task.findById(task._id);
            expect(check).toBeNull();
        });
    });
});
