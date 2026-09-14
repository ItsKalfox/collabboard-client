import request from 'supertest';
import app from '../../app.js';
import { connectDB, clearDatabase, closeDatabase } from '../setup/db.js';
import { createTestUser } from '../helpers/authHelper.js';
import Project from '../../src/models/Project.js';
import Task from '../../src/models/Task.js';

describe('Dashboard Statistics API Integration Tests', () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('Dashboard Metrics & Aggregation Endpoints', () => {
        it('should return user dashboard timeline, ongoing project stats, and teams data', async () => {
            const { user, token } = await createTestUser();
            const project = await Project.create({
                name: 'Dashboard Analytics Project',
                status: 'active',
                category: 'Development',
                ownerId: user._id,
                members: [{ userId: user._id, role: 'Admin' }]
            });

            await Task.create({
                projectId: project._id,
                title: 'Analytics Task',
                status: 'in-progress',
                assigneeId: user._id,
                dueDate: new Date(Date.now() + 86400000)
            });

            // 1. Timeline
            const timelineRes = await request(app)
                .get('/api/dashboard/timeline')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(timelineRes.body).toHaveProperty('status', 'success');
            expect(Array.isArray(timelineRes.body.data)).toBe(true);

            // 2. Ongoing Projects
            const ongoingRes = await request(app)
                .get('/api/dashboard/projects/ongoing')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(ongoingRes.body).toHaveProperty('status', 'success');

            // 3. Teams Progress
            const teamsRes = await request(app)
                .get('/api/dashboard/teams')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(teamsRes.body).toHaveProperty('status', 'success');

            // 4. Recent Projects
            const recentRes = await request(app)
                .get('/api/dashboard/projects/recent')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(recentRes.body).toHaveProperty('status', 'success');
        });
    });
});
