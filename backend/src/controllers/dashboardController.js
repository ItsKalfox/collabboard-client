import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../data');

export const getTimeline = async (req, res) => {
    try {
        const userId = req.user.id;
        const tasksData = await fs.readFile(path.join(dataDir, 'mockTasks.json'), 'utf-8');
        const projectsData = await fs.readFile(path.join(dataDir, 'mockProjects.json'), 'utf-8');
        const usersData = await fs.readFile(path.join(dataDir, 'mockData.json'), 'utf-8');

        const tasks = JSON.parse(tasksData);
        let projects = JSON.parse(projectsData);
        const users = JSON.parse(usersData);

        // Filter projects to only those accessible by the user
        let userProjects = projects.filter(p => p.ownerId === userId || p.members.some(m => m.userId === userId));
        if (userProjects.length === 0) {
            userProjects = JSON.parse(projectsData).slice(0, 3); // Fallback starter data
        }

        const formatDuration = (start, end) => {
            const diffMs = new Date(end) - new Date(start);
            const diffHours = Math.round(diffMs / (1000 * 60 * 60));
            if (diffHours < 24) {
                return `about ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
            }
            const diffDays = Math.round(diffHours / 24);
            return `about ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
        };

        const timeline = userProjects.map(project => {
            const projectTasks = tasks
                .filter(t => t.projectId === project.id)
                .map(task => {
                    const assignee = users.find(u => u.id === task.assigneeId);
                    return {
                        id: task.id,
                        title: task.title,
                        status: task.status,
                        priority: task.priority,
                        duration: formatDuration(task.createdAt, task.dueDate),
                        startDate: task.createdAt,
                        dueDate: task.dueDate,
                        assignee: assignee ? {
                            id: assignee.id,
                            name: assignee.name,
                            avatar: assignee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignee.name)}`
                        } : null
                    };
                });

            return {
                trackId: project.id,
                trackName: project.name,
                tasks: projectTasks
            };
        });

        res.status(200).json({
            status: 'success',
            data: timeline
        });
    } catch (error) {
        console.error('Error in getTimeline:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const getOngoingProjectsStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const tasksData = await fs.readFile(path.join(dataDir, 'mockTasks.json'), 'utf-8');
        const projectsData = await fs.readFile(path.join(dataDir, 'mockProjects.json'), 'utf-8');

        const tasks = JSON.parse(tasksData);
        const allProjects = JSON.parse(projectsData);

        // Filter to active projects accessible by the user
        let userProjects = allProjects.filter(p => p.ownerId === userId || p.members.some(m => m.userId === userId));
        if (userProjects.length === 0) {
            userProjects = allProjects.slice(0, 3); // Fallback starter data
        }
        const activeProjects = userProjects.filter(p => p.status === 'active');
        
        let totalSubtasksAll = 0;
        let completedSubtasksAll = 0;
        const categoryStats = {};

        activeProjects.forEach(project => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            let totalSubtasks = 0;
            let completedSubtasks = 0;

            projectTasks.forEach(task => {
                if (task.subtasks && task.subtasks.length > 0) {
                    totalSubtasks += task.subtasks.length;
                    completedSubtasks += task.subtasks.filter(s => s.completed).length;
                }
            });

            totalSubtasksAll += totalSubtasks;
            completedSubtasksAll += completedSubtasks;

            const category = project.category || 'Other';
            if (!categoryStats[category]) {
                categoryStats[category] = {
                    name: category,
                    totalProjects: 0,
                    completedTasks: 0,
                    totalTasks: 0
                };
            }

            categoryStats[category].totalProjects += 1;
            categoryStats[category].totalTasks += totalSubtasks;
            categoryStats[category].completedTasks += completedSubtasks;
        });

        const overallProgress = totalSubtasksAll === 0 ? 0 : Number(((completedSubtasksAll / totalSubtasksAll) * 100).toFixed(1));

        const categoriesArray = Object.values(categoryStats).map(cat => {
            const progress = cat.totalTasks === 0 ? 0 : Number(((cat.completedTasks / cat.totalTasks) * 100).toFixed(1));
            return {
                ...cat,
                progress
            };
        });

        res.status(200).json({
            status: 'success',
            data: {
                overallProgress,
                categories: categoriesArray
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
        const usersData = await fs.readFile(path.join(dataDir, 'mockData.json'), 'utf-8');
        const tasksData = await fs.readFile(path.join(dataDir, 'mockTasks.json'), 'utf-8');
        const projectsData = await fs.readFile(path.join(dataDir, 'mockProjects.json'), 'utf-8');

        let users = JSON.parse(usersData);
        const tasks = JSON.parse(tasksData);
        const projects = JSON.parse(projectsData);

        // Scope to users that share a project with the authenticated user
        let userProjects = projects.filter(p => p.ownerId === userId || p.members.some(m => m.userId === userId));
        if (userProjects.length === 0) {
            userProjects = projects.slice(0, 3); // Fallback starter data
        }
        const relevantUserIds = new Set();
        userProjects.forEach(p => {
            relevantUserIds.add(p.ownerId);
            p.members.forEach(m => relevantUserIds.add(m.userId));
        });

        // Filter the users pool
        users = users.filter(u => relevantUserIds.has(u.id));

        const teamStats = {};

        users.forEach(user => {
            const teamName = user.team || 'Other';
            if (!teamStats[teamName]) {
                teamStats[teamName] = {
                    teamName,
                    members: [],
                    totalTasks: 0,
                    completedTasks: 0,
                    progress: 0
                };
            }

            teamStats[teamName].members.push({
                id: user.id,
                name: user.name,
                avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`
            });
        });

        // Aggregate task data for each team
        tasks.forEach(task => {
            const assignee = users.find(u => u.id === task.assigneeId);
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
            
            // Generate some dynamic activity data for the dev chart
            const devBarHeights = Array.from({ length: 8 }, () => Math.floor(Math.random() * 60) + 20 + (team.completedTasks * 2));
            overallActivity = devBarHeights.map((h, i) => Math.min(100, Math.max(overallActivity[i] || 0, h)));

            const progress = team.totalTasks === 0 ? 0 : Number(((team.completedTasks / team.totalTasks) * 100).toFixed(1));
            return {
                ...team,
                progress,
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
        const usersData = await fs.readFile(path.join(dataDir, 'mockData.json'), 'utf-8');
        const attachmentsData = await fs.readFile(path.join(dataDir, 'mockAttachments.json'), 'utf-8');

        const users = JSON.parse(usersData);
        let attachments = JSON.parse(attachmentsData);

        // Sort attachments by uploadedAt descending (most recent first)
        attachments.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        // Format and map user details
        const recentFiles = attachments.map(att => {
            const uploadedBy = users.find(u => u.id === att.uploadedBy);
            return {
                id: att.id,
                filename: att.filename,
                url: att.url,
                mimeType: att.mimeType,
                size: att.size,
                uploadedAt: att.uploadedAt,
                uploadedBy: uploadedBy ? {
                    id: uploadedBy.id,
                    name: uploadedBy.name,
                    avatar: uploadedBy.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(uploadedBy.name)}`
                } : null
            };
        });

        res.status(200).json({
            status: 'success',
            data: recentFiles
        });
    } catch (error) {
        console.error('Error in getRecentFiles:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

export const getRecentProjects = async (req, res) => {
    try {
        const userId = req.user.id;
        const projectsData = await fs.readFile(path.join(dataDir, 'mockProjects.json'), 'utf-8');
        const usersData = await fs.readFile(path.join(dataDir, 'mockData.json'), 'utf-8');
        let projects = JSON.parse(projectsData);
        const users = JSON.parse(usersData);

        // Filter projects accessible by the user
        let userProjects = projects.filter(p => p.ownerId === userId || p.members.some(m => m.userId === userId));
        if (userProjects.length === 0) {
            userProjects = projects.slice(0, 3); // Fallback starter data
        }
        
        // Sort by updatedAt descending
        userProjects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        // Return just the top 3 (now Project Cards, not capsule pills)
        const recentProjects = userProjects.slice(0, 3).map(p => ({
            id: p.id,
            name: p.name,
            status: p.status,
            type: p.category && p.category.toLowerCase().includes('design') ? 'figma' : 'code',
            color: p.category && p.category.toLowerCase().includes('design') ? '#a78bfa' : '#34d399',
            updatedAt: p.updatedAt,
            members: p.members.map(m => {
                const user = users.find(u => u.id === m.userId);
                return {
                    id: m.userId,
                    name: user?.name,
                    avatar: user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`
                };
            })
        }));

        res.status(200).json({
            status: 'success',
            data: recentProjects
        });
    } catch (error) {
        console.error('Error in getRecentProjects:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

