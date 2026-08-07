import TimelineTable from '../components/Dashboard/TimelineTable';
import OngoingProjectsCard from '../components/Dashboard/OngoingProjectsCard';
import QuickLinksCard from '../components/Dashboard/QuickLinksCard';
import TeamCard from '../components/Dashboard/TeamCard';
import './Dashboard.css';

export default function Dashboard() {
  return (
    <div className="dashboard-page">
      {/* Top Row: Timeline & Ongoing Projects */}
      <div className="dashboard-top-row">
        <div className="dashboard-timeline-col">
          <TimelineTable />
        </div>
        <div className="dashboard-cards-col">
          <div className="dashboard-card-wrapper">
            <OngoingProjectsCard />
          </div>
        </div>
      </div>

      {/* Bottom Row: Quick Links & Team Overview */}
      <div className="dashboard-bottom-row">
        <div className="dashboard-quicklinks-col">
          <QuickLinksCard />
        </div>
        <div className="dashboard-team-col">
          <TeamCard />
        </div>
      </div>
    </div>
  );
}
