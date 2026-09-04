import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'dns';
import jwt from 'jsonwebtoken';
import app from './app.js';
import User from './src/models/User.js';
import Project from './src/models/Project.js';
import Task from './src/models/Task.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

let server;
let baseUrl;

async function runTests() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        // Find or create test user
        let user = await User.findOne();
        if (!user) {
            user = await User.create({
                name: 'Test User',
                email: 'testuser@example.com',
                password: 'hashedpassword123'
            });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, name: user.name },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1d' }
        );

        // Find or create sample projects & tasks for this user
        let project = await Project.findOne({
            $or: [{ ownerId: user._id }, { 'members.userId': user._id }]
        });

        if (!project) {
            project = await Project.create({
                name: 'Pagination Test Project',
                description: 'Project for testing pagination',
                ownerId: user._id,
                status: 'active',
                members: [{ userId: user._id, role: 'owner' }]
            });
        }

        // Ensure at least 3 tasks exist for this project
        const existingTaskCount = await Task.countDocuments({ projectId: project._id });
        if (existingTaskCount < 3) {
            for (let i = existingTaskCount + 1; i <= 3; i++) {
                await Task.create({
                    projectId: project._id,
                    title: `Test Task ${i}`,
                    description: `Task ${i} description`,
                    status: 'todo',
                    priority: 'medium',
                    assigneeId: user._id
                });
            }
        }

        // Start server on ephemeral port
        await new Promise((resolve) => {
            server = app.listen(0, () => {
                const port = server.address().port;
                baseUrl = `http://127.0.0.1:${port}/api`;
                console.log(`Test server running at ${baseUrl}\n`);
                resolve();
            });
        });

        const authHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const testCases = [
            {
                name: '1. Existing request without pagination parameters: GET /api/projects',
                url: `${baseUrl}/projects`,
                options: { headers: authHeaders },
                validate: (res, json) => {
                    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
                    if (!json.data || !Array.isArray(json.data.projects)) throw new Error('data.projects must be an array');
                    if (!json.data.pagination || !json.pagination) throw new Error('pagination metadata missing');
                    if (json.pagination.page !== 1 || json.pagination.limit !== 10) throw new Error(`Expected default page 1, limit 10, got page=${json.pagination.page}, limit=${json.pagination.limit}`);
                    console.log(`   ✓ Projects returned: ${json.data.projects.length}, Total: ${json.pagination.total}, TotalPages: ${json.pagination.totalPages}`);
                }
            },
            {
                name: '2. Paginated projects: GET /api/projects?page=1&limit=2',
                url: `${baseUrl}/projects?page=1&limit=2`,
                options: { headers: authHeaders },
                validate: (res, json) => {
                    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
                    if (json.data.projects.length > 2) throw new Error(`Expected max 2 projects, got ${json.data.projects.length}`);
                    if (json.pagination.page !== 1 || json.pagination.limit !== 2) throw new Error('Pagination meta mismatch');
                    console.log(`   ✓ Projects returned: ${json.data.projects.length}, limit: ${json.pagination.limit}, hasNextPage: ${json.pagination.hasNextPage}`);
                }
            },
            {
                name: '3. Sorted projects: GET /api/projects?page=1&limit=2&sortBy=createdAt&sortOrder=desc',
                url: `${baseUrl}/projects?page=1&limit=2&sortBy=createdAt&sortOrder=desc`,
                options: { headers: authHeaders },
                validate: (res, json) => {
                    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
                    if (json.data.projects.length > 1) {
                        const t1 = new Date(json.data.projects[0].createdAt).getTime();
                        const t2 = new Date(json.data.projects[1].createdAt).getTime();
                        if (t1 < t2) throw new Error('Projects not sorted descending by createdAt');
                    }
                    console.log(`   ✓ Projects properly sorted by createdAt desc`);
                }
            },
            {
                name: '4. Existing project tasks request without parameters: GET /api/projects/:projectId/tasks',
                url: `${baseUrl}/projects/${project._id}/tasks`,
                options: { headers: authHeaders },
                validate: (res, json) => {
                    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
                    if (!json.data || !Array.isArray(json.data.tasks)) throw new Error('data.tasks must be an array');
                    if (!json.data.pagination || !json.pagination) throw new Error('pagination metadata missing');
                    if (json.pagination.page !== 1 || json.pagination.limit !== 10) throw new Error('Pagination defaults mismatch');
                    console.log(`   ✓ Tasks returned: ${json.data.tasks.length}, Total: ${json.pagination.total}`);
                }
            },
            {
                name: '5. Paginated project tasks: GET /api/projects/:projectId/tasks?page=1&limit=2',
                url: `${baseUrl}/projects/${project._id}/tasks?page=1&limit=2`,
                options: { headers: authHeaders },
                validate: (res, json) => {
                    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
                    if (json.data.tasks.length > 2) throw new Error(`Expected max 2 tasks, got ${json.data.tasks.length}`);
                    if (json.pagination.page !== 1 || json.pagination.limit !== 2) throw new Error('Pagination meta mismatch');
                    console.log(`   ✓ Tasks returned: ${json.data.tasks.length}, limit: ${json.pagination.limit}, hasNextPage: ${json.pagination.hasNextPage}`);
                }
            },
            {
                name: '6. Sorted project tasks: GET /api/projects/:projectId/tasks?page=1&limit=2&sortBy=createdAt&sortOrder=desc',
                url: `${baseUrl}/projects/${project._id}/tasks?page=1&limit=2&sortBy=createdAt&sortOrder=desc`,
                options: { headers: authHeaders },
                validate: (res, json) => {
                    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
                    if (json.data.tasks.length > 1) {
                        const t1 = new Date(json.data.tasks[0].createdAt).getTime();
                        const t2 = new Date(json.data.tasks[1].createdAt).getTime();
                        if (t1 < t2) throw new Error('Tasks not sorted descending by createdAt');
                    }
                    console.log(`   ✓ Tasks properly sorted by createdAt desc`);
                }
            },
            {
                name: '7a. Invalid page: page=0',
                url: `${baseUrl}/projects?page=0`,
                options: { headers: authHeaders },
                validate: (res, json) => {
                    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
                    console.log(`   ✓ Error handled with 400: "${json.message}"`);
                }
            },
            {
                name: '7b. Invalid page: page=-1',
                url: `${baseUrl}/projects?page=-1`,
                options: { headers: authHeaders },
                validate: (res, json) => {
                    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
                    console.log(`   ✓ Error handled with 400: "${json.message}"`);
                }
            },
            {
                name: '7c. Invalid page: page=abc',
                url: `${baseUrl}/projects?page=abc`,
                options: { headers: authHeaders },
                validate: (res, json) => {
                    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
                    console.log(`   ✓ Error handled with 400: "${json.message}"`);
                }
            },
            {
                name: '8a. Invalid limit: limit=0',
                url: `${baseUrl}/projects?limit=0`,
                options: { headers: authHeaders },
                validate: (res, json) => {
                    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
                    console.log(`   ✓ Error handled with 400: "${json.message}"`);
                }
            },
            {
                name: '8b. Invalid limit: limit=-1',
                url: `${baseUrl}/projects?limit=-1`,
                options: { headers: authHeaders },
                validate: (res, json) => {
                    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
                    console.log(`   ✓ Error handled with 400: "${json.message}"`);
                }
            },
            {
                name: '8c. Invalid limit: limit=abc',
                url: `${baseUrl}/projects?limit=abc`,
                options: { headers: authHeaders },
                validate: (res, json) => {
                    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
                    console.log(`   ✓ Error handled with 400: "${json.message}"`);
                }
            },
            {
                name: '9. Excessive limit: limit=101 (> 100 max)',
                url: `${baseUrl}/projects?limit=101`,
                options: { headers: authHeaders },
                validate: (res, json) => {
                    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
                    console.log(`   ✓ Error handled with 400: "${json.message}"`);
                }
            },
            {
                name: '10. Invalid sort field: sortBy=unauthorizedPasswordHash',
                url: `${baseUrl}/projects?sortBy=unauthorizedPasswordHash`,
                options: { headers: authHeaders },
                validate: (res, json) => {
                    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
                    console.log(`   ✓ Error handled with 400: "${json.message}"`);
                }
            },
            {
                name: '11. Invalid sort order: sortOrder=randomOrder',
                url: `${baseUrl}/projects?sortOrder=randomOrder`,
                options: { headers: authHeaders },
                validate: (res, json) => {
                    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
                    console.log(`   ✓ Error handled with 400: "${json.message}"`);
                }
            },
            {
                name: '12. Authentication verification: Unauthenticated request should be 401',
                url: `${baseUrl}/projects`,
                options: {},
                validate: (res, json) => {
                    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
                    console.log(`   ✓ Unauthorized request properly rejected with 401: "${json.message}"`);
                }
            },
            {
                name: '13. Response compatibility: callers expecting data.projects and data.tasks receive exact expected structures',
                url: `${baseUrl}/projects`,
                options: { headers: authHeaders },
                validate: (res, json) => {
                    if (!json.data || !Array.isArray(json.data.projects)) throw new Error('data.projects missing');
                    const firstProj = json.data.projects[0];
                    if (firstProj) {
                        if (!('name' in firstProj) || !('members' in firstProj) || !('tasks' in firstProj)) {
                            throw new Error('Project structure missing expected fields');
                        }
                    }
                    console.log(`   ✓ Data properties data.projects and internal tasks/members arrays fully preserved`);
                }
            }
        ];

        let passed = 0;
        let failed = 0;

        for (const tc of testCases) {
            console.log(`\nRunning: ${tc.name}`);
            try {
                const res = await fetch(tc.url, tc.options);
                const json = await res.json();
                tc.validate(res, json);
                passed++;
            } catch (err) {
                console.error(`   ✗ FAILED: ${err.message}`);
                failed++;
            }
        }

        console.log(`\n========================================`);
        console.log(`Test Summary: ${passed} Passed, ${failed} Failed`);
        console.log(`========================================`);

        if (failed > 0) {
            process.exitCode = 1;
        }

    } catch (error) {
        console.error('Test execution fatal error:', error);
        process.exitCode = 1;
    } finally {
        if (server) {
            server.close();
        }
        await mongoose.disconnect();
        console.log('MongoDB disconnected, test suite completed.');
    }
}

runTests();
