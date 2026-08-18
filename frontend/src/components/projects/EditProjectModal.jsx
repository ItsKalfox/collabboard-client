import { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { MOCK_MEMBERS, normalizeMember } from '../../mock/mockMembers';
import '../TaskPopup/TaskPopup.css';
import './projects.css';

export default function EditProjectModal({
  isOpen,
  onClose,
  project,
  onSave,
  theme = 'dark',
}) {
  const lightCls = theme === 'light' ? ' light' : '';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('');
  const [createdDate, setCreatedDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // Members state
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const memberSearchWrapRef = useRef(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setOwner(project.owner || '');
      setCreatedDate(project.rawCreatedDate || '');
      setDueDate(project.rawDueDate || '');
      setMembers(Array.isArray(project.members) ? project.members.map(normalizeMember) : []);
    }
  }, [project]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (memberSearchWrapRef.current && !memberSearchWrapRef.current.contains(e.target)) {
        setShowMemberDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen || !project) return null;

  const availableMembers = MOCK_MEMBERS.filter(m => 
    !members.some(existing => existing.name === m.name) &&
    (m.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
     m.role.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  const addMember = (memberObj) => {
    const normalized = normalizeMember(memberObj);
    if (!members.some(m => m.name === normalized.name)) {
      setMembers([...members, normalized]);
    }
    setMemberSearch('');
    setShowMemberDropdown(false);
  };

  const removeMember = (memberName) => {
    setMembers(members.filter(m => m.name !== memberName));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    let formattedCreated = project.createdDate;
    if (createdDate && createdDate.includes('-')) {
      const parts = createdDate.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      if (!isNaN(d.getTime())) {
        formattedCreated = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }

    let formattedDue = project.dueDate;
    if (dueDate && dueDate.includes('-')) {
      const parts = dueDate.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      if (!isNaN(d.getTime())) {
        formattedDue = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }

    onSave({
      ...project,
      name: name.trim(),
      description: description.trim(),
      owner: owner.trim() || project.owner,
      createdDate: formattedCreated,
      dueDate: formattedDue,
      rawCreatedDate: createdDate,
      rawDueDate: dueDate,
      members: members
    });
    onClose();
  };

  return (
    <div className="popup-backdrop" onClick={onClose}>
      <div className={`popup-panel${lightCls}`} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="popup-header">
          <button className="popup-close-btn" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={2.5} />
          </button>
          <div className="popup-header-actions">
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--popup-text-muted)' }}>Edit Project</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="popup-content" style={{ overflowY: 'auto', padding: '0 20px 20px', maxHeight: 'calc(100vh - 140px)' }}>
            
            {/* Title */}
            <input
              className="popup-title-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project Name..."
              style={{ marginBottom: '16px', textAlign: 'center' }}
            />

            {/* Description */}
            <textarea
              className="popup-desc-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project Description..."
              style={{ marginBottom: '24px', minHeight: '90px' }}
            />

            <div className="popup-meta-grid" style={{ marginBottom: '24px' }}>
              {/* Owner */}
              <div className="popup-meta-row">
                <div className="popup-meta-label">Owner</div>
                <div className="popup-meta-val">
                  <input
                    className="popup-mini-input popup-mini-input--wide"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                  />
                </div>
              </div>

              {/* Created Date Picker */}
              <div className="popup-meta-row">
                <div className="popup-meta-label">Created date</div>
                <div className="popup-meta-val">
                  <input
                    type="date"
                    className="popup-mini-input popup-mini-input--wide"
                    value={createdDate}
                    onChange={(e) => setCreatedDate(e.target.value)}
                    style={{ colorScheme: theme === 'light' ? 'light' : 'dark' }}
                  />
                </div>
              </div>

              {/* Due Date Picker */}
              <div className="popup-meta-row">
                <div className="popup-meta-label">Due date</div>
                <div className="popup-meta-val">
                  <input
                    type="date"
                    className="popup-mini-input popup-mini-input--wide"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={{ colorScheme: theme === 'light' ? 'light' : 'dark' }}
                  />
                </div>
              </div>
            </div>

            <hr className="popup-divider" style={{ margin: '0 -20px 24px' }}/>

            {/* Team Members Search & Select */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', color: 'var(--popup-text-heading)', marginBottom: '12px', fontWeight: '600' }}>Project Members</h4>
              
              <div className="member-picker" ref={memberSearchWrapRef} style={{ position: 'relative', marginBottom: '16px' }}>
                <div className="member-search-wrap" style={{ position: 'relative' }}>
                  <Search size={14} className="member-search-icon" style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--popup-text-muted)' }} />
                  <input
                    type="text"
                    className="popup-mini-input"
                    style={{ width: '100%', paddingLeft: '32px', paddingRight: memberSearch ? '32px' : '10px', fontSize: '13px', height: '34px', boxSizing: 'border-box' }}
                    placeholder="Search members to add..."
                    value={memberSearch}
                    onChange={e => {
                      setMemberSearch(e.target.value);
                      setShowMemberDropdown(true);
                    }}
                    onFocus={() => setShowMemberDropdown(true)}
                  />
                  {memberSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setMemberSearch('');
                        setShowMemberDropdown(false);
                      }}
                      style={{ position: 'absolute', right: '10px', top: '9px', background: 'transparent', border: 'none', color: 'var(--popup-text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {showMemberDropdown && availableMembers.length > 0 && (
                  <div className="member-dropdown" style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99,
                    maxHeight: '180px', overflowY: 'auto',
                    background: 'var(--popup-card-bg)', border: 'var(--popup-card-border)',
                    borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', marginTop: '4px'
                  }}>
                    {availableMembers.map(emp => (
                      <div
                        key={emp.id || emp.name}
                        onClick={() => addMember(emp)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 12px', cursor: 'pointer',
                          borderBottom: '1px solid rgba(255,255,255,0.05)'
                        }}
                      >
                        <div style={{
                          width: '26px', height: '26px', borderRadius: '50%',
                          background: emp.bg || '#3b82f6', color: '#fff',
                          fontSize: '10px', fontWeight: '700',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          overflow: 'hidden'
                        }}>
                          {emp.avatar ? <img src={emp.avatar} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : emp.initials}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--popup-text-main)' }}>{emp.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--popup-text-muted)' }}>{emp.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showMemberDropdown && memberSearch && availableMembers.length === 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99,
                    background: 'var(--popup-card-bg)', border: 'var(--popup-card-border)',
                    borderRadius: '8px', padding: '10px 12px', marginTop: '4px',
                    fontSize: '12px', color: 'var(--popup-text-muted)', textAlign: 'center'
                  }}>
                    No matching team members found
                  </div>
                )}
              </div>

              {/* Members Chips */}
              {members.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {members.map(m => (
                    <div key={m.name} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: 'var(--popup-card-bg)', padding: '4px 10px 4px 6px',
                      borderRadius: '20px', border: 'var(--popup-card-border)'
                    }}>
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: m.bg || '#3b82f6', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '10px', fontWeight: '700', overflow: 'hidden'
                      }}>
                        {m.avatar ? <img src={m.avatar} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.initials}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--popup-text-main)', fontWeight: '500' }}>{m.name}</span>
                      <button
                        type="button"
                        onClick={() => removeMember(m.name)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', display: 'flex' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: 'var(--popup-divider)' }}>
            <button type="button" className="popup-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="popup-save-btn" disabled={!name.trim()}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}