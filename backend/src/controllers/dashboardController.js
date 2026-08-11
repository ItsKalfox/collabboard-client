import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dashboardDataPath = path.join(__dirname, '../data/mockDashboardData.json');

const getDashboardMockData = () => {
    const data = fs.readFileSync(dashboardDataPath, 'utf8');
    return JSON.parse(data);
};

export const getDashboardData = (req, res) => {
    try {
        const dashboard = getDashboardMockData();
        const user = req.user
            ? {
                  id: req.user.id,
                  name: req.user.name,
                  email: req.user.email,
                  avatar: req.user.avatar || dashboard.user?.avatar || null,
                  role: req.user.role || dashboard.user?.role || 'Lead Designer',
                  date: req.user.date
              }
            : dashboard.user;

        res.status(200).json({
            status: 'success',
            data: {
                user,
                timeline: dashboard.timeline,
                ongoingProjects: dashboard.ongoingProjects,
                files: dashboard.files,
                team: dashboard.team
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to load dashboard data' });
    }
};
