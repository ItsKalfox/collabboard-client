import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'dns';
import User from './src/models/User.js';
import Project from './src/models/Project.js';
import Task from './src/models/Task.js';
import Attachment from './src/models/Attachment.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

function extractPlanDetails(explainResult) {
    const execStats = explainResult.executionStats || {};
    const queryPlanner = explainResult.queryPlanner || {};
    const winningPlan = queryPlanner.winningPlan || {};

    const findStagesAndIndexes = (node, accumulator = { stages: [], indexes: [] }) => {
        if (!node) return accumulator;
        if (node.stage) accumulator.stages.push(node.stage);
        if (node.indexName) accumulator.indexes.push(node.indexName);
        if (node.inputStage) findStagesAndIndexes(node.inputStage, accumulator);
        if (node.inputStages) node.inputStages.forEach(s => findStagesAndIndexes(s, accumulator));
        return accumulator;
    };

    const { stages, indexes } = findStagesAndIndexes(winningPlan);
    const uniqueIndexes = [...new Set(indexes)];
    const hasCollscan = stages.includes('COLLSCAN');

    return {
        stage: winningPlan.stage || 'UNKNOWN',
        allStages: stages,
        indexesUsed: uniqueIndexes.length > 0 ? uniqueIndexes.join(', ') : 'None (COLLSCAN)',
        hasCollscan,
        nReturned: execStats.nReturned ?? 0,
        totalDocsExamined: execStats.totalDocsExamined ?? 0,
        totalKeysExamined: execStats.totalKeysExamined ?? 0,
        executionTimeMillis: execStats.executionTimeMillis ?? 0
    };
}

async function runExplainAnalysis() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for Explain Analysis\n');

        const sampleUser = await User.findOne();
        const sampleProject = await Project.findOne();
        const sampleTask = await Task.findOne();
        const sampleAttachment = await Attachment.findOne();
        const sampleProjects = await Project.find().limit(3);
        const sampleUsers = await User.find().limit(3);
        const taskWithSubtask = await Task.findOne({ 'subtasks.0': { $exists: true } });

        const userId = sampleUser?._id || new mongoose.Types.ObjectId();
        const userEmail = sampleUser?.email || 'test@example.com';
        const projectId = sampleProject?._id || new mongoose.Types.ObjectId();
        const projectIds = sampleProjects.map(p => p._id);
        const userIds = sampleUsers.map(u => u._id);
        const taskId = sampleTask?._id || new mongoose.Types.ObjectId();
        const subtaskId = taskWithSubtask?.subtasks?.[0]?._id || new mongoose.Types.ObjectId();

        const queries = [
            {
                name: 'Q1: Project.find by Owner or Member ($or)',
                controller: 'projectController / dashboardController',
                fn: (hint) => {
                    const q = Project.find({ $or: [{ ownerId: userId }, { 'members.userId': userId }] });
                    if (hint) q.hint(hint);
                    return q.explain('executionStats');
                }
            },
            {
                name: 'Q2: Project.find Active Projects ($or + status)',
                controller: 'dashboardController (getOngoingProjectsStats)',
                fn: (hint) => {
                    const q = Project.find({ status: 'active', $or: [{ ownerId: userId }, { 'members.userId': userId }] });
                    if (hint) q.hint(hint);
                    return q.explain('executionStats');
                }
            },
            {
                name: 'Q3: Project.find Recent Projects ($or + sort updatedAt: -1)',
                controller: 'dashboardController (getRecentProjects)',
                fn: (hint) => {
                    const q = Project.find({ $or: [{ ownerId: userId }, { 'members.userId': userId }] }).sort({ updatedAt: -1 }).limit(3);
                    if (hint) q.hint(hint);
                    return q.explain('executionStats');
                }
            },
            {
                name: 'Q4: Task.find by projectId ($in array)',
                controller: 'projectController / dashboardController',
                fn: (hint) => {
                    const q = Task.find({ projectId: { $in: projectIds } });
                    if (hint) q.hint(hint);
                    return q.explain('executionStats');
                }
            },
            {
                name: 'Q5: Task.find by single projectId',
                controller: 'taskController (getTasksByProject)',
                fn: (hint) => {
                    const q = Task.find({ projectId });
                    if (hint) q.hint(hint);
                    return q.explain('executionStats');
                }
            },
            {
                name: 'Q6: Task.find by projectId + sort createdAt: -1',
                controller: 'projectController (getProjectTimeline)',
                fn: (hint) => {
                    const q = Task.find({ projectId }).sort({ createdAt: -1 }).limit(20);
                    if (hint) q.hint(hint);
                    return q.explain('executionStats');
                }
            },
            {
                name: 'Q7: Task.find by projectId ($in) + assigneeId',
                controller: 'dashboardController (getTimeline)',
                fn: (hint) => {
                    const q = Task.find({ projectId: { $in: projectIds }, assigneeId: userId });
                    if (hint) q.hint(hint);
                    return q.explain('executionStats');
                }
            },
            {
                name: 'Q8: Task.find by assigneeId ($in array)',
                controller: 'dashboardController (getTeamProgress)',
                fn: (hint) => {
                    const q = Task.find({ assigneeId: { $in: userIds } });
                    if (hint) q.hint(hint);
                    return q.explain('executionStats');
                }
            },
            {
                name: 'Q9: Task.findOne by subtasks._id',
                controller: 'subtaskController (update/deleteSubtask)',
                fn: (hint) => {
                    const q = Task.findOne({ 'subtasks._id': subtaskId });
                    if (hint) q.hint(hint);
                    return q.explain('executionStats');
                }
            },
            {
                name: 'Q10: Attachment.find by projectId',
                controller: 'projectController (getAttachments)',
                fn: (hint) => {
                    const q = Attachment.find({ projectId });
                    if (hint) q.hint(hint);
                    return q.explain('executionStats');
                }
            },
            {
                name: 'Q11: Attachment.find by taskId',
                controller: 'taskController (getTaskAttachments)',
                fn: (hint) => {
                    const q = Attachment.find({ taskId });
                    if (hint) q.hint(hint);
                    return q.explain('executionStats');
                }
            },
            {
                name: 'Q12: Attachment.find Recent Files ($or + sort uploadedAt: -1)',
                controller: 'dashboardController (getRecentFiles)',
                fn: (hint) => {
                    const q = Attachment.find({ $or: [{ projectId: { $in: projectIds } }, { uploadedBy: userId }] }).sort({ uploadedAt: -1 });
                    if (hint) q.hint(hint);
                    return q.explain('executionStats');
                }
            },
            {
                name: 'Q13: User.findOne by email',
                controller: 'authController (loginUser, registerUser, etc.)',
                fn: (hint) => {
                    const q = User.findOne({ email: userEmail });
                    if (hint) q.hint(hint);
                    return q.explain('executionStats');
                }
            }
        ];

        for (const item of queries) {
            console.log(`========================================================================`);
            console.log(`QUERY: ${item.name}`);
            console.log(`SOURCE: ${item.controller}`);
            console.log(`------------------------------------------------------------------------`);
            
            // Indexed run
            const indexedExplain = await item.fn();
            const indexedDetails = extractPlanDetails(indexedExplain);

            // Unindexed run (hint natural scan)
            let unindexedDetails;
            try {
                const unindexedExplain = await item.fn({ $natural: 1 });
                unindexedDetails = extractPlanDetails(unindexedExplain);
            } catch (e) {
                unindexedDetails = { error: e.message };
            }

            console.log(`[INDEXED PLAN]`);
            console.log(`  Index Used     : ${indexedDetails.indexesUsed}`);
            console.log(`  Winning Stage  : ${indexedDetails.stage} (Stages: ${indexedDetails.allStages.join(' -> ')})`);
            console.log(`  Keys Examined  : ${indexedDetails.totalKeysExamined}`);
            console.log(`  Docs Examined  : ${indexedDetails.totalDocsExamined}`);
            console.log(`  Docs Returned  : ${indexedDetails.nReturned}`);
            console.log(`  COLLSCAN       : ${indexedDetails.hasCollscan ? 'YES' : 'NO'}`);
            
            if (!unindexedDetails.error) {
                console.log(`[UNINDEXED BASELINE (COLLSCAN simulation)]`);
                console.log(`  Winning Stage  : ${unindexedDetails.stage} (Stages: ${unindexedDetails.allStages.join(' -> ')})`);
                console.log(`  Keys Examined  : ${unindexedDetails.totalKeysExamined}`);
                console.log(`  Docs Examined  : ${unindexedDetails.totalDocsExamined}`);
                console.log(`  Docs Returned  : ${unindexedDetails.nReturned}`);
                console.log(`  COLLSCAN       : ${unindexedDetails.hasCollscan ? 'YES' : 'NO'}`);
            }
            console.log('');
        }

    } catch (error) {
        console.error('Error during explain analysis:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

runExplainAnalysis();
