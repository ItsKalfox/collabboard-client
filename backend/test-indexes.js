import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'dns';
import User from './src/models/User.js';
import Project from './src/models/Project.js';
import Task from './src/models/Task.js';
import Attachment from './src/models/Attachment.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

async function inspectIndexes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for read-only index inspection\n');

        const models = [
            { name: 'User', model: User },
            { name: 'Project', model: Project },
            { name: 'Task', model: Task },
            { name: 'Attachment', model: Attachment }
        ];

        for (const { name, model } of models) {
            console.log(`=== ${name} Collection Indexes ===`);
            try {
                const indexes = await model.collection.indexes();
                console.log(JSON.stringify(indexes, null, 2));
            } catch (err) {
                console.log(`Could not fetch collection indexes for ${name}: ${err.message}`);
            }
            console.log(`=== ${name} Schema Defined Indexes ===`);
            console.log(JSON.stringify(model.schema.indexes(), null, 2));
            console.log('');
        }
    } catch (error) {
        console.error('Error during index inspection:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

inspectIndexes();
