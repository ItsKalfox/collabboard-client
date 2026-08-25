import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Attachment from '../models/Attachment.js';
import User from '../models/User.js';

export const getTimeline = async (req, res) => {
    try {
        const userId = req.user.id;
        const projects = await Project.find({
            $or: [{ ownerId: userId }, { 'members.userId': userId }]
        });

        const projectIds = projects.map(p => p._id);
        const tasks = await Task.find({ projectId: { $in: projectIds } }).populate('assigneeId', 'name avatar');

        const formatDuration = (start, end) => {
            if (!start || !end) return 'N/A';
            const diffMs = new Date(end) - new Date(start);
            const diffHours = Math.round(diffMs / (1000 * 60 * 60));
            if (diffHours < 24) return `about ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
            const diffDays = Math.round(diffHours / 24);
            return `about ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
        };

        const timeline = projects.map(project => {
            const projectTasks = tasks
                .filter(t => t.projectId.toString() === project._id.toString())
                .map(task => {
                    return {
                        id: task._id,
                        title: task.title,
                        status: task.status,
                        priority: task.priority,
                        duration: formatDuration(task.createdAt, task.dueDate),
                        startDate: task.createdAt,
                        dueDate: task.dueDate,
                        assignee: task.assigneeId ? {
                            id: task.assigneeId._id,
                            name: task.assigneeId.name,
                            avatar: task.assigneeId.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assigneeId.name)}`
                        } : null
                    };
                });

            return { trackId: project._id, trackName: project.name, tasks: projectTasks };
        });

        res.status(200).json({ status: 'success', data: timeline });
    } catch (error) {
        console.error('Error in getTimeline:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const getOngoingProjectsStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const activeProjects = await Project.find({
            status: 'active',
            $or: [{ ownerId: userId }, { 'members.userId': userId }]
        });
        
        const projectIds = activeProjects.map(p => p._id);
        const tasks = await Task.find({ projectId: { $in: projectIds } });

        let totalSubtasksAll = 0;
        let completedSubtasksAll = 0;
        const categoryStats = {};

        activeProjects.forEach(project => {
            const projectTasks = tasks.filter(t => t.projectId.toString() === project._id.toString());
            let totalSubtasks = 0;
            let completedSubtasks = 0;

            projectTasks.forEach(task => {
                if (task.subtasks && task.subtasks.length > 0) {
                    totalSubtasks += task.subtasks.length;
                    completedSubtasks += task.subtasks.filter(s => s.completed).length;
                } else {
                    totalSubtasks += 1;
                    if (task.status === 'completed' || task.status === 'done') {
                        completedSubtasks += 1;
                    }
                }
            });

            totalSubtasksAll += totalSubtasks;
            completedSubtasksAll += completedSubtasks;

            const category = project.category || 'Other';
            if (!categoryStats[category]) {
                categoryStats[category] = { name: category, totalProjects: 0, completedTasks: 0, totalTasks: 0 };
            }
            categoryStats[category].totalProjects += 1;
            categoryStats[category].totalTasks += totalSubtasks;
            categoryStats[category].completedTasks += completedSubtasks;
        });

        const overallProgress = totalSubtasksAll === 0 ? 0 : Number(((completedSubtasksAll / totalSubtasksAll) * 100).toFixed(1));

        const categoriesArray = Object.values(categoryStats).map(cat => ({
            ...cat,
            progress: cat.totalTasks === 0 ? 0 : Number(((cat.completedTasks / cat.totalTasks) * 100).toFixed(1))
        }));

        res.status(200).json({ status: 'success', data: { overallProgress, categories: categoriesArray } });
    } catch (error) {
        console.error('Error in getOngoingProjectsStats:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const getTeamProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const projects = await Project.find({
            $or: [{ ownerId: userId }, { 'members.userId': userId }]
        });
        
        const relevantUserIds = new Set();
        projects.forEach(p => {
            relevantUserIds.add(p.ownerId.toString());
            p.members.forEach(m => relevantUserIds.add(m.userId.toString()));
        });

        const users = await User.find({ _id: { $in: Array.from(relevantUserIds) } });
        const tasks = await Task.find({ assigneeId: { $in: users.map(u => u._id) } });

        const teamStats = {};

        users.forEach(user => {
            const teamName = user.team || 'Other';
            if (!teamStats[teamName]) {
                teamStats[teamName] = { teamName, members: [], totalTasks: 0, completedTasks: 0, progress: 0 };
            }
            teamStats[teamName].members.push({
                id: user._id,
                name: user.name,
                avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`
            });
        });

        tasks.forEach(task => {
            if (!task.assigneeId) return;
            const assignee = users.find(u => u._id.toString() === task.assigneeId.toString());
            if (assignee) {
                const teamName = assignee.team || 'Other';
                if (teamStats[teamName]) {
                    if (task.subtasks && task.subtasks.length > 0) {
                        teamStats[teamName].totalTasks += task.subtasks.length;
                        teamStats[teamName].completedTasks += task.subtasks.filter(s => s.completed).length;
                    } else {
                        teamStats[teamName].totalTasks += 1;
                        if (task.status === 'completed') {
                            teamStats[teamName].completedTasks += 1;
                        }
                    }
                }
            }
        });

        let overallTotalTasks = 0;
        let overallCompletedTasks = 0;
        let overallActivity = [];

        const teamsArray = Object.values(teamStats).map(team => {
            overallTotalTasks += team.totalTasks;
            overallCompletedTasks += team.completedTasks;
            
            const baseHeight = 20 + (team.completedTasks * 10) + (team.totalTasks * 5);
            const devBarHeights = Array.from({ length: 8 }, (_, i) => {
                 const pseudoRandom = ((team.teamName.charCodeAt(0) || 0) + i) * 17 % 50;
                 return Math.min(100, Math.max(10, baseHeight + pseudoRandom - 25));
            });
            overallActivity = devBarHeights.map((h, i) => Math.min(100, Math.max(overallActivity[i] || 0, h)));

            return {
                ...team,
                progress: team.totalTasks === 0 ? 0 : Number(((team.completedTasks / team.totalTasks) * 100).toFixed(1)),
                devBarHeights: devBarHeights.map(h => Math.min(100, h))
            };
        });

        res.status(200).json({
            status: 'success',
            data: teamsArray,
            overallStats: {
                totalPoints: overallTotalTasks * 10,
                tasksCompleted: overallCompletedTasks,
                activeMembers: relevantUserIds.size,
                activity: overallActivity.map(h => Math.min(100, h))
            }
        });
    } catch (error) {
        console.error('Error in getTeamProgress:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const getRecentFiles = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const projects = await Project.find({
            $or: [{ ownerId: userId }, { 'members.userId': userId }]
        });
        
        const projectIds = projects.map(p => p._id);
        const attachments = await Attachment.find({
            $or: [{ projectId: { $in: projectIds } }, { uploadedBy: userId }]
        }).sort({ uploadedAt: -1 }).populate('uploadedBy', 'name avatar');

        const recentFiles = attachments.map(att => ({
            id: att._id,
            filename: att.filename,
            url: att.url,
            mimeType: att.mimeType,
            size: att.size,
            uploadedAt: att.uploadedAt,
            uploadedBy: att.uploadedBy ? {
                id: att.uploadedBy._id,
                name: att.uploadedBy.name,
                avatar: att.uploadedBy.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(att.uploadedBy.name)}`
            } : null
        }));

        res.status(200).json({ status: 'success', data: recentFiles });
    } catch (error) {
        console.error('Error in getRecentFiles:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const getRecentProjects = async (req, res) => {
    try {
        const userId = req.user.id;
        const projects = await Project.find({
            $or: [{ ownerId: userId }, { 'members.userId': userId }]
        }).sort({ updatedAt: -1 }).limit(3).populate('members.userId', 'name avatar');

        const recentProjects = projects.map(p => ({
            id: p._id,
            name: p.name,
            status: p.status,
            type: p.category && p.category.toLowerCase().includes('design') ? 'figma' : 'code',
            color: p.category && p.category.toLowerCase().includes('design') ? '#a78bfa' : '#34d399',
            updatedAt: p.updatedAt,
            members: p.members.map(m => ({
                id: m.userId ? m.userId._id : m.userId,
                name: m.userId?.name,
                avatar: m.userId?.avatar || ''
            }))
        }));

        res.status(200).json({ status: 'success', data: recentProjects });
    } catch (error) {
        console.error('Error in getRecentProjects:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
