import React, { useState, useRef, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { REGISTERED_USERS } from './mockData';
import './projects.css';

const COLOR_OPTIONS = [
  { key: 'blue', hex: '#3b82f6' },
  { key: 'green', hex: '#10b981' },
  { key: 'yellow', hex: '#f59e0b' },
  { key: 'red', hex: '#f43f5e' },
  { key: 'purple', hex: '#a855f7' },
];

function formatToday() {
  const d = new Date();
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CreateProjectModal({ isOpen, onClose, onCreate, theme = 'dark' }) {
  const lightCls = theme === 'light' ? ' light' : '';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('');
  const [members, setMembers] = useState([]);
  const [color, setColor] = useState('blue');

  // member picker state
  const [memberQuery, setMemberQuery] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const memberWrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (memberWrapRef.current && !memberWrapRef.current.contains(e.target)) {
        setShowMemberDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const memberSuggestions = REGISTERED_USERS.filter(
    (u) => !members.includes(u) && u.toLowerCase().includes(memberQuery.toLowerCase())
  );

  const addMember = (u) => {
    setMembers((prev) => [...prev, u]);
    setMemberQuery('');
    setShowMemberDropdown(false);
  };

  const removeMember = (u) => {
    setMembers((prev) => prev.filter((m) => m !== u));
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setOwner('');
    setMembers([]);
    setColor('blue');
    setMemberQuery('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (!name.trim() || !owner.trim()) return;

    const newProject = {
      id: `proj-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      owner: owner.trim(),
      members: members.length > 0 ? members : [owner.trim()],
      color,
      createdDate: formatToday(),
      status: 'Planning',
    };

    onCreate(newProject);
    resetForm();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className={`modal-panel${lightCls}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">New Project</h3>
          <button className="modal-close-btn" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input
              className="form-input"
              placeholder="e.g. Website Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              placeholder="Short description of the project"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Owner</label>
            <input
              className="form-input"
              placeholder="e.g. John"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>

          {/* Member picker: search + chips, inline */}
          <div className="form-group">
            <label className="form-label">Members</label>
            <div className="member-picker" ref={memberWrapRef}>
              {members.length > 0 && (
                <div className="member-chip-row">
                  {members.map((m) => (
                    <span key={m} className="member-chip">
                      {m}
                      <button
                        type="button"
                        className="member-chip-remove"
                        onClick={() => removeMember(m)}
                        title={`Remove ${m}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="member-search-wrap">
                <Search size={14} className="member-search-icon" />
                <input
                  className="form-input member-search-input"
                  placeholder="Search and add members..."
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  onFocus={() => setShowMemberDropdown(true)}
                />
              </div>

              {showMemberDropdown && memberSuggestions.length > 0 && (
                <div className="member-dropdown">
                  {memberSuggestions.map((u) => (
                    <button
                      type="button"
                      key={u}
                      className="member-dropdown-item"
                      onClick={() => addMember(u)}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              )}

              {showMemberDropdown && memberQuery && memberSuggestions.length === 0 && (
                <div className="member-dropdown">
                  <div className="member-dropdown-empty">No matching members</div>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-picker">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={`color-swatch${color === c.key ? ' selected' : ''}`}
                  style={{ backgroundColor: c.hex }}
                  onClick={() => setColor(c.key)}
                  title={c.key}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={!name.trim() || !owner.trim()}>
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}