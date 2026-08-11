import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/authRoutes.js';
import cloudinaryRoutes from './src/routes/cloudinaryRoutes.js';
import projectRoutes from './src/routes/projectRoutes.js'; //added
import userRoutes from './src/routes/userRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cloudinary', cloudinaryRoutes);
app.use('/api/projects', projectRoutes); //added
app.use('/api/users', userRoutes);

export default app;
