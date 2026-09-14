import request from 'supertest';
import app from '../../app.js';
import { connectDB, clearDatabase, closeDatabase } from '../setup/db.js';

describe('Health Check & Server Middleware Tests', () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('GET /api/health', () => {
        it('should return 200 and database connected status', async () => {
            const res = await request(app)
                .get('/api/health')
                .expect(200);

            expect(res.body).toHaveProperty('status', 'ok');
            expect(res.body).toHaveProperty('database', 'connected');
        });
    });

    describe('JSON Parsing & Middleware Error Handling', () => {
        it('should handle malformed JSON payloads gracefully with 400 Bad Request', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .set('Content-Type', 'application/json')
                .send('{"email": "bad json", invalid}')
                .expect(400);

            expect(res.body).toHaveProperty('status', 'error');
            expect(res.body.message).toMatch(/invalid json/i);
        });

        it('should return 404 for undefined endpoints', async () => {
            const res = await request(app)
                .get('/api/unknown-non-existent-route-xyz')
                .expect(404);

            expect(res.status).toBe(404);
        });
    });
});
