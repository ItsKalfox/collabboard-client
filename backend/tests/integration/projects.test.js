import request from 'supertest';
import app from '../../app.js';
import { connectDB, clearDatabase, closeDatabase } from '../setup/db.js';
import { createTestUser } from '../helpers/authHelper.js';
import Project from '../../src/models/Project.js';

describe('Project Management API Integration Tests', () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('POST /api/projects', () => {
        it('should successfully create a new project', async () => {
            const { user, token } = await createTestUser();

            const res = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Alpha Platform',
                    description: 'Main project for alpha release',
                    category: 'Engineering',
                    status: 'active'
                })
                .expect(201);

            expect(res.body).toHaveProperty('status', 'success');
            expect(res.body.data.project).toHaveProperty('name', 'Alpha Platform');
            expect(res.body.data.project.ownerId).toBe(user._id.toString());
        });

        it('should return 400 when project name is missing', async () => {
            const { token } = await createTestUser();

            const res = await request(app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${token}`)
                .send({ description: 'Missing name' })
                .expect(400);

            expect(res.body).toHaveProperty('status', 'error');
            expect(res.body.message).toMatch(/name is required/i);
        });
    });

    describe('GET /api/projects', () => {
        it('should return paginated list of projects belonging to the user', async () => {
            const { user, token } = await createTestUser();

            await Project.create([
                { name: 'Project 1', ownerId: user._id, members: [{ userId: user._id, role: 'Admin' }] },
                { name: 'Project 2', ownerId: user._id, members: [{ userId: user._id, role: 'Admin' }] }
            ]);

            const res = await request(app)
                .get('/api/projects?page=1&limit=10')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(res.body).toHaveProperty('status', 'success');
            expect(res.body.data.projects).toHaveLength(2);
            expect(res.body.data.pagination).toHaveProperty('total', 2);
        });
    });

    describe('GET /api/projects/:id', () => {
        it('should return project details by ID with members', async () => {
            const { user, token } = await createTestUser();
            const project = await Project.create({
                name: 'Detail Project',
                ownerId: user._id,
                members: [{ userId: user._id, role: 'Admin' }]
            });

            const res = await request(app)
                .get(`/api/projects/${project._id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(res.body).toHaveProperty('status', 'success');
            expect(res.body.data.project.name).toBe('Detail Project');
            expect(res.body.data.project.members).toHaveLength(1);
        });

        it('should return 404 for non-existent project ID', async () => {
            const { token } = await createTestUser();

            const res = await request(app)
                .get('/api/projects/651f1f1f1f1f1f1f1f1f1f1f')
                .set('Authorization', `Bearer ${token}`)
                .expect(404);

            expect(res.body).toHaveProperty('status', 'error');
        });
    });

    describe('PUT /api/projects/:id', () => {
        it('should allow project owner to update project details', async () => {
            const { user, token } = await createTestUser();
            const project = await Project.create({
                name: 'Initial Project Name',
                ownerId: user._id,
                members: [{ userId: user._id, role: 'Admin' }]
            });

            const res = await request(app)
                .put(`/api/projects/${project._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Renamed Project Name',
                    description: 'Updated description'
                })
                .expect(200);

            expect(res.body).toHaveProperty('status', 'success');
            expect(res.body.data.project.name).toBe('Renamed Project Name');
        });
    });

    describe('Project Member Management (/api/projects/:id/members)', () => {
        it('should add a member to the project and then remove the member', async () => {
            const owner = await createTestUser({ email: 'owner_member@example.com' });
            const newMember = await createTestUser({ email: 'collaborator@example.com' });

            const project = await Project.create({
                name: 'Collaboration Space',
                ownerId: owner.user._id,
                members: [{ userId: owner.user._id, role: 'Admin' }]
            });

            // 1. Add member
            const addRes = await request(app)
                .post(`/api/projects/${project._id}/members`)
                .set('Authorization', `Bearer ${owner.token}`)
                .send({
                    email: newMember.user.email,
                    role: 'Editor'
                })
                .expect(201);

            expect(addRes.body).toHaveProperty('status', 'success');
            expect(addRes.body.data.member.email).toBe(newMember.user.email);

            // 2. Fetch members list
            const listRes = await request(app)
                .get(`/api/projects/${project._id}/members`)
                .set('Authorization', `Bearer ${owner.token}`)
                .expect(200);

            expect(listRes.body.data.members).toHaveLength(2);

            // 3. Remove member
            const removeRes = await request(app)
                .delete(`/api/projects/${project._id}/members/${newMember.user._id}`)
                .set('Authorization', `Bearer ${owner.token}`)
                .expect(200);

            expect(removeRes.body).toHaveProperty('status', 'success');
        });

        it('should prevent removing the project owner from members', async () => {
            const owner = await createTestUser({ email: 'cant_remove_owner@example.com' });
            const project = await Project.create({
                name: 'Immutable Owner Project',
                ownerId: owner.user._id,
                members: [{ userId: owner.user._id, role: 'Admin' }]
            });

            const res = await request(app)
                .delete(`/api/projects/${project._id}/members/${owner.user._id}`)
                .set('Authorization', `Bearer ${owner.token}`)
                .expect(400);

            expect(res.body).toHaveProperty('status', 'error');
            expect(res.body.message).toMatch(/cannot remove owner/i);
        });
    });

    describe('DELETE /api/projects/:id', () => {
        it('should allow owner to delete a project', async () => {
            const { user, token } = await createTestUser();
            const project = await Project.create({
                name: 'To Be Deleted',
                ownerId: user._id,
                members: [{ userId: user._id, role: 'Admin' }]
            });

            const res = await request(app)
                .delete(`/api/projects/${project._id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(res.body).toHaveProperty('status', 'success');
            expect(res.body.message).toMatch(/deleted successfully/i);

            const check = await Project.findById(project._id);
            expect(check).toBeNull();
        });
    });
});
