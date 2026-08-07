import TimelineTable from '../components/Dashboard/TimelineTable';
import OngoingProjectsCard from '../components/Dashboard/OngoingProjectsCard';
import './Dashboard.css';

export default function Dashboard() {
  return (
    <div className="dashboard-page">
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
    </div>
  );
}
