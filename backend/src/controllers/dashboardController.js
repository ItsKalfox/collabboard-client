import mongoose from 'mongoose';
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
        const tasks = await Task.find({ projectId: { $in: projectIds }, assigneeId: userId }).populate('assigneeId', 'name avatar');

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
        const userObjId = new mongoose.Types.ObjectId(userId);

        const stats = await Project.aggregate([
            {
                $match: {
                    status: 'active',
                    $or: [{ ownerId: userObjId }, { 'members.userId': userObjId }]
                }
            },
            {
                $lookup: {
                    from: 'tasks',
                    localField: '_id',
                    foreignField: 'projectId',
                    as: 'tasks'
                }
            },
            {
                $project: {
                    category: {
                        $cond: [
                            {
                                $or: [
                                    { $eq: ['$category', null] },
                                    { $eq: [{ $type: '$category' }, 'missing'] },
                                    { $eq: ['$category', ''] },
                                    { $eq: [{ $trim: { input: { $ifNull: ['$category', ''] } } }, ''] }
                                ]
                            },
                            'Other',
                            '$category'
                        ]
                    },
                    computedTasks: {
                        $map: {
                            input: '$tasks',
                            as: 'task',
                            in: {
                                status: {
                                    $let: {
                                        vars: { rawStatus: { $toLower: { $ifNull: ['$$task.status', 'todo'] } } },
                                        in: {
                                            $cond: [
                                                { $eq: ['$$rawStatus', 'done'] },
                                                'completed',
                                                {
                                                    $cond: [
                                                        { $in: ['$$rawStatus', ['todo', 'in_progress', 'review', 'completed']] },
                                                        '$$rawStatus',
                                                        'todo'
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                },
                                totalUnits: {
                                    $cond: [
                                        { $gt: [{ $size: { $ifNull: ['$$task.subtasks', []] } }, 0] },
                                        { $size: { $ifNull: ['$$task.subtasks', []] } },
                                        1
                                    ]
                                },
                                completedUnits: {
                                    $cond: [
                                        { $gt: [{ $size: { $ifNull: ['$$task.subtasks', []] } }, 0] },
                                        {
                                            $size: {
                                                $filter: {
                                                    input: { $ifNull: ['$$task.subtasks', []] },
                                                    as: 'st',
                                                    cond: { $eq: ['$$st.completed', true] }
                                                }
                                            }
                                        },
                                        {
                                            $cond: [
                                                {
                                                    $in: [
                                                        { $toLower: { $ifNull: ['$$task.status', 'todo'] } },
                                                        ['completed', 'done']
                                                    ]
                                                },
                                                1,
                                                0
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    category: 1,
                    computedTasks: 1,
                    projectTotalTasks: { $sum: '$computedTasks.totalUnits' },
                    projectCompletedTasks: { $sum: '$computedTasks.completedUnits' }
                }
            },
            {
                $facet: {
                    categories: [
                        {
                            $group: {
                                _id: '$category',
                                totalProjects: { $sum: 1 },
                                totalTasks: { $sum: '$projectTotalTasks' },
                                completedTasks: { $sum: '$projectCompletedTasks' }
                            }
                        }
                    ],
                    tasks: [
                        { $unwind: '$computedTasks' },
                        {
                            $group: {
                                _id: '$computedTasks.status',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    totals: [
                        {
                            $group: {
                                _id: null,
                                totalSubtasksAll: { $sum: '$projectTotalTasks' },
                                completedSubtasksAll: { $sum: '$projectCompletedTasks' }
                            }
                        }
                    ]
                }
            }
        ]);

        const result = stats[0] || { categories: [], tasks: [], totals: [] };

        const totalSubtasksAll = result.totals[0]?.totalSubtasksAll || 0;
        const completedSubtasksAll = result.totals[0]?.completedSubtasksAll || 0;

        const overallProgress = totalSubtasksAll === 0 ? 0 : Number(((completedSubtasksAll / totalSubtasksAll) * 100).toFixed(1));

        const categoriesArray = (result.categories || []).map(cat => ({
            name: cat._id,
            totalProjects: cat.totalProjects,
            completedTasks: cat.completedTasks,
            totalTasks: cat.totalTasks,
            progress: cat.totalTasks === 0 ? 0 : Number(((cat.completedTasks / cat.totalTasks) * 100).toFixed(1))
        }));

        const statusStats = {
            todo: 0,
            in_progress: 0,
            review: 0,
            completed: 0
        };

        (result.tasks || []).forEach(t => {
            if (statusStats[t._id] !== undefined) {
                statusStats[t._id] = t.count;
            } else {
                statusStats.todo += t.count;
            }
        });

        res.status(200).json({
            status: 'success',
            data: {
                overallProgress,
                categories: categoriesArray,
                statusStats
            }
        });
    } catch (error) {
        console.error('Error in getOngoingProjectsStats:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const getTeamProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const userObjId = new mongoose.Types.ObjectId(userId);
        const { projectId } = req.query;

        let projectMatch = {
            $or: [{ ownerId: userObjId }, { 'members.userId': userObjId }]
        };

        if (projectId) {
            if (mongoose.Types.ObjectId.isValid(projectId)) {
                projectMatch._id = new mongoose.Types.ObjectId(projectId);
            } else {
                return res.status(200).json({
                    status: 'success',
                    data: [],
                    overallStats: {
                        totalPoints: 0,
                        tasksCompleted: 0,
                        activeMembers: 0
                    }
                });
            }
        }

        // Aggregate to find accessible projects and their members
        const accessibleProjects = await Project.aggregate([
            { $match: projectMatch },
            {
                $project: {
                    _id: 1,
                    memberIds: {
                        $concatArrays: [
                            ['$ownerId'],
                            {
                                $map: {
                                    input: { $ifNull: ['$members', []] },
                                    as: 'm',
                                    in: '$$m.userId'
                                }
                            }
                        ]
                    }
                }
            }
        ]);

        if (!accessibleProjects || accessibleProjects.length === 0) {
            return res.status(200).json({
                status: 'success',
                data: [],
                overallStats: {
                    totalPoints: 0,
                    tasksCompleted: 0,
                    activeMembers: 0
                }
            });
        }

        const accessibleProjectIds = accessibleProjects.map(p => p._id);
        const allMemberIdsSet = new Set();
        accessibleProjects.forEach(p => {
            (p.memberIds || []).forEach(mid => {
                if (mid) allMemberIdsSet.add(mid.toString());
            });
        });

        const memberObjectIds = Array.from(allMemberIdsSet).map(id => new mongoose.Types.ObjectId(id));

        if (memberObjectIds.length === 0) {
            return res.status(200).json({
                status: 'success',
                data: [],
                overallStats: {
                    totalPoints: 0,
                    tasksCompleted: 0,
                    activeMembers: 0
                }
            });
        }

        const membersAggregation = await User.aggregate([
            { $match: { _id: { $in: memberObjectIds } } },
            {
                $lookup: {
                    from: 'tasks',
                    let: { uid: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$assigneeId', '$$uid'] },
                                        { $in: ['$projectId', accessibleProjectIds] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                totalUnits: {
                                    $cond: [
                                        { $gt: [{ $size: { $ifNull: ['$subtasks', []] } }, 0] },
                                        { $size: { $ifNull: ['$subtasks', []] } },
                                        1
                                    ]
                                },
                                completedUnits: {
                                    $cond: [
                                        { $gt: [{ $size: { $ifNull: ['$subtasks', []] } }, 0] },
                                        {
                                            $size: {
                                                $filter: {
                                                    input: { $ifNull: ['$subtasks', []] },
                                                    as: 'st',
                                                    cond: { $eq: ['$$st.completed', true] }
                                                }
                                            }
                                        },
                                        {
                                            $cond: [
                                                {
                                                    $in: [
                                                        { $toLower: { $ifNull: ['$status', 'todo'] } },
                                                        ['completed', 'done']
                                                    ]
                                                },
                                                1,
                                                0
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalTasks: { $sum: '$totalUnits' },
                                completedTasks: { $sum: '$completedUnits' }
                            }
                        }
                    ],
                    as: 'taskStats'
                }
            },
            {
                $project: {
                    id: '$_id',
                    name: 1,
                    avatar: 1,
                    stats: { $arrayElemAt: ['$taskStats', 0] }
                }
            },
            {
                $project: {
                    id: 1,
                    name: 1,
                    avatar: 1,
                    totalTasks: { $ifNull: ['$stats.totalTasks', 0] },
                    completedTasks: { $ifNull: ['$stats.completedTasks', 0] }
                }
            },
            {
                $sort: { totalTasks: -1 }
            }
        ]);

        let overallTotalTasks = 0;
        let overallCompletedTasks = 0;

        const membersArray = membersAggregation.map(member => {
            overallTotalTasks += member.totalTasks;
            overallCompletedTasks += member.completedTasks;

            return {
                id: member.id,
                name: member.name,
                avatar: member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`,
                totalTasks: member.totalTasks,
                completedTasks: member.completedTasks,
                progress: member.totalTasks === 0 ? 0 : Number(((member.completedTasks / member.totalTasks) * 100).toFixed(1))
            };
        });

        res.status(200).json({
            status: 'success',
            data: membersArray,
            overallStats: {
                totalPoints: overallTotalTasks * 10,
                tasksCompleted: overallCompletedTasks,
                activeMembers: relevantUserIds.size
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
