import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDashboardTimeline } from '../../hooks/useDashboardData';
import { Loader2, AlertCircle } from 'lucide-react';
import './TimelineTable.css';

function getScaleConfig(filter) {
  switch (filter) {
    case 'Day':
      return {
        slots: ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM'],
        minBound: 9 * 60,
        maxBound: 18 * 60,
        totalSpan: 9 * 60,
        parseTime: (dateStr) => {
          if (!dateStr) return 9*60;
          const d = new Date(dateStr);
          return d.getHours() * 60 + d.getMinutes();
        }
      };
    case 'Week':
      return {
        slots: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        minBound: 1,
        maxBound: 7,
        totalSpan: 6,
        parseTime: (dateStr) => {
          if (!dateStr) return 1;
          const d = new Date(dateStr);
          let day = d.getDay();
          if (day === 0) day = 7;
          return day + (d.getHours() / 24);
        }
      };
    case 'Month':
      return {
        slots: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
        minBound: 1,
        maxBound: 5.5,
        totalSpan: 4.5,
        parseTime: (dateStr) => {
          if (!dateStr) return 1;
          const d = new Date(dateStr);
          return 1 + (d.getDate() - 1) / 7;
        }
      };
    case 'Year':
      return {
        slots: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        minBound: 0,
        maxBound: 11,
        totalSpan: 11,
        parseTime: (dateStr) => {
          if (!dateStr) return 0;
          const d = new Date(dateStr);
          return d.getMonth() + (d.getDate() / 31);
        }
      };
    default:
      return null;
  }
}

function calculateDynamicPosition(startTimeStr, endTimeStr, config) {
  if (!config) return { left: '0%', width: '0%', display: 'none' };
  
  let startVal = config.parseTime(startTimeStr);
  let endVal = config.parseTime(endTimeStr);

  // Fallback if end time is somehow before start time
  if (endVal < startVal) endVal = startVal + (config.totalSpan * 0.1); 

  if (startVal < config.minBound) startVal = config.minBound;
  if (endVal > config.maxBound) endVal = config.maxBound;
  if (startVal > endVal) startVal = endVal;

  if (endVal <= config.minBound || startVal >= config.maxBound) {
    return { left: '0%', width: '0%', display: 'none' };
  }

  const leftPercent = Math.max(0, ((startVal - config.minBound) / config.totalSpan) * 100);
  const widthPercent = Math.min(100 - leftPercent, ((endVal - startVal) / config.totalSpan) * 100);

  return {
    left: `${leftPercent}%`,
    width: `${widthPercent}%`,
  };
}

export default function TimelineTable() {
  const [activeFilter, setActiveFilter] = useState('Day');
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 7, 19));
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  
  const [activeTask, setActiveTask] = useState(null);
  const [activeAssignee, setActiveAssignee] = useState(null);
  const trackRef = useRef(null);

  const { data: timelineResponse, loading, error, refetch } = useDashboardTimeline();
  const timelineData = timelineResponse?.data || [];

  const filterOptions = ['Day', 'Week', 'Month', 'Year'];
  const scaleConfig = getScaleConfig(activeFilter);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const formattedSelectedDate = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); } 
    else { setCurrentMonth(currentMonth - 1); }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); } 
    else { setCurrentMonth(currentMonth + 1); }
  };

  const scrollLeft = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="timeline-container" style={{ zIndex: (activeTask || activeAssignee) ? 1000 : 'auto' }}>
      {/* Header Bar */}
      <div className="timeline-header">
        <h2 className="timeline-title">Management</h2>

        <div className="timeline-header-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={scrollLeft} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '28px', height: '28px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button onClick={scrollRight} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '28px', height: '28px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>

          {/* Date Selector */}
          <div style={{ position: 'relative' }}>
            <button className="timeline-date-btn" onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}>
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>{formattedSelectedDate}</span>
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="chevron-down">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            
            {isDatePickerOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: '8px', padding: '12px', 
                background: 'var(--bg-color)', border: 'var(--window-border)', 
                borderRadius: '12px', zIndex: 99, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                width: '240px', backdropFilter: 'blur(16px)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', color: '#f4f4f5' }}>
                  <button onClick={handlePrevMonth} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '4px' }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  </button>
                  <span style={{ fontWeight: '600', fontSize: '13px' }}>{monthNames[currentMonth]} {currentYear}</span>
                  <button onClick={handleNextMonth} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '4px' }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', fontSize: '11px', color: '#71717a', marginBottom: '6px' }}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isSelected = day === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();
                    return (
                      <div 
                        key={day} 
                        onClick={() => { setSelectedDate(new Date(currentYear, currentMonth, day)); setIsDatePickerOpen(false); refetch(); }}
                        style={{ 
                          padding: '0', textAlign: 'center', fontSize: '12px', borderRadius: '50%', cursor: 'pointer',
                          background: isSelected ? '#ffffff' : 'transparent', color: isSelected ? '#000000' : '#a1a1aa',
                          transition: 'background 0.2s ease, color 0.2s ease', height: '24px', width: '24px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: isSelected ? '600' : '400'
                        }}
                        onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
                        onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

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
      <div className="timeline-body" ref={trackRef}>
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
          <div className="timeline-grid-wrapper" style={{ minWidth: activeFilter === 'Day' ? '800px' : '580px' }}>
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
                    {/* Vertical Grid lines corresponding to slots */}
                    <div className="timeline-grid-lines">
                      {scaleConfig.slots.map((slot, index) => (
                        <div key={slot + index} className="timeline-grid-line" />
                      ))}
                    </div>

                    {row.tasks?.map((item) => {
                      const pos = calculateDynamicPosition(item.startDate, item.dueDate, scaleConfig);
                      const priorityClass = item.priority === 'high' ? 'priority-high' : item.priority === 'medium' ? 'priority-medium' : 'priority-low';
                      return (
                        <div
                          key={item.id}
                          className="timeline-pill-wrapper"
                          style={{ left: pos.left, width: pos.width, display: pos.display }}
                        >
                          <div className="timeline-pill" onClick={(e) => { e.stopPropagation(); setActiveTask(item); }}>
                            {item.priority && (
                              <div className={`timeline-top-label ${priorityClass}`}>{item.priority}</div>
                            )}
                            <span className="timeline-pill-title">{item.duration || item.title}</span>

                            <div className="timeline-avatar-group">
                              {item.assignee && (
                                <div style={{ position: 'relative' }}>
                                  <img
                                    src={item.assignee.avatar}
                                    alt={item.assignee.name}
                                    className="timeline-avatar"
                                    title={`${item.assignee.name} - ${item.title}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveAssignee(activeAssignee?.assignee?.id === item.assignee.id ? null : { assignee: item.assignee, taskTitle: item.title });
                                    }}
                                  />
                                  {activeAssignee?.assignee?.id === item.assignee.id && (
                                    <div style={{
                                      position: 'absolute', bottom: '100%', right: '0%', transform: 'translate(10px, -8px)',
                                      background: 'var(--bg-color)', border: 'var(--window-border)', padding: '12px',
                                      borderRadius: '8px', zIndex: 100, width: '160px', backdropFilter: 'blur(10px)',
                                      boxShadow: 'var(--window-shadow)', color: 'var(--text-primary)', textAlign: 'center', cursor: 'default'
                                    }} onClick={e => e.stopPropagation()}>
                                      <img src={item.assignee.avatar} alt={item.assignee.name} style={{ width: '40px', height: '40px', borderRadius: '50%', marginBottom: '8px', border: '2px solid #3b82f6' }} />
                                      <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{item.assignee.name}</div>
                                      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Lead Member</div>
                                      <div style={{ fontSize: '10px', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', padding: '2px 4px', borderRadius: '4px', display: 'inline-block', lineHeight: '1.2' }}>
                                        {activeAssignee.taskTitle}
                                      </div>
                                    </div>
                                  )}
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
                {scaleConfig.slots.map((slot) => (
                  <div key={slot} className="timeline-time-slot">
                    {slot}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Modal Overlay */}
      {activeTask && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
        }} onClick={() => setActiveTask(null)}>
          <div style={{
            backgroundColor: '#1a1d24', border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '400px',
            color: 'var(--text-primary, #fff)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.7)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>{activeTask.title}</h2>
              <button onClick={() => setActiveTask(null)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Priority</div>
                <div style={{ fontWeight: '500', display: 'inline-block', background: 'var(--menu-bg)', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' }}>{activeTask.priority || 'Normal'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Duration</div>
                <div style={{ fontWeight: '500', fontSize: '14px' }}>{activeTask.duration || 'Unknown'}</div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>Timeframe</div>
              <div style={{ background: 'var(--menu-bg)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                <div style={{ marginBottom: '8px' }}><strong>Start:</strong> {new Date(activeTask.startDate).toLocaleString()}</div>
                <div><strong>End:</strong> {new Date(activeTask.dueDate).toLocaleString()}</div>
              </div>
            </div>

            {activeTask.assignee && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--menu-bg)', padding: '12px', borderRadius: '8px' }}>
                <img src={activeTask.assignee.avatar} alt={activeTask.assignee.name} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{activeTask.assignee.name}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>Assigned Lead</div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
