import { useState, useEffect } from 'react';
import TimelineTable from '../components/Dashboard/TimelineTable';
import OngoingProjectsCard from '../components/Dashboard/OngoingProjectsCard';
import QuickLinksCard from '../components/Dashboard/QuickLinksCard';
import TeamCard from '../components/Dashboard/TeamCard';
import './Dashboard.css';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${apiUrl}/dashboard`, { headers });
        const data = await res.json();
        if (data.status === 'success' && data.data) {
          setDashboardData(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div className="dashboard-page">
      {/* Top Row: Timeline & Ongoing Projects */}
      <div className="dashboard-top-row">
        <div className="dashboard-timeline-col">
          <TimelineTable data={dashboardData?.timeline} />
        </div>
        <div className="dashboard-cards-col">
          <div className="dashboard-card-wrapper">
            <OngoingProjectsCard data={dashboardData?.ongoingProjects} />
          </div>
        </div>
      </div>

      {/* Bottom Row: Quick Links & Team Overview */}
      <div className="dashboard-bottom-row">
        <div className="dashboard-quicklinks-col">
          <QuickLinksCard data={dashboardData?.files} />
        </div>
        <div className="dashboard-team-col">
          <TeamCard data={dashboardData?.team} />
        </div>
      </div>
    </div>
  );
}
