import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export const initIO = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*", // allow all or use process.env.FRONTEND_URL
            methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
        }
    });

    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication error: Token required'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_12345');
            socket.user = decoded; // Attach user info to socket
            next();
        } catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}, User: ${socket.user?.id}`);

        // Join project board room
        socket.on('join_board', (projectId) => {
            if (projectId) {
                socket.join(`board-${projectId}`);
                console.log(`Socket ${socket.id} joined board-${projectId}`);
            }
        });

        // Leave project board room
        socket.on('leave_board', (projectId) => {
            if (projectId) {
                socket.leave(`board-${projectId}`);
                console.log(`Socket ${socket.id} left board-${projectId}`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
