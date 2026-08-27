import { useState, useEffect } from 'react';
import { formatActivityText } from '../../utils/projectUtils';
import './ProjectActivity.css';

const ACTIVITY_TYPE_LABELS = {
  created: 'Created',
  moved: 'Moved',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  updated: 'Updated',
};

const ACTIVITY_TYPE_COLORS = {
  created: 'activity-badge--created',
  moved: 'activity-badge--moved',
  approved: 'activity-badge--approved',
  rejected: 'activity-badge--rejected',
  completed: 'activity-badge--completed',
  updated: 'activity-badge--updated',
};

function formatDate(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function ProjectActivity({ projectId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) return;

    const fetchActivities = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${apiUrl}/projects/${projectId}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to fetch tasks');

        const data = await res.json();
        const tasks = data.data?.tasks || [];

        // Flatten all activities across all tasks, tagging each with task title
        const flat = [];
        tasks.forEach((task) => {
          if (task.activities && task.activities.length > 0) {
            task.activities.forEach((act) => {
              flat.push({
                ...act,
                taskTitle: task.title,
                taskId: task._id || task.id,
              });
            });
          } else {
            // Synthesise a "created" entry from the task itself if no activities logged
            flat.push({
              type: 'created',
              text: `Task "${task.title}" created`,
              timestamp: task.createdAt,
              taskTitle: task.title,
              taskId: task._id || task.id,
            });
          }
        });

        // Sort newest first
        flat.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setActivities(flat);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [projectId]);

  if (loading) {
    return (
      <div className="project-activity-container">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="activity-skeleton-row">
            <div className="activity-skeleton-dot" />
            <div className="activity-skeleton-lines">
              <div className="activity-skeleton-line" style={{ width: '60%' }} />
              <div className="activity-skeleton-line" style={{ width: '35%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-activity-container project-activity-empty">
        <span className="activity-empty-icon">⚠️</span>
        <p>Could not load activity log.</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="project-activity-container project-activity-empty">
        <span className="activity-empty-icon">📋</span>
        <p>No activity yet. Start by moving a task!</p>
      </div>
    );
  }

  return (
    <div className="project-activity-container">
      <div className="activity-feed">
        {activities.map((act, i) => (
          <div key={`${act.taskId}-${i}`} className="activity-row">
            {/* Timeline dot + line */}
            <div className="activity-timeline">
              <div className={`activity-dot ${ACTIVITY_TYPE_COLORS[act.type] || 'activity-badge--updated'}`} />
              {i < activities.length - 1 && <div className="activity-line" />}
            </div>

            {/* Content */}
            <div className="activity-content">
              <div className="activity-top-row">
                <span className={`activity-badge ${ACTIVITY_TYPE_COLORS[act.type] || 'activity-badge--updated'}`}>
                  {ACTIVITY_TYPE_LABELS[act.type] || act.type}
                </span>
                <span className="activity-task-title">{act.taskTitle}</span>
              </div>
              <p className="activity-text">{formatActivityText(act.text)}</p>
              <span className="activity-timestamp">{formatDate(act.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
