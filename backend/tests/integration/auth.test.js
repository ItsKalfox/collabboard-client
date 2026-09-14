import request from 'supertest';
import app from '../../app.js';
import { connectDB, clearDatabase, closeDatabase } from '../setup/db.js';
import { createTestUser } from '../helpers/authHelper.js';

describe('Auth API Integration Tests', () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('POST /api/auth/register', () => {
        it('should successfully register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'John Doe',
                    email: 'john@example.com',
                    password: 'SecurePassword123!'
                })
                .expect(201);

            expect(res.body).toHaveProperty('status', 'success');
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.name).toBe('John Doe');
            expect(res.body.data.email).toBe('john@example.com');
            expect(res.body.data).not.toHaveProperty('password');
        });

        it('should return 400 Bad Request when required fields are missing', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'incomplete@example.com'
                })
                .expect(400);

            expect(res.body).toHaveProperty('status', 'error');
            expect(res.body.message).toMatch(/required/i);
        });

        it('should return 409 Conflict when attempting to register an existing email', async () => {
            await createTestUser({ email: 'duplicate@example.com' });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Duplicate User',
                    email: 'duplicate@example.com',
                    password: 'Password123!'
                })
                .expect(409);

            expect(res.body).toHaveProperty('status', 'error');
            expect(res.body.message).toMatch(/already/i);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should successfully authenticate a user with valid credentials', async () => {
            const { user, rawPassword } = await createTestUser({
                email: 'login@example.com',
                plainPassword: 'ValidPassword123!'
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: rawPassword
                })
                .expect(200);

            expect(res.body).toHaveProperty('status', 'success');
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data.user.email).toBe(user.email);
        });

        it('should return 401 Unauthorized with incorrect password', async () => {
            await createTestUser({
                email: 'wrongpass@example.com',
                plainPassword: 'CorrectPassword123!'
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'wrongpass@example.com',
                    password: 'WrongPassword999!'
                })
                .expect(401);

            expect(res.body).toHaveProperty('status', 'error');
            expect(res.body.message).toMatch(/invalid credentials/i);
        });

        it('should return 401 Unauthorized for non-existent user email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'doesnotexist@example.com',
                    password: 'Password123!'
                })
                .expect(401);

            expect(res.body).toHaveProperty('status', 'error');
            expect(res.body.message).toMatch(/invalid credentials/i);
        });

        it('should return 400 Bad Request when login credentials are missing', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({})
                .expect(400);

            expect(res.body).toHaveProperty('status', 'error');
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return current user profile when valid authorization token is provided', async () => {
            const { user, token } = await createTestUser({ name: 'Session User' });

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(res.body).toHaveProperty('status', 'success');
            expect(res.body.data.user.id).toBe(user._id.toString());
            expect(res.body.data.user.name).toBe('Session User');
            expect(res.body.data.user.email).toBe(user.email);
        });

        it('should return 401 Unauthorized when request lacks authorization token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .expect(401);

            expect(res.body).toHaveProperty('status', 'error');
            expect(res.body.message).toMatch(/token is required/i);
        });
    });
});
