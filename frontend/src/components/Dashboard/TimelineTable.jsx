import { useState } from 'react';
import './TimelineTable.css';

const INITIAL_TIMELINE_DATA = [
  {
    id: '1',
    category: 'Design',
    items: [
      {
        id: 'item-1',
        title: 'about 3 hours',
        startTime: '13:30', // 1:30 PM
        endTime: '16:30',   // 4:30 PM
        avatars: [
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        ],
        hasPlus: true,
      },
    ],
  },
  {
    id: '2',
    category: 'Mobile Apps',
    items: [
      {
        id: 'item-2',
        title: 'about 2 hours',
        startTime: '14:15', // 2:15 PM
        endTime: '15:45',   // 3:45 PM
        avatars: [
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        ],
        hasPlus: false,
      },
    ],
  },
  {
    id: '3',
    category: 'Infography',
    items: [
      {
        id: 'item-3a',
        title: 'about 2 hours',
        startTime: '15:15', // 3:15 PM
        endTime: '16:30',   // 4:30 PM
        avatars: [
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
        ],
        hasPlus: true,
      },
      {
        id: 'item-3b',
        title: 'about 2 hours',
        startTime: '18:00', // 6:00 PM
        endTime: '19:45',   // 7:45 PM
        topLabel: 'vacations',
        avatars: [
          'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
        ],
        hasPlus: true,
      },
    ],
  },
  {
    id: '4',
    category: 'Wireframes',
    items: [
      {
        id: 'item-4',
        title: 'about 3 hours',
        startTime: '16:00', // 4:00 PM
        endTime: '18:30',   // 6:30 PM
        avatars: [
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80',
        ],
        hasPlus: false,
      },
    ],
  },
  {
    id: '5',
    category: 'Team Management',
    items: [
      {
        id: 'item-5',
        title: 'about 1 hour',
        startTime: '16:45', // 4:45 PM
        endTime: '17:45',   // 5:45 PM
        avatars: [
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        ],
        hasPlus: false,
      },
    ],
  },
];

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
const TOTAL_SPAN_MINS = 7 * 60;

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function calculatePosition(startTime, endTime) {
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);

  const leftPercent = Math.max(0, ((startMins - START_HOUR_MINS) / TOTAL_SPAN_MINS) * 100);
  const widthPercent = Math.min(100 - leftPercent, ((endMins - startMins) / TOTAL_SPAN_MINS) * 100);

  return {
    left: `${leftPercent}%`,
    width: `${widthPercent}%`,
  };
}

export default function TimelineTable({ data }) {
  const [activeFilter, setActiveFilter] = useState('Day');
  const selectedDate = data?.selectedDate || 'JUNE 1, 2023';
  const timelineRows = data?.rows || INITIAL_TIMELINE_DATA;
  const timeSlots = data?.timeSlots || TIME_SLOTS;

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
        <div className="timeline-grid-wrapper">
          {/* Rows Container */}
          <div className="timeline-rows-container">
            {timelineRows.map((row) => (
              <div key={row.id} className="timeline-row">
                {/* Category Label */}
                <div className="timeline-category-label">
                  {row.category}
                </div>

                {/* Timeline Track */}
                <div className="timeline-track">
                  {/* Vertical Grid lines corresponding to hours */}
                  <div className="timeline-grid-lines">
                    {timeSlots.map((slot, index) => (
                      <div key={slot + index} className="timeline-grid-line" />
                    ))}
                  </div>

                  {/* Task Pills */}
                  {row.items.map((item) => {
                    const pos = calculatePosition(item.startTime, item.endTime);
                    return (
                      <div
                        key={item.id}
                        className="timeline-pill-wrapper"
                        style={{ left: pos.left, width: pos.width }}
                      >
                        {item.topLabel && (
                          <div className="timeline-top-label">{item.topLabel}</div>
                        )}
                        <div className="timeline-pill">
                          <span className="timeline-pill-title">{item.title}</span>

                          <div className="timeline-avatar-group">
                            {item.avatars.map((url, i) => (
                              <img
                                key={i}
                                src={url}
                                alt="Assignee avatar"
                                className="timeline-avatar"
                              />
                            ))}
                            {item.hasPlus && (
                              <div className="timeline-plus-badge">
                                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none">
                                  <line x1="12" y1="5" x2="12" y2="19"></line>
                                  <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Time Scale Footer */}
          <div className="timeline-footer">
            <div className="timeline-category-spacer" />
            <div className="timeline-time-slots">
              {timeSlots.map((slot) => (
                <div key={slot} className="timeline-time-slot">
                  {slot}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
