import { useState } from 'react';
import { useDashboardTimeline } from '../../hooks/useDashboardData';
import { Loader2, AlertCircle } from 'lucide-react';
import './TimelineTable.css';

const TIME_SLOTS = [
  '1 PM',
  '2 PM',
  '3 PM',
  '4 PM',
  '5 PM',
  '6 PM',
  '7 PM',
  '8 PM',
];

// Start time is 1 PM (13:00) and End time is 8 PM (20:00) => 7 hours = 420 mins
const START_HOUR_MINS = 13 * 60;
const END_HOUR_MINS = 20 * 60;
const TOTAL_SPAN_MINS = 7 * 60;

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function extractTime(isoString) {
  if (!isoString) return '00:00';
  const date = new Date(isoString);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function calculatePosition(startTime, endTime) {
  let startMins = timeToMinutes(startTime);
  let endMins = timeToMinutes(endTime);

  // Clamp values to timeline bounds
  if (startMins < START_HOUR_MINS) startMins = START_HOUR_MINS;
  if (endMins > END_HOUR_MINS) endMins = END_HOUR_MINS;
  if (startMins > endMins) startMins = endMins; 

  // Hide if entirely outside the bounds
  if (endMins <= START_HOUR_MINS || startMins >= END_HOUR_MINS) {
      return { left: '0%', width: '0%', display: 'none' };
  }

  const leftPercent = Math.max(0, ((startMins - START_HOUR_MINS) / TOTAL_SPAN_MINS) * 100);
  const widthPercent = Math.min(100 - leftPercent, ((endMins - startMins) / TOTAL_SPAN_MINS) * 100);

  return {
    left: `${leftPercent}%`,
    width: `${widthPercent}%`,
  };
}

export default function TimelineTable() {
  const [activeFilter, setActiveFilter] = useState('Day');
  const [selectedDate] = useState('JUNE 1, 2023');
  
  const { data: timelineResponse, loading, error, refetch } = useDashboardTimeline();
  const timelineData = timelineResponse?.data || [];

  const filterOptions = ['Day', 'Week', 'Month', 'Year'];

  return (
    <div className="timeline-container">
      {/* Header Bar */}
      <div className="timeline-header">
        <h2 className="timeline-title">Management</h2>

        <div className="timeline-header-controls">
          {/* Date Selector */}
          <button className="timeline-date-btn">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>{selectedDate}</span>
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="chevron-down">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {/* Time View Filters */}
          <div className="timeline-filter-group">
            {filterOptions.map((opt) => (
              <button
                key={opt}
                className={`timeline-filter-btn ${activeFilter === opt ? 'active' : ''}`}
                onClick={() => setActiveFilter(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Grid Body */}
      <div className="timeline-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#6b7280' }}>
            <Loader2 className="animate-spin" style={{ marginRight: '8px' }} /> Loading timeline...
          </div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#ef4444' }}>
            <AlertCircle style={{ marginBottom: '8px' }} />
            <p>{error}</p>
            <button 
              onClick={refetch} 
              style={{ marginTop: '12px', padding: '6px 12px', backgroundColor: '#e5e7eb', borderRadius: '4px', color: '#374151', cursor: 'pointer', border: 'none' }}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="timeline-grid-wrapper">
            {/* Rows Container */}
            <div className="timeline-rows-container">
              {timelineData.map((row) => (
                <div key={row.trackId} className="timeline-row">
                  {/* Category Label */}
                  <div className="timeline-category-label">
                    {row.trackName}
                  </div>

                  {/* Timeline Track */}
                  <div className="timeline-track">
                    {/* Vertical Grid lines corresponding to hours */}
                    <div className="timeline-grid-lines">
                      {TIME_SLOTS.map((slot, index) => (
                        <div key={slot + index} className="timeline-grid-line" />
                      ))}
                    </div>

                    {/* Task Pills */}
                    {row.tasks?.map((item) => {
                      const pos = calculatePosition(extractTime(item.startDate), extractTime(item.dueDate));
                      return (
                        <div
                          key={item.id}
                          className="timeline-pill-wrapper"
                          style={{ left: pos.left, width: pos.width, display: pos.display }}
                        >
                          {item.priority && (
                            <div className="timeline-top-label">{item.priority}</div>
                          )}
                          <div className="timeline-pill" title={item.title}>
                            <span className="timeline-pill-title">{item.duration || item.title}</span>

                            <div className="timeline-avatar-group">
                              {item.assignee && (
                                <img
                                  src={item.assignee.avatar}
                                  alt={item.assignee.name}
                                  className="timeline-avatar"
                                  title={item.assignee.name}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {timelineData.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                  No timeline data available.
                </div>
              )}
            </div>

            {/* Time Scale Footer */}
            <div className="timeline-footer">
              <div className="timeline-category-spacer" />
              <div className="timeline-time-slots">
                {TIME_SLOTS.map((slot) => (
                  <div key={slot} className="timeline-time-slot">
                    {slot}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
