import { useEffect, useState, useRef } from 'react';
import { formatDate } from '../../utils/dateUtils';
import ConfirmModal from '../Board/ConfirmModal';
import './TaskPopup.css';

/* ─── Dummy employee pool ───────────────────────────────────── */
const ALL_EMPLOYEES = [
  { id: 1, name: 'Amanda Black', role: 'Designer', initials: 'AB' },
  { id: 2, name: 'Jake Wilson', role: 'Front-End Dev', initials: 'JW' },
  { id: 3, name: 'Sara Johnson', role: 'Product Manager', initials: 'SJ' },
  { id: 4, name: 'Mike Chen', role: 'Back-End Dev', initials: 'MC' },
  { id: 5, name: 'Priya Patel', role: 'UI Designer', initials: 'PP' },
  { id: 6, name: 'Alex Turner', role: 'QA Engineer', initials: 'AT' },
  { id: 7, name: 'Dana Lee', role: 'Full-Stack Dev', initials: 'DL' },
  { id: 8, name: 'Chris Brown', role: 'Marketing', initials: 'CB' },
];

/* ─── Helpers ───────────────────────────────────────────────── */
function fmtNow() {
  return new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

/* ─── Icon helpers (tiny inline SVGs) ──────────────────────── */
const Icon = ({ d, size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor"
    strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const CheckIcon = ({ size = 13 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor"
    strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ─── Main component ────────────────────────────────────────── */
export default function TaskPopup({ task: prop, onClose, onUpdate }) {
  const fileInputRef = useRef();

  /* Initialise local task state from prop */
  const [task, setTask] = useState(() => ({
    ...prop,
    subtasks: (prop.subtasks || []).map(s => ({
      ...s,
      comments: s.comments || [],
    })),
    attachments: prop.attachments || [
      { id: 'a1', name: 'Design Brief', ext: 'PDF', size: '2.45 MB', url: null },
      { id: 'a2', name: 'Company Info', ext: 'PDF', size: '5.25 MB', url: null },
    ],
    generalComments: prop.generalComments || [],
    activities: prop.activities || [
      { text: `Task "${prop.title}" was created`, timestamp: prop.createdDate },
    ],
  }));

  /* ── Edit mode ── */
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({});

  const startEdit = () => {
    setDraft({
      title: task.title,
      description: task.description,
      status: task.status,
      dueDate: task.dueDate,
      priority: task.priority,
      progress: task.progress,
    });
    setIsEditing(true);
  };

  const saveEdit = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      await fetch(`${apiUrl}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          status: draft.status,
          priority: draft.priority,
          dueDate: draft.dueDate
        })
      });
    } catch (e) {
      console.error('Failed to update task', e);
    }
    
    setTask(t => ({
      ...t,
      ...draft,
      activities: [
        { text: 'Task details were updated', timestamp: fmtNow() },
        ...t.activities,
      ],
    }));
    if (onUpdate) onUpdate();
    setIsEditing(false);
  };

  /* ── Confirm Modal State ── */
  const [confirmState, setConfirmState] = useState({ isOpen: false, type: null, payload: null });

  const deleteFullTask = () => {
    setConfirmState({ isOpen: true, type: 'task' });
  };

  const performDeleteFullTask = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      await fetch(`${apiUrl}/tasks/${task.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (onUpdate) onUpdate();
      onClose(); // Close modal
    } catch (e) {
      console.error('Failed to delete task', e);
    }
  };

  /* ── Tab ── */
  const [activeTab, setActiveTab] = useState('subtasks');

  /* ── Invite ── */
  const [showInvite, setShowInvite] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [pendingInvitees, setPendingInvitees] = useState([]);

  const filteredEmployees = ALL_EMPLOYEES.filter(e =>
    e.name.toLowerCase().includes(inviteSearch.toLowerCase()) ||
    e.role.toLowerCase().includes(inviteSearch.toLowerCase())
  );

  const toggleInvitee = emp => {
    setPendingInvitees(prev =>
      prev.find(p => p.id === emp.id)
        ? prev.filter(p => p.id !== emp.id)
        : [...prev, emp]
    );
  };

  const confirmInvite = () => {
    const toAdd = pendingInvitees.filter(
      e => !task.assignees.find(a => a.name === e.name)
    ).map(e => ({ name: e.name, initials: e.initials }));

    if (toAdd.length) {
      setTask(t => ({
        ...t,
        assignees: [...t.assignees, ...toAdd],
        activities: [
          { text: `${toAdd.map(a => a.name).join(', ')} added as assignee(s)`, timestamp: fmtNow() },
          ...t.activities,
        ],
      }));
    }
    setPendingInvitees([]);
    setInviteSearch('');
    setShowInvite(false);
  };

  /* ── Subtasks ── */
  const toggleSubtask = async (i) => {
    const targetSub = task.subtasks[i];
    const newCompleted = !targetSub.completed;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      await fetch(`${apiUrl}/subtasks/${targetSub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ completed: newCompleted })
      });
    } catch (e) {
      console.error('Failed to toggle subtask', e);
    }

    setTask(t => {
      const subs = t.subtasks.map((s, idx) => idx === i ? { ...s, completed: newCompleted } : s);
      const verb = newCompleted ? 'completed' : 'reopened';
      return {
        ...t,
        subtasks: subs,
        activities: [{ text: `Subtask "${subs[i].title}" ${verb}`, timestamp: fmtNow() }, ...t.activities],
      };
    });
    if (onUpdate) onUpdate();
  };

  const deleteSubtask = (i) => {
    setConfirmState({ isOpen: true, type: 'subtask', payload: i });
  };

  const performDeleteSubtask = async (i) => {
    const targetSub = task.subtasks[i];

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      await fetch(`${apiUrl}/subtasks/${targetSub.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error('Failed to delete subtask', e);
    }

    setTask(t => ({
      ...t,
      subtasks: t.subtasks.filter((_, idx) => idx !== i),
      activities: [{ text: `Subtask "${targetSub.title}" deleted`, timestamp: fmtNow() }, ...t.activities],
    }));
    if (onUpdate) onUpdate();
  };

  /* ── Activities – add subtask ── */
  const [newSubInput, setNewSubInput] = useState('');

  const addSubtaskFromActivities = async () => {
    const title = newSubInput.trim();
    if (!title) return;

    let subData = { title, completed: false, comments: [] };

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/tasks/${task.id}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, completed: false })
      });
      const data = await res.json();
      if (data.status === 'success') {
        const newApiSubtask = data.data.subtask;
        subData = { ...subData, id: newApiSubtask.id };
      }
    } catch (e) {
      console.error('Failed to add subtask', e);
    }

    setTask(t => ({
      ...t,
      subtasks: [...t.subtasks, subData],
      activities: [{ text: `New subtask added: "${title}"`, timestamp: fmtNow() }, ...t.activities],
    }));
    setNewSubInput('');
    if (onUpdate) onUpdate();
  };


  /* ── Subtask comments ── */
  const [subInputs, setSubInputs] = useState({});

  const addSubtaskComment = i => {
    const text = (subInputs[i] || '').trim();
    if (!text) return;
    const comment = {
      author: task.assignees[0]?.name || 'You',
      text,
      timestamp: fmtNow(),
    };
    setTask(t => {
      const subs = t.subtasks.map((s, idx) =>
        idx === i ? { ...s, comments: [...s.comments, comment] } : s
      );
      return { ...t, subtasks: subs };
    });
    setSubInputs(p => ({ ...p, [i]: '' }));
  };

  /* ── General comments ── */
  const [newComment, setNewComment] = useState('');

  const addGeneralComment = () => {
    const text = newComment.trim();
    if (!text) return;
    const c = { author: task.assignees[0]?.name || 'You', text, timestamp: fmtNow() };
    setTask(t => ({ ...t, generalComments: [...t.generalComments, c] }));
    setNewComment('');
  };


  /* ── Attachments ── */
  const handleFileAdd = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = ''; // Reset immediately
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      
      const uploadPromises = files.map(async (f) => {
        const formData = new FormData();
        formData.append('file', f);
        
        const res = await fetch(`${apiUrl}/tasks/${task.id}/attachments`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        
        const data = await res.json();
        if (data.status === 'success') {
          return data.data.attachment;
        }
        return null;
      });

      const uploadedAtts = await Promise.all(uploadPromises);
      const successfulUploads = uploadedAtts.filter(a => a !== null).map(apiAtt => ({
        id: apiAtt.id,
        name: apiAtt.filename ? apiAtt.filename.replace(/\.[^.]+$/, '') : 'Attachment',
        ext: apiAtt.filename ? apiAtt.filename.split('.').pop().toUpperCase() : 'FILE',
        size: apiAtt.size ? (apiAtt.size / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown',
        url: apiAtt.url
      }));
      
      if (successfulUploads.length > 0) {
        setTask(t => ({
          ...t,
          attachments: [...t.attachments, ...successfulUploads],
          activities: [
            { text: `${successfulUploads.length} attachment(s) added`, timestamp: fmtNow() },
            ...t.activities,
          ],
        }));
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error('Failed to upload attachment(s)', err);
    }
  };

  const downloadAtt = att => {
    if (!att.url) return;
    const a = document.createElement('a');
    a.href = att.url;
    a.download = `${att.name}.${att.ext.toLowerCase()}`;
    a.click();
  };

  const downloadAll = () => task.attachments.filter(a => a.url).forEach(downloadAtt);

  const deleteAttachment = (attId) => {
    setConfirmState({ isOpen: true, type: 'attachment', payload: attId });
  };

  const performDeleteAttachment = async (attId) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      await fetch(`${apiUrl}/attachments/${attId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error('Failed to delete attachment', e);
    }
    setTask(t => ({
      ...t,
      attachments: t.attachments.filter(a => a.id !== attId),
      activities: [{ text: `Attachment deleted`, timestamp: fmtNow() }, ...t.activities],
    }));
    if (onUpdate) onUpdate();
  };

  /* ── Keyboard close ── */
  useEffect(() => {
    const h = e => {
      if (e.key === 'Escape') {
        if (showInvite) { setShowInvite(false); return; }
        onClose();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, showInvite]);

  /* ── Derived values ── */
  const priorityColor =
    task.priority >= 7 ? '#ef4444' :
      task.priority >= 4 ? '#f59e0b' : '#22c55e';

  const totalSubs = task.subtasks.length;
  const doneSubs = task.subtasks.filter(s => s.completed).length;
  const derivedProgress = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0;
  
  const commentCount = task.generalComments.length +
    task.subtasks.reduce((a, s) => a + s.comments.length, 0);

  /* ════════════════════════════════════════════════════════════ */
  return (
    <>
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, type: null, payload: null })}
        title={
          confirmState.type === 'task' ? 'Delete Task' :
          confirmState.type === 'subtask' ? 'Delete Subtask' :
          confirmState.type === 'attachment' ? 'Delete Attachment' : 'Confirm'
        }
        message={
          confirmState.type === 'task' ? 'Are you sure you want to delete this task completely? This action cannot be undone.' :
          confirmState.type === 'subtask' ? 'Are you sure you want to delete this subtask?' :
          confirmState.type === 'attachment' ? 'Are you sure you want to delete this attachment?' : 'Are you sure?'
        }
        confirmText="Delete"
        onConfirm={async () => {
          if (confirmState.type === 'task') {
            await performDeleteFullTask();
          } else if (confirmState.type === 'subtask') {
            await performDeleteSubtask(confirmState.payload);
          } else if (confirmState.type === 'attachment') {
            await performDeleteAttachment(confirmState.payload);
          }
          setConfirmState({ isOpen: false, type: null, payload: null });
        }}
      />

      {/* Backdrop */}
      <div
        className="popup-backdrop"
        onClick={() => showInvite ? setShowInvite(false) : onClose()}
      />

      {/* ── Main Panel ── */}
      <div className="popup-panel" role="dialog" aria-modal="true">

        {/* Header row */}
        <div className="popup-header">
          <button className="popup-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="popup-header-actions">
            {isEditing ? (
              <>
                <button className="popup-save-btn" onClick={saveEdit}>Save</button>
                <button className="popup-cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
              </>
            ) : (
              <>
                {/* Edit */}
                <button className="popup-icon-btn" onClick={startEdit} aria-label="Edit">
                  <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                {/* Delete Task */}
                <button className="popup-icon-btn popup-icon-btn--danger" onClick={deleteFullTask} aria-label="Delete Task" style={{ color: '#ef4444' }}>
                  <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6V20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        {isEditing
          ? <input
            className="popup-title-input"
            value={draft.title}
            onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
          />
          : <h2 className="popup-title">{task.title}</h2>
        }

        {/* ── Meta Grid ── */}
        <div className="popup-meta-grid">

          {/* Priority */}
          <div className="popup-meta-row">
            <div className="popup-meta-label">
              <Icon d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              Priority
            </div>
            <div className="popup-meta-val">
              {isEditing
                ? <input type="number" min="1" max="9"
                  className="popup-mini-input"
                  value={draft.priority}
                  style={{ width: 48, color: priorityColor }}
                  onChange={e => setDraft(d => ({ ...d, priority: +e.target.value }))}
                />
                : <span className="popup-priority-badge" style={{ backgroundColor: priorityColor }}>
                  {task.priority}
                </span>
              }
            </div>
          </div>

          {/* Status */}
          <div className="popup-meta-row">
            <div className="popup-meta-label">
              <Icon d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm0-18v8l3 3" />
              Status
            </div>
            <div className="popup-meta-val">
              {isEditing
                ? <input className="popup-mini-input popup-mini-input--wide"
                  value={draft.status}
                  onChange={e => setDraft(d => ({ ...d, status: e.target.value }))}
                />
                : <span className="popup-status-chip">{task.status}</span>
              }
            </div>
          </div>

          {/* Created date (read-only always) */}
          <div className="popup-meta-row">
            <div className="popup-meta-label">
              <Icon d="M3 4h18v2H3zm0 7h18v2H3zm0 7h18v2H3z" />
              Created date
            </div>
            <div className="popup-meta-val popup-meta-text">{formatDate(task.createdDate)}</div>
          </div>

          {/* Due date */}
          <div className="popup-meta-row">
            <div className="popup-meta-label">
              <Icon d="M3 4h18v2H3zm0 7h18v2H3zm0 7h18v2H3z" />
              Due date
            </div>
            <div className="popup-meta-val">
              {isEditing
                ? <input type="date" className="popup-mini-input popup-mini-input--wide"
                  value={draft.dueDate ? new Date(draft.dueDate).toISOString().split('T')[0] : ''}
                  onChange={e => {
                    const newDateStr = e.target.value;
                    setDraft(d => ({ ...d, dueDate: newDateStr ? new Date(newDateStr).toISOString() : null }));
                  }}
                />
                : <span className="popup-meta-text">{formatDate(task.dueDate)}</span>
              }
            </div>
          </div>

          {/* Progress */}
          <div className="popup-meta-row">
            <div className="popup-meta-label">
              <Icon d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 2v8l5 3" />
              Progress
            </div>
            <div className="popup-meta-val popup-meta-val--progress">
              <div className="popup-progress-bar">
                <div className="popup-progress-fill" style={{ width: `${derivedProgress}%` }} />
              </div>
              <span className="popup-progress-label">
                {derivedProgress}%
              </span>
            </div>
          </div>

          {/* Assignees */}
          <div className="popup-meta-row popup-meta-row--assignees">
            <div className="popup-meta-label">
              <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              Assignees
            </div>
            <div className="popup-meta-val popup-meta-val--assignees">
              {task.assignees.map((a, i) => (
                <div key={i} className="popup-avatar" title={a.name}>
                  {initials(a.name)}
                </div>
              ))}
              <button
                className="popup-invite-chip"
                onClick={() => setShowInvite(true)}
              >
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                Invite
              </button>
            </div>
          </div>

        </div>{/* /meta-grid */}

        {/* Description */}
        {isEditing
          ? <textarea
            className="popup-desc-textarea"
            value={draft.description}
            onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
          />
          : task.description && (
            <p className="popup-description">{task.description}</p>
          )
        }

        <hr className="popup-divider" />

        {/* ── Attachments ── */}
        <div className="popup-att-section">
          <div className="popup-att-header">
            <span className="popup-att-title">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              Attachments
            </span>
            <button className="popup-download-all-btn" onClick={downloadAll}>
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download All
            </button>
          </div>

          <div className="popup-att-list">
            {task.attachments.map(att => (
              <div
                key={att.id}
                className={`popup-att-card ${att.url ? 'clickable' : ''}`}
                onClick={() => downloadAtt(att)}
                title={att.url ? `Download ${att.name}` : 'No file attached'}
              >
                <div className="popup-att-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="#ef4444" strokeWidth="2" fill="none" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="popup-att-info">
                  <span className="popup-att-name">{att.name}</span>
                  <span className="popup-att-meta">{att.ext} • {att.size}</span>
                </div>
                {att.url && (
                  <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" className="popup-att-dl-icon">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                )}
                <button
                  className="popup-att-del-btn"
                  onClick={(e) => { e.stopPropagation(); deleteAttachment(att.id); }}
                  style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', marginLeft: 'auto', padding: '4px' }}
                  title="Delete Attachment"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6V20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            ))}

            {/* Add button */}
            <button
              className="popup-att-add-btn"
              onClick={() => fileInputRef.current.click()}
              title="Add attachment"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={handleFileAdd}
            />
          </div>
        </div>

        <hr className="popup-divider" />

        {/* ── Tabs ── */}
        <div className="popup-tabs">
          {[
            { key: 'subtasks', label: 'Subtasks', count: totalSubs },
            { key: 'comments', label: 'Comments', count: commentCount },
            { key: 'activities', label: 'Activities', count: null },
          ].map(t => (
            <button
              key={t.key}
              className={`popup-tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
              {t.count !== null && (
                <span className="popup-tab-count">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ══ Tab: Subtasks ══════════════════════════════════════ */}
        {activeTab === 'subtasks' && (
          <div className="popup-subtasks">
            {task.subtasks.length === 0 && (
              <p className="popup-empty-msg">No subtasks yet. Add one from the Activities tab.</p>
            )}
            {task.subtasks.map((sub, i) => (
              <div key={i} className="popup-subtask-block">
                {/* Row */}
                <div className="popup-subtask-row">
                  <button
                    className={`popup-checkbox ${sub.completed ? 'checked' : ''}`}
                    onClick={() => toggleSubtask(i)}
                    aria-label={sub.completed ? 'Mark undone' : 'Mark done'}
                  >
                    {sub.completed && <CheckIcon />}
                  </button>
                  <span className={`popup-subtask-label ${sub.completed ? 'done' : ''}`}>
                    {sub.title}
                  </span>
                  <button
                    className="popup-subtask-del-btn"
                    onClick={() => deleteSubtask(i)}
                    aria-label="Delete subtask"
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6V20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>

                {/* Subtask comment thread */}
                {sub.comments.length > 0 && (
                  <div className="popup-subtask-comments">
                    {sub.comments.map((c, ci) => (
                      <div key={ci} className="popup-thread-comment">
                        <div className="popup-thread-avatar">{initials(c.author)}</div>
                        <div className="popup-thread-body">
                          <div className="popup-thread-meta">
                            <span className="popup-thread-author">{c.author}</span>
                            <span className="popup-thread-time">{c.timestamp}</span>
                          </div>
                          <p className="popup-thread-text">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Subtask comment input */}
                <div className="popup-subtask-input-row">
                  <input
                    className="popup-subtask-comment-input"
                    placeholder="Add a comment on this subtask…"
                    value={subInputs[i] || ''}
                    onChange={e => setSubInputs(p => ({ ...p, [i]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addSubtaskComment(i)}
                  />
                  <button
                    className="popup-subtask-send-btn"
                    onClick={() => addSubtaskComment(i)}
                    aria-label="Send comment"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ Tab: Comments ══════════════════════════════════════ */}
        {activeTab === 'comments' && (
          <div className="popup-comments-tab">
            {task.generalComments.length === 0 && (
              <p className="popup-empty-msg">No comments yet. Start the conversation below.</p>
            )}
            <div className="popup-comments-list">
              {task.generalComments.map((c, i) => (
                <div key={i} className="popup-general-comment">
                  <div className="popup-thread-avatar">{initials(c.author)}</div>
                  <div className="popup-thread-body">
                    <div className="popup-thread-meta">
                      <span className="popup-thread-author">{c.author}</span>
                      <span className="popup-thread-time">{c.timestamp}</span>
                    </div>
                    <p className="popup-thread-text">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Assignees who can comment */}
            <div className="popup-comment-who">
              <span className="popup-comment-who-label">Commenting as</span>
              {task.assignees.slice(0, 1).map((a, i) => (
                <div key={i} className="popup-comment-assignee">
                  <div className="popup-thread-avatar popup-thread-avatar--sm">{initials(a.name)}</div>
                  <span>{a.name}</span>
                </div>
              ))}
            </div>

            {/* Comment box */}
            <div className="popup-comment-box">
              <textarea
                className="popup-comment-textarea"
                placeholder="Write a comment…"
                value={newComment}
                rows={3}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addGeneralComment();
                }}
              />
              <div className="popup-comment-box-footer">
                <span className="popup-comment-hint">Ctrl + Enter to send</span>
                <button className="popup-send-btn" onClick={addGeneralComment}>
                  Send
                  <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ Tab: Activities ════════════════════════════════════ */}
        {activeTab === 'activities' && (
          <div className="popup-activities-tab">
            {/* Add subtask from here */}
            <div className="popup-add-subtask-bar">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <input
                className="popup-add-subtask-input"
                placeholder="Add a new subtask…"
                value={newSubInput}
                onChange={e => setNewSubInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSubtaskFromActivities()}
              />
              <button className="popup-add-subtask-btn" onClick={addSubtaskFromActivities}>
                Add
              </button>
            </div>

            {/* Activity log */}
            <div className="popup-activity-list">
              {task.activities.map((a, i) => (
                <div key={i} className="popup-activity-item">
                  <div className="popup-activity-dot" />
                  <div className="popup-activity-content">
                    <p className="popup-activity-text">{a.text}</p>
                    <span className="popup-activity-time">{a.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>{/* /popup-panel */}

      {/* ══ Invite Modal ══════════════════════════════════════════ */}
      {showInvite && (
        <div className="popup-invite-modal" role="dialog" aria-label="Invite members">
          <div className="popup-invite-header">
            <h3 className="popup-invite-title">Invite Members</h3>
            <button className="popup-close-btn" onClick={() => setShowInvite(false)}>
              <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="popup-invite-search-wrap">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="popup-invite-search"
              placeholder="Search by name or role…"
              value={inviteSearch}
              onChange={e => setInviteSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* Employee list */}
          <div className="popup-invite-list">
            {filteredEmployees.map(emp => {
              const isAdded = !!task.assignees.find(a => a.name === emp.name);
              const isSelected = !!pendingInvitees.find(p => p.id === emp.id);
              return (
                <div
                  key={emp.id}
                  className={`popup-invite-item ${isAdded ? 'is-added' : ''} ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => !isAdded && toggleInvitee(emp)}
                >
                  <div className="popup-invite-avatar">{emp.initials}</div>
                  <div className="popup-invite-info">
                    <span className="popup-invite-name">{emp.name}</span>
                    <span className="popup-invite-role">{emp.role}</span>
                  </div>
                  <div className="popup-invite-status">
                    {isAdded
                      ? <span className="popup-invite-badge added">✓ Added</span>
                      : isSelected
                        ? <span className="popup-invite-badge selected">✓ Selected</span>
                        : <span className="popup-invite-badge empty">+ Add</span>
                    }
                  </div>
                </div>
              );
            })}
            {filteredEmployees.length === 0 && (
              <p className="popup-empty-msg">No employees match your search.</p>
            )}
          </div>

          {/* Footer */}
          <div className="popup-invite-footer">
            <button
              className="popup-cancel-btn"
              onClick={() => { setPendingInvitees([]); setShowInvite(false); }}
            >
              Cancel
            </button>
            <button
              className="popup-save-btn"
              onClick={confirmInvite}
              disabled={pendingInvitees.length === 0}
            >
              Add {pendingInvitees.length > 0 ? `(${pendingInvitees.length})` : ''}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
