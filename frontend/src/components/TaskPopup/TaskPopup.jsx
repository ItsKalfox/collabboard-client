import { useEffect, useState, useRef } from 'react';
import { X, Calendar, CheckSquare, Clock, AlignLeft, Users, CornerDownRight, Tag as TagIcon, Layout, FileText, Image as ImageIcon, FileCode, FileArchive, FileSpreadsheet, File, Loader2 } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { isProjectOwner } from '../../utils/projectUtils';
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

const getFileIcon = (ext) => {
  const e = (ext || '').toLowerCase();
  const props = { size: 20, strokeWidth: 2 };
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(e)) return <ImageIcon {...props} color="#10b981" />;
  if (['pdf'].includes(e)) return <FileText {...props} color="#ef4444" />;
  if (['doc', 'docx', 'txt', 'rtf'].includes(e)) return <FileText {...props} color="#3b82f6" />;
  if (['xls', 'xlsx', 'csv'].includes(e)) return <FileSpreadsheet {...props} color="#10b981" />;
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(e)) return <FileArchive {...props} color="#f59e0b" />;
  if (['json', 'js', 'html', 'css', 'ts', 'jsx', 'tsx'].includes(e)) return <FileCode {...props} color="#a855f7" />;
  return <File {...props} color="#64748b" />;
};

/* ─── Main component ────────────────────────────────────────── */
export default function TaskPopup({ task: prop, project, currentUser, onClose, onUpdate }) {
  const currentUserId = typeof currentUser === 'object' ? (currentUser?.id || currentUser?._id) : null;
  
  const assigneeId = typeof prop.assigneeId === 'object' ? (prop.assigneeId?.id || prop.assigneeId?._id) : prop.assigneeId;
  const ownerId = typeof project?.ownerId === 'object' ? (project?.ownerId?.id || project?.ownerId?._id) : project?.ownerId;
  
  const isAssignee = String(assigneeId) === String(currentUserId);
  const isOwner = String(ownerId) === String(currentUserId);
  
  const currentUserMember = (project?.members || []).find(m => String(m.userId || m.id || m._id) === String(currentUserId));
  const hasReviewAccess = currentUserMember ? currentUserMember.reviewAccess : false;
  const canApprove = isOwner || hasReviewAccess;

  const isReadOnly = !isAssignee && !isOwner;

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
  const [isUploading, setIsUploading] = useState(false);
  const [draft, setDraft] = useState({});
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowAssigneeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const startEdit = () => {
    setDraft({
      title: task.title,
      description: task.description,
      status: task.status,
      dueDate: task.dueDate,
      priority: task.priority,
      progress: task.progress,
      assigneeId: typeof task.assigneeId === 'object' ? task.assigneeId?._id || task.assigneeId?.id : task.assigneeId
    });
    setIsEditing(true);
  };

  const saveEdit = async (e) => {
    if (e) e.preventDefault();
    console.log("saveEdit triggered", { draft, task });
    try {
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
            dueDate: draft.dueDate,
            assigneeId: draft.assigneeId
          })
        });
      } catch (err) {
        console.error('Failed to update task via fetch:', err);
      }
      
      setTask(t => {
        let newAssigneeObj = t.assigneeId;
        const currentAssigneeId = typeof t.assigneeId === 'object' ? (t.assigneeId?._id || t.assigneeId?.id) : t.assigneeId;
        
        if (String(draft.assigneeId) !== String(currentAssigneeId)) {
          const userObj = String(draft.assigneeId) === String(currentUserId) 
            ? currentUser 
            : (project?.members?.find(m => String(m.id || m.userId) === String(draft.assigneeId)) || 
               (String(project?.ownerId?._id || project?.ownerId?.id) === String(draft.assigneeId) ? project?.ownerId : null));
               
          if (userObj) {
            newAssigneeObj = {
              _id: draft.assigneeId,
              name: userObj.name,
              avatar: userObj.avatar
            };
          } else {
            newAssigneeObj = draft.assigneeId;
          }
        }

        return {
          ...t,
          ...draft,
          assigneeId: newAssigneeObj,
          activities: [
            { text: 'Task details were updated', timestamp: fmtNow() },
            ...(t.activities || []),
          ],
        };
      });
      console.log("setTask called");
      
      if (onUpdate) onUpdate();
      console.log("onUpdate called");
      
      setIsEditing(false);
      console.log("setIsEditing(false) called");
    } catch (criticalError) {
      console.error("CRITICAL ERROR IN saveEdit:", criticalError);
      alert("Error saving: " + criticalError.message);
    }
  };

  /* ── Confirm Modal State ── */
  const [confirmState, setConfirmState] = useState({ isOpen: false, type: null, payload: null });

  const deleteFullTask = () => {
    if (isReadOnly) return;
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

  /* ── Subtasks ── */
  const toggleSubtask = async (i) => {
    if (isReadOnly) return;
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

      // Calculate auto-move logic based on new completion status
      const subs = task.subtasks.map((s, idx) => idx === i ? { ...s, completed: newCompleted } : s);
      const totalSubs = subs.length;
      const doneSubs = subs.filter(s => s.completed).length;
      
      let newStatus = task.status;
      if (task.status === 'todo' && doneSubs > 0) {
        newStatus = 'in_progress';
      }

      if (newStatus !== task.status) {
        await fetch(`${apiUrl}/tasks/${task.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ status: newStatus })
        });
      }

      setTask(t => {
        const verb = newCompleted ? 'completed' : 'reopened';
        return {
          ...t,
          subtasks: subs,
          status: newStatus,
          activities: [{ text: `Subtask "${subs[i].title}" ${verb}`, timestamp: fmtNow() }, ...(t.activities || [])],
        };
      });
      if (onUpdate) onUpdate();
    } catch (e) {
      console.error('Failed to toggle subtask', e);
    }
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
      activities: [{ text: `Subtask "${targetSub.title}" deleted`, timestamp: fmtNow() }, ...(t.activities || [])],
    }));
    if (onUpdate) onUpdate();
  };

  const handleApprove = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      
      await fetch(`${apiUrl}/tasks/${task.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'completed', isApproved: true })
      });
      
      setTask(t => ({ 
        ...t, 
        status: 'completed', 
        isApproved: true,
        activities: [{ text: `Task was approved and moved to Done`, timestamp: fmtNow() }, ...(t.activities || [])]
      }));
      if (onUpdate) onUpdate();
    } catch (e) {
      console.error('Failed to approve task', e);
    }
  };

  /* ── Add subtask ── */
  const [newSubInput, setNewSubInput] = useState('');
  const [newSubDesc, setNewSubDesc] = useState('');

  const addSubtask = async () => {
    const title = newSubInput.trim();
    const description = newSubDesc.trim();
    if (!title) return;

    let subData = { title, description, completed: false, comments: [] };

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/tasks/${task.id}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, completed: false })
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
      activities: [{ text: `New subtask added: "${title}"`, timestamp: fmtNow() }, ...(t.activities || [])],
    }));
    setNewSubInput('');
    setNewSubDesc('');
    if (onUpdate) onUpdate();
  };

  /* ── Edit subtask ── */
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editSubtaskDraft, setEditSubtaskDraft] = useState({ title: '', description: '' });

  const startEditSubtask = (i) => {
    const sub = task.subtasks[i];
    setEditingSubtaskId(i);
    setEditSubtaskDraft({ title: sub.title, description: sub.description || '' });
  };

  const saveEditSubtask = async (i) => {
    const targetSub = task.subtasks[i];
    const newTitle = editSubtaskDraft.title.trim() || targetSub.title;
    const newDesc = editSubtaskDraft.description.trim();

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      await fetch(`${apiUrl}/subtasks/${targetSub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle, description: newDesc })
      });
    } catch (e) {
      console.error('Failed to edit subtask', e);
    }

    setTask(t => {
      const subs = t.subtasks.map((s, idx) => idx === i ? { ...s, title: newTitle, description: newDesc } : s);
      return {
        ...t,
        subtasks: subs,
        activities: [{ text: `Subtask "${targetSub.title}" updated`, timestamp: fmtNow() }, ...(t.activities || [])],
      };
    });
    setEditingSubtaskId(null);
    if (onUpdate) onUpdate();
  };



  /* ── Attachments ── */
  const handleFileAdd = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = ''; // Reset immediately
    
    if (files.length === 0) return;
    setIsUploading(true);
    
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
      const successfulUploads = uploadedAtts.filter(a => a !== null).map(apiAtt => {
        const original = apiAtt.originalname || apiAtt.filename;
        return {
          id: apiAtt.id,
          originalname: apiAtt.originalname,
          name: original ? original.replace(/\.[^.]+$/, '') : 'Attachment',
          ext: original ? original.split('.').pop().toUpperCase() : 'FILE',
          size: apiAtt.size ? (apiAtt.size / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown',
          url: apiAtt.url
        };
      });
      
      if (successfulUploads.length > 0) {
        setTask(t => ({
          ...t,
          attachments: [...(t.attachments || []), ...successfulUploads],
          activities: [
            { text: `${successfulUploads.length} attachment(s) added`, timestamp: fmtNow() },
            ...(t.activities || []),
          ],
        }));
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error('Failed to upload attachment(s)', err);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadAtt = async (att) => {
    if (!att.url) return;
    try {
      const res = await fetch(att.url);
      if (!res.ok) throw new Error('Network response was not ok');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      
      const ext = (att.ext || 'file').toLowerCase();
      let targetName = att.originalname || att.name || `attachment_${att.id}`;
      if (ext !== 'file' && !targetName.toLowerCase().endsWith(`.${ext}`)) {
        targetName = `${targetName}.${ext}`;
      }
      
      a.download = targetName;
      a.setAttribute('download', targetName);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error('Download failed via blob fetch, falling back to new tab', e);
      window.open(att.url, '_blank');
    }
  };

  const downloadAll = () => task.attachments.filter(a => a.url).forEach(downloadAtt);

  const deleteAttachment = (attId) => {
    setConfirmState({ isOpen: true, type: 'attachment', payload: attId });
  };

  const performDeleteAttachment = async (attId) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      await fetch(`${apiUrl}/tasks/${task.id}/attachments/${attId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error('Failed to delete attachment', e);
    }
    setTask(t => ({
      ...t,
      attachments: t.attachments.filter(a => a.id !== attId),
      activities: [{ text: `Attachment deleted`, timestamp: fmtNow() }, ...(t.activities || [])],
    }));
    if (onUpdate) onUpdate();
  };

  /* ── Keyboard close ── */
  useEffect(() => {
    const h = e => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  /* ── Derived values ── */
  const getPriorityColor = (p) => 
    p === 'high' ? '#ef4444' :
      p === 'medium' ? '#f59e0b' : '#22c55e';
  const getTagColor = (p) => p === 'high' ? 'red' : p === 'medium' ? 'amber' : p === 'low' ? 'green' : 'cyan';
  const getTagText = (p) => p === 'high' ? 'High Priority' : p === 'medium' ? 'Medium Priority' : p === 'low' ? 'Low Priority' : 'Task';
  const formatStatus = (s) => {
    if (!s) return 'To Do';
    switch (s.toLowerCase()) {
      case 'todo': return 'To Do';
      case 'in_progress': return 'In Progress';
      case 'review':
      case 'need_review': return 'Need Review';
      case 'completed':
      case 'done': return 'Done';
      default:
        return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  };
  const priorityColor = getPriorityColor(task.priority || 'medium');

  const totalSubs = task.subtasks.length;
  const doneSubs = task.subtasks.filter(s => s.completed).length;
  const derivedProgress = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0;

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
        onClick={() => onClose()}
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
            ) : !isReadOnly && (
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

        {/* Description */}
        {isEditing
          ? <textarea
            className="popup-desc-textarea"
            value={draft.description}
            onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
            style={{ marginBottom: '24px' }}
          />
          : task.description && (
            <p className="popup-description" style={{ marginBottom: '24px' }}>{task.description}</p>
          )
        }

        {/* ── Meta Grid ── */}
        <div className="popup-meta-grid">

          {/* Assignee */}
          <div className="popup-meta-row">
            <div className="popup-meta-label">
              <Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
              Assignee
            </div>
            <div className="popup-meta-val" style={{ position: 'relative' }} ref={dropdownRef}>
              {isEditing ? (
                <>
                  <div 
                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)} 
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 12px', border: '1px solid var(--popup-btn-border)', borderRadius: '6px', background: 'var(--popup-btn-bg)' }}
                  >
                    {(() => {
                      const user = draft.assigneeId === currentUserId ? currentUser : (project?.members?.find(m => m.id === draft.assigneeId || m.userId === draft.assigneeId || m.name === draft.assigneeId) || (project?.ownerId?._id === draft.assigneeId || project?.ownerId?.id === draft.assigneeId ? project?.ownerId : null));
                      
                      if (user) {
                        return (
                          <>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
                              {user.avatar ? <img src={user.avatar} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : initials(user.name || 'Unknown')}
                            </div>
                            <span style={{ fontSize: '13px', color: 'var(--popup-text-main)' }}>{user.name}</span>
                          </>
                        );
                      }
                      return <span style={{ fontSize: '13px', color: 'var(--popup-text-main)' }}>Select Assignee</span>;
                    })()}
                    <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" style={{ marginLeft: 'auto' }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  {showAssigneeDropdown && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, width: '220px', background: 'var(--popup-bg)', border: '1px solid var(--popup-border, var(--border-color))', borderRadius: '8px', boxShadow: 'var(--popup-shadow, 0 4px 12px rgba(0,0,0,0.3))', zIndex: 999, marginTop: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                      <div 
                        onClick={() => { setDraft(d => ({ ...d, assigneeId: currentUserId })); setShowAssigneeDropdown(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                        className="hover-bg"
                      >
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
                          {currentUser?.avatar ? <img src={currentUser.avatar} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : initials(currentUser?.name || 'Unknown')}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{currentUser?.name || 'You'} (You)</div>
                      </div>
                      {(project?.members || []).filter(m => String(m.id || m.userId) !== String(currentUserId)).map(m => (
                        <div 
                          key={m.id || m.userId || m.name}
                          onClick={() => { setDraft(d => ({ ...d, assigneeId: m.id || m.userId || m.name })); setShowAssigneeDropdown(false); }}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                          className="hover-bg"
                        >
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
                            {m.avatar ? <img src={m.avatar} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : initials(m.name || 'Unknown')}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{m.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : task.assigneeId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: '#3b82f6', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#fff', fontSize: '10px',
                    fontWeight: '700', overflow: 'hidden', flexShrink: 0
                  }}>
                    {typeof task.assigneeId === 'object' && task.assigneeId.avatar ? (
                      <img src={task.assigneeId.avatar} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    ) : (
                      initials(typeof task.assigneeId === 'object' ? task.assigneeId.name : 'Unknown')
                    )}
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--popup-text-main)', fontWeight: '500' }}>
                    {typeof task.assigneeId === 'object' ? task.assigneeId.name : 'Unknown'} {isAssignee ? '(You)' : ''}
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: '13px', color: 'var(--popup-text-muted)' }}>Unassigned</span>
              )}
            </div>
          </div>

          {/* Priority */}
          <div className="popup-meta-row">
            <div className="popup-meta-label">
              <Icon d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              Priority
            </div>
            <div className="popup-meta-val">
              {isEditing
                ? <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" onClick={() => setDraft(d => ({ ...d, priority: 'low' }))} style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '600', borderRadius: '12px', border: draft.priority === 'low' ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--popup-btn-border)', background: draft.priority === 'low' ? 'rgba(16, 185, 129, 0.15)' : 'transparent', color: draft.priority === 'low' ? '#10b981' : 'var(--popup-text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>Low</button>
                    <button type="button" onClick={() => setDraft(d => ({ ...d, priority: 'medium' }))} style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '600', borderRadius: '12px', border: draft.priority === 'medium' ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--popup-btn-border)', background: draft.priority === 'medium' ? 'rgba(245, 158, 11, 0.15)' : 'transparent', color: draft.priority === 'medium' ? '#f59e0b' : 'var(--popup-text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>Medium</button>
                    <button type="button" onClick={() => setDraft(d => ({ ...d, priority: 'high' }))} style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '600', borderRadius: '12px', border: draft.priority === 'high' ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--popup-btn-border)', background: draft.priority === 'high' ? 'rgba(239, 68, 68, 0.15)' : 'transparent', color: draft.priority === 'high' ? '#ef4444' : 'var(--popup-text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>High</button>
                  </div>
                : <span className={`task-tag-pill tag-${getTagColor(task.priority)}`}>
                  {getTagText(task.priority)}
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
            <div className="popup-meta-val popup-meta-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {formatStatus(task.status)}
              {(() => {
                return task.status === 'review' && !task.isApproved ? (
                  <button 
                    onClick={handleApprove}
                    disabled={!canApprove}
                    title={!canApprove ? "Only the project owner or designated reviewers can approve this task" : "Approve this task"}
                    style={{ marginLeft: 'auto', padding: '6px 14px', fontSize: '13px', fontWeight: 600, backgroundColor: !canApprove ? '#9ca3af' : '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: !canApprove ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                  >
                    Approve Task
                  </button>
                ) : task.isApproved ? (
                  <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#10b981', fontWeight: 600 }}>✓ Approved</span>
                ) : null;
              })()}
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



        </div>{/* /meta-grid */}

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
            {(task.attachments || []).map(rawAtt => {
              const original = rawAtt.originalname || rawAtt.filename || '';
              const attName = rawAtt.name || (original ? original.replace(/\.[^.]+$/, '') : 'Attachment');
              const attExt = rawAtt.ext || (original && original.includes('.') ? original.split('.').pop().toUpperCase() : 'FILE');
              const attSize = typeof rawAtt.size === 'number' ? (rawAtt.size / (1024*1024)).toFixed(2) + ' MB' : (rawAtt.size || 'Unknown');
              const att = { ...rawAtt, id: rawAtt.id || rawAtt._id, name: attName, ext: attExt, size: attSize };
              
              return (
              <div
                key={att.id}
                className={`popup-att-card ${att.url ? 'clickable' : ''}`}
                onClick={() => downloadAtt(att)}
                title={att.url ? `Download ${att.name}` : 'No file attached'}
              >
                <div className="popup-att-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getFileIcon(att.ext)}
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
                {!isReadOnly && (
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
                )}
              </div>
            )})}

            {/* Add button */}
            {!isReadOnly && (
              <button
                className="popup-att-add-btn"
                onClick={() => !isUploading && fileInputRef.current.click()}
                title="Add attachment"
                disabled={isUploading}
                style={{ opacity: isUploading ? 0.6 : 1, cursor: isUploading ? 'not-allowed' : 'pointer' }}
              >
                {isUploading ? (
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
              </button>
            )}
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
            {/* Add subtask from here */}
            {!isReadOnly && (
              <div className="popup-add-subtask-bar" style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px', padding: '12px', background: 'var(--bg-sec)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <input
                    className="popup-add-subtask-input"
                    placeholder="New subtask title…"
                    value={newSubInput}
                    onChange={e => setNewSubInput(e.target.value)}
                    style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: 'inherit', textAlign: 'left', fontFamily: 'inherit' }}
                  />
                </div>
                <textarea
                  placeholder="Subtask description (optional)…"
                  value={newSubDesc}
                  onChange={e => setNewSubDesc(e.target.value)}
                  style={{ width: '100%', minHeight: '60px', background: 'var(--popup-input-bg)', border: 'var(--popup-input-border)', borderRadius: '6px', padding: '10px', color: 'var(--popup-input-text)', resize: 'vertical', fontFamily: 'inherit', textAlign: 'left', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                />
                <button className="popup-add-subtask-btn" onClick={addSubtask} style={{ alignSelf: 'flex-end', marginTop: '4px' }}>
                  Add Subtask
                </button>
              </div>
            )}

            {task.subtasks.length === 0 && (
              <p className="popup-empty-msg">No subtasks yet. Add one above.</p>
            )}
            {task.subtasks.map((sub, i) => (
              <div key={i} className="popup-subtask-block">
                {editingSubtaskId === i ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', padding: '12px', background: 'var(--bg-sec)', borderRadius: '8px' }}>
                    <input
                      value={editSubtaskDraft.title}
                      onChange={e => setEditSubtaskDraft(d => ({ ...d, title: e.target.value }))}
                      placeholder="Title"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: 'var(--popup-input-border)', background: 'var(--popup-input-bg)', color: 'var(--popup-input-text)', textAlign: 'left', fontFamily: 'inherit' }}
                    />
                    <textarea
                      value={editSubtaskDraft.description}
                      onChange={e => setEditSubtaskDraft(d => ({ ...d, description: e.target.value }))}
                      placeholder="Description"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: 'var(--popup-input-border)', background: 'var(--popup-input-bg)', color: 'var(--popup-input-text)', minHeight: '60px', resize: 'vertical', textAlign: 'left', fontFamily: 'inherit' }}
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditingSubtaskId(null)} style={{ padding: '6px 12px', borderRadius: '6px', background: 'transparent', border: '1px solid var(--border-color)', color: 'inherit', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={() => saveEditSubtask(i)} style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer' }}>Save</button>
                    </div>
                  </div>
                ) : (
                  <div className="popup-subtask-row" style={{ alignItems: 'flex-start', padding: '8px 0' }}>
                    <button
                      className={`popup-checkbox ${sub.completed ? 'checked' : ''}`}
                      onClick={() => !isReadOnly && toggleSubtask(i)}
                      aria-label={sub.completed ? 'Mark undone' : 'Mark done'}
                      style={{ marginTop: '2px', cursor: isReadOnly ? 'default' : 'pointer' }}
                    >
                      {sub.completed && <CheckIcon />}
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' }}>
                      <span className={`popup-subtask-label ${sub.completed ? 'done' : ''}`} style={{ textAlign: 'center' }}>
                        {sub.title}
                      </span>
                      {sub.description && (
                        <span style={{ fontSize: '13.5px', color: 'var(--popup-text-muted)', whiteSpace: 'pre-wrap', lineHeight: '1.4', textAlign: 'left', display: 'block', fontFamily: 'inherit' }}>
                          {sub.description}
                        </span>
                      )}
                    </div>
                    {!isReadOnly && (
                      <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto', paddingTop: '4px' }}>
                        <button
                          className="popup-subtask-edit-btn"
                          onClick={() => startEditSubtask(i)}
                          aria-label="Edit subtask"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className="popup-subtask-del-btn"
                          onClick={() => deleteSubtask(i)}
                          aria-label="Delete subtask"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6V20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}


        {/* ══ Tab: Activities ════════════════════════════════════ */}
        {activeTab === 'activities' && (
          <div className="popup-activities-tab">
            {/* Activity log */}
            <div className="popup-activity-list">
              {(task.activities || []).map((a, i) => (
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


    </>
  );
}
