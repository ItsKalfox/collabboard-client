import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/authRoutes.js';
import cloudinaryRoutes from './src/routes/cloudinaryRoutes.js';
import projectRoutes from './src/routes/projectRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import subtaskRoutes from './src/routes/subtaskRoutes.js';
import attachmentRoutes from './src/routes/attachmentRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    exposedHeaders: ['Content-Disposition', 'Content-Type']
}));
app.use(express.json({ strict: false }));

// Middleware to handle JSON parse errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid JSON payload format'
        });
    }
    next(err);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cloudinary', cloudinaryRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/subtasks', subtaskRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1);
        return res.status(409).json({
            status: 'error',
            message: `${capitalizedField} already exists`
        });
    }

    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error'
    });
});

export default app;
