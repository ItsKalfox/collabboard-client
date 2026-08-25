import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import '../Dashboard/TimelineTable.css';

const STATUS_LEVELS = {
  'todo': 1,
  'in_progress': 2,
  'review': 3,
  'completed': 4
};

const STATUS_LABELS = {
  1: 'To Do',
  2: 'In Progress',
  3: 'Need Review',
  4: 'Done'
};

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

export default function ProjectTimeline({ project }) {
  const [activeFilter, setActiveFilter] = useState('Month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  
  const filterOptions = ['Day', 'Week', 'Month', 'Year'];
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

  const { lines, minTime, maxTime } = useMemo(() => {
    let startD = new Date(selectedDate);
    let endD = new Date(selectedDate);
    startD.setHours(0,0,0,0);
    endD.setHours(23,59,59,999);

    if (activeFilter === 'Week') {
      const day = startD.getDay();
      const diff = startD.getDate() - day + (day === 0 ? -6 : 1);
      startD.setDate(diff);
      endD = new Date(startD);
      endD.setDate(startD.getDate() + 6);
      endD.setHours(23,59,59,999);
    } else if (activeFilter === 'Month') {
      startD = new Date(startD.getFullYear(), startD.getMonth(), 1);
      endD = new Date(startD.getFullYear(), startD.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (activeFilter === 'Year') {
      startD = new Date(startD.getFullYear(), 0, 1);
      endD = new Date(startD.getFullYear(), 11, 31, 23, 59, 59, 999);
    }
    
    // Auto-calculate bounds based on tasks if filter doesn't perfectly capture it.
    // Or just use the filter bounds unconditionally to make the graph window zoom!
    let windowMin = startD.getTime();
    let windowMax = endD.getTime();

    if (!project || !project.tasks || project.tasks.length === 0) {
      return { lines: [], minTime: windowMin, maxTime: windowMax };
    }

    let allTimeMin = Infinity;
    let allTimeMax = -Infinity;

    const parsedLines = project.tasks.map((task, index) => {
      const cTime = new Date(task.createdAt || Date.now()).getTime();
      let dataPoints = [
        { time: cTime, status: STATUS_LEVELS['todo'], taskName: task.title, dateStr: new Date(cTime).toLocaleDateString() }
      ];
      
      if (cTime < allTimeMin) allTimeMin = cTime;

      let lastTime = cTime;
      let lastStatusStr = 'todo';

      if (task.activities && task.activities.length > 0) {
        const sortedActivities = [...task.activities].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        sortedActivities.forEach(act => {
          let newStatus = null;
          if (act.type === 'moved') newStatus = act.toStatus;
          else if (act.type === 'approved' || act.type === 'completed') newStatus = 'completed';
          else if (act.type === 'rejected') newStatus = 'in_progress';
          else if (act.type === 'created') newStatus = 'todo';

          if (newStatus) {
            const aTime = new Date(act.timestamp).getTime();
            dataPoints.push({
              time: aTime,
              status: STATUS_LEVELS[newStatus] || STATUS_LEVELS['todo'],
              taskName: task.title,
              dateStr: new Date(aTime).toLocaleDateString()
            });
            lastTime = aTime;
            lastStatusStr = newStatus;
            if (aTime > allTimeMax) allTimeMax = aTime;
          }
        });
      }

      const uTime = new Date(task.updatedAt || task.createdAt || Date.now()).getTime();
      if (lastStatusStr !== task.status || dataPoints.length === 1) {
        let finalTime = uTime;
        if (finalTime <= lastTime) finalTime = lastTime + 3600000;
        dataPoints.push({
          time: finalTime,
          status: STATUS_LEVELS[task.status] || STATUS_LEVELS['todo'],
          taskName: task.title,
          dateStr: new Date(finalTime).toLocaleDateString()
        });
        if (finalTime > allTimeMax) allTimeMax = finalTime;
      }

      return {
        id: task.id || `task-${index}`,
        title: task.title,
        color: COLORS[index % COLORS.length],
        data: dataPoints
      };
    });

    // If 'Month' or 'Year' etc is selected but the tasks span completely out of bounds, 
    // it will just clip them. That's how zooming timelines work!
    return {
      lines: parsedLines,
      minTime: windowMin,
      maxTime: windowMax
    };
  }, [project, activeFilter, selectedDate]);

  const formatXAxis = (tickItem) => {
    return new Date(tickItem).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatYAxis = (tickItem) => {
    return STATUS_LABELS[tickItem] || '';
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ 
          background: 'rgba(20, 20, 25, 0.9)', 
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '12px',
          borderRadius: '8px',
          backdropFilter: 'blur(10px)',
          color: '#fff',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{data.taskName}</p>
          <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#9ca3af' }}>
            Status: <span style={{ fontWeight: '500', color: payload[0].color }}>{STATUS_LABELS[data.status]}</span>
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Date: {data.dateStr}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="timeline-container" style={{ marginTop: '20px' }}>
      {/* Header Bar */}
      <div className="timeline-header">
        <h2 className="timeline-title">Project Timeline</h2>

        <div className="timeline-header-controls">
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
                        onClick={() => { setSelectedDate(new Date(currentYear, currentMonth, day)); setIsDatePickerOpen(false); }}
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

      {/* Graph Body */}
      <div className="timeline-body" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {(!project || !project.tasks || project.tasks.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            No timeline data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minHeight={350}>
            <LineChart margin={{ top: 30, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              
              <XAxis 
                dataKey="time" 
                type="number" 
                domain={[minTime, maxTime]} 
                tickFormatter={formatXAxis}
                scale="time"
                stroke="rgba(255,255,255,0.15)"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                dy={10}
              />
              
              <YAxis 
                domain={[1, 4]} 
                ticks={[1, 2, 3, 4]} 
                tickFormatter={formatYAxis}
                stroke="rgba(255,255,255,0.15)"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                width={90}
              />
              
              <RechartsTooltip content={<CustomTooltip />} />

              {/* Legend has been removed as requested */}

              {lines.map((line) => (
                <Line
                  key={line.id}
                  data={line.data}
                  type="stepAfter"
                  dataKey="status"
                  name={line.title}
                  stroke={line.color}
                  strokeWidth={3}
                  activeDot={{ r: 6, fill: line.color, stroke: 'var(--bg-color)', strokeWidth: 2 }}
                  dot={{ r: 4, fill: 'var(--bg-color)', stroke: line.color, strokeWidth: 2 }}
                  isAnimationActive={true}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
