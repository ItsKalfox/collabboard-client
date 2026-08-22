import { useState, useRef, useEffect } from 'react';
import './Settings.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = (isJson = true) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

/* ── Tiny helper components ─────────────────────────────── */

function Alert({ type, message }) {
  if (!message) return null;
  return (
    <div className={`settings-alert settings-alert-${type}`}>
      {type === 'success' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      {message}
    </div>
  );
}

function Spinner({ dark }) {
  return (
    <span
      className="settings-btn-spinner"
      style={dark ? { borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000' } : {}}
    />
  );
}

/* ── Eye icon toggle ──────────────────────────────────── */
function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

/* ── Upload icon ─────────────────────────────────────── */
function UploadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN SETTINGS PAGE
   ════════════════════════════════════════════════════════ */

export default function Settings({ currentUser, setCurrentUser }) {
  /* ── Derive first/last name from user object ──────────── */
  const getFirstName = (user) => {
    if (!user) return '';
    if (user.firstName) return user.firstName;
    if (user.name) return user.name.split(' ')[0] || '';
    return '';
  };
  const getLastName = (user) => {
    if (!user) return '';
    if (user.lastName) return user.lastName;
    if (user.name) {
      const parts = user.name.split(' ');
      return parts.slice(1).join(' ') || '';
    }
    return '';
  };

  /* ── Profile picture state ──────────────────────────── */
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarAlert, setAvatarAlert] = useState({ type: '', msg: '' });
  const fileInputRef = useRef(null);

  /* ── Name state ─────────────────────────────────────── */
  const [firstName, setFirstName] = useState(getFirstName(currentUser));
  const [lastName, setLastName]   = useState(getLastName(currentUser));
  const [nameSaving, setNameSaving] = useState(false);
  const [nameAlert, setNameAlert]   = useState({ type: '', msg: '' });

  /* ── Email state ────────────────────────────────────── */
  const [email, setEmail]       = useState(currentUser?.email || '');
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailPassword, setEmailPassword] = useState('');
  const [emailSaving, setEmailSaving]     = useState(false);
  const [emailAlert, setEmailAlert]       = useState({ type: '', msg: '' });

  /* ── Password state ─────────────────────────────────── */
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [showCurr,   setShowCurr]   = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [pwSaving,   setPwSaving]   = useState(false);
  const [pwAlert,    setPwAlert]    = useState({ type: '', msg: '' });

  /* keep fields in sync if parent refetches user */
  useEffect(() => {
    setFirstName(getFirstName(currentUser));
    setLastName(getLastName(currentUser));
    setEmail(currentUser?.email || '');
  }, [currentUser]);

  /* auto-clear alerts */
  const autoClose = (setter, ms = 4000) => setTimeout(() => setter({ type: '', msg: '' }), ms);

  /* ─────────────────────────────────────────────────────
     Avatar handlers
  ───────────────────────────────────────────────────── */
  const handleAvatarSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    setAvatarUploading(true);
    setAvatarAlert({ type: '', msg: '' });

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res  = await fetch(`${API_URL}/users/avatar`, {
        method: 'POST',
        headers: getAuthHeaders(false),
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Upload failed');

      setCurrentUser(data.data.user);
      setAvatarAlert({ type: 'success', msg: 'Profile picture updated!' });
      autoClose(setAvatarAlert);
    } catch (err) {
      setAvatarAlert({ type: 'error', msg: err.message });
      autoClose(setAvatarAlert);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!currentUser?.avatar) return;
    setAvatarUploading(true);
    setAvatarAlert({ type: '', msg: '' });

    try {
      const res  = await fetch(`${API_URL}/users/avatar`, {
        method: 'DELETE',
        headers: getAuthHeaders(false),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Remove failed');

      setCurrentUser(data.data.user);
      setAvatarAlert({ type: 'success', msg: 'Profile picture removed.' });
      autoClose(setAvatarAlert);
    } catch (err) {
      setAvatarAlert({ type: 'error', msg: err.message });
      autoClose(setAvatarAlert);
    } finally {
      setAvatarUploading(false);
    }
  };

  /* ─────────────────────────────────────────────────────
     Name handler
  ───────────────────────────────────────────────────── */
  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setNameAlert({ type: 'error', msg: 'First name and last name cannot be empty.' });
      return;
    }
    setNameSaving(true);
    setNameAlert({ type: '', msg: '' });

    try {
      const res  = await fetch(`${API_URL}/auth/profile`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Update failed');

      setCurrentUser(data.data.user);
      setNameAlert({ type: 'success', msg: 'Profile updated successfully!' });
      autoClose(setNameAlert);
    } catch (err) {
      setNameAlert({ type: 'error', msg: err.message });
      autoClose(setNameAlert);
    } finally {
      setNameSaving(false);
    }
  };

  /* ─────────────────────────────────────────────────────
     Email handler
  ───────────────────────────────────────────────────── */
  const handleSaveEmail = async () => {
    if (!email.trim()) {
      setEmailAlert({ type: 'error', msg: 'Email cannot be empty.' });
      return;
    }
    if (!emailPassword) {
      setEmailAlert({ type: 'error', msg: 'Please enter your current password to confirm.' });
      return;
    }
    setEmailSaving(true);
    setEmailAlert({ type: '', msg: '' });

    try {
      const res  = await fetch(`${API_URL}/auth/email`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: email.trim(), currentPassword: emailPassword }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Update failed');

      setCurrentUser(data.data.user);
      setEmail(data.data.user.email);
      setEmailPassword('');
      setEditingEmail(false);
      setEmailAlert({ type: 'success', msg: 'Email updated successfully!' });
      autoClose(setEmailAlert);
    } catch (err) {
      setEmailAlert({ type: 'error', msg: err.message });
      autoClose(setEmailAlert);
    } finally {
      setEmailSaving(false);
    }
  };

  const handleCancelEmail = () => {
    setEmail(currentUser?.email || '');
    setEmailPassword('');
    setEditingEmail(false);
    setEmailAlert({ type: '', msg: '' });
  };

  /* ─────────────────────────────────────────────────────
     Password handler
  ───────────────────────────────────────────────────── */
  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      setPwAlert({ type: 'error', msg: 'All three password fields are required.' });
      return;
    }
    if (newPw !== confirmPw) {
      setPwAlert({ type: 'error', msg: 'New password and confirm password do not match.' });
      return;
    }
    if (newPw.length < 6) {
      setPwAlert({ type: 'error', msg: 'New password must be at least 6 characters.' });
      return;
    }
    setPwSaving(true);
    setPwAlert({ type: '', msg: '' });

    try {
      const res  = await fetch(`${API_URL}/auth/password`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw, confirmNewPassword: confirmPw }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Password change failed');

      setPwAlert({ type: 'success', msg: 'Password changed successfully!' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setShowPasswordForm(false);
      autoClose(setPwAlert);
    } catch (err) {
      setPwAlert({ type: 'error', msg: err.message });
      autoClose(setPwAlert);
    } finally {
      setPwSaving(false);
    }
  };

  const handleCancelPassword = () => {
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setShowPasswordForm(false);
    setPwAlert({ type: '', msg: '' });
  };

  /* ── Avatar display ───────────────────────────────── */
  const avatarSrc = currentUser?.avatar;
  const initials  = currentUser?.name
    ? currentUser.name.charAt(0).toUpperCase()
    : 'U';

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="settings-page">

      {/* ── Profile Picture Card ──────────────────────────── */}
      <div className="settings-card">
        <div className="settings-avatar-row">
          {/* Avatar preview */}
          <div className="settings-avatar-wrap">
            {avatarSrc ? (
              <img src={avatarSrc} alt="Profile" className="settings-avatar" />
            ) : (
              <div className="settings-avatar-initials">{initials}</div>
            )}
            {avatarUploading && (
              <div className="settings-avatar-uploading">
                <div className="settings-avatar-spinner" />
              </div>
            )}
          </div>

          {/* Avatar controls */}
          <div className="settings-avatar-info">
            <p className="settings-avatar-label">Profile Picture</p>
            <div className="settings-avatar-actions">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                style={{ display: 'none' }}
                onChange={handleAvatarSelect}
                id="avatar-file-input"
              />
              <button
                className="settings-btn-primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                id="upload-avatar-btn"
              >
                {avatarUploading ? <Spinner /> : <UploadIcon />}
                {avatarSrc ? 'Change Image' : 'Upload Image'}
              </button>

              <button
                className="settings-btn-secondary"
                onClick={handleRemoveAvatar}
                disabled={avatarUploading || !avatarSrc}
                id="remove-avatar-btn"
              >
                Remove
              </button>
            </div>
            <p className="settings-avatar-hint">We support PNGs, JPEGs and GIFs under 10MB</p>
          </div>
        </div>

        <Alert type={avatarAlert.type} message={avatarAlert.msg} />
      </div>

      {/* ── Name Card ─────────────────────────────────────── */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div>
            <h2 className="settings-section-title" style={{ margin: 0 }}>Profile</h2>
            <p className="settings-section-subtitle">Update your first and last name</p>
          </div>
        </div>

        <div className="settings-form-row">
          <div className="settings-field">
            <label className="settings-label" htmlFor="first-name-input">First Name</label>
            <input
              id="first-name-input"
              className="settings-input"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
            />
          </div>
          <div className="settings-field">
            <label className="settings-label" htmlFor="last-name-input">Last Name</label>
            <input
              id="last-name-input"
              className="settings-input"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
            />
          </div>
        </div>

        <Alert type={nameAlert.type} message={nameAlert.msg} />

        <div className="settings-form-actions">
          <button
            className="settings-btn-secondary settings-btn-save"
            onClick={handleSaveProfile}
            disabled={nameSaving}
            id="save-profile-btn"
          >
            {nameSaving && <Spinner dark />}
            {nameSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ── Email Card ────────────────────────────────────── */}
      <div className="settings-card">
        <h2 className="settings-section-title" style={{ marginBottom: 4 }}>Email</h2>
        <p className="settings-section-subtitle">Used to log in to your account</p>

        <div className="settings-email-row">
          <div className="settings-field">
            <label className="settings-label" htmlFor="email-input">Email Address</label>
            <input
              id="email-input"
              className="settings-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!editingEmail}
              placeholder="your@email.com"
            />
          </div>

          {!editingEmail ? (
            <button
              className="settings-btn-secondary"
              onClick={() => setEditingEmail(true)}
              id="edit-email-btn"
              style={{ flexShrink: 0, marginBottom: 0, alignSelf: 'flex-end' }}
            >
              Edit Email
            </button>
          ) : (
            <button
              className="settings-btn-secondary settings-btn-danger"
              onClick={handleCancelEmail}
              style={{ flexShrink: 0, alignSelf: 'flex-end' }}
            >
              Cancel
            </button>
          )}
        </div>

        {/* Password confirmation when editing email */}
        {editingEmail && (
          <div className="settings-form-row-single" style={{ animation: 'settingsFadeIn 0.2s ease-out' }}>
            <div className="settings-field">
              <label className="settings-label" htmlFor="email-password-input">
                Confirm with Current Password
              </label>
              <input
                id="email-password-input"
                className="settings-input"
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                placeholder="Enter your current password"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEmail()}
              />
            </div>
          </div>
        )}

        <Alert type={emailAlert.type} message={emailAlert.msg} />

        {editingEmail && (
          <div className="settings-form-actions">
            <button
              className="settings-btn-secondary settings-btn-save"
              onClick={handleSaveEmail}
              disabled={emailSaving}
              id="save-email-btn"
            >
              {emailSaving && <Spinner dark />}
              {emailSaving ? 'Saving…' : 'Save Email'}
            </button>
          </div>
        )}
      </div>

      {/* ── Password Card ─────────────────────────────────── */}
      <div className="settings-card">
        <div className="settings-password-collapsed">
          <div>
            <h2 className="settings-section-title" style={{ marginBottom: 4 }}>Password</h2>
            <p className="settings-section-subtitle">
              {showPasswordForm
                ? 'Enter your current password and choose a new one'
                : 'Log in with your password instead of using temporary login codes'}
            </p>
          </div>
          {!showPasswordForm && (
            <button
              className="settings-btn-secondary"
              onClick={() => setShowPasswordForm(true)}
              id="change-password-btn"
              style={{ flexShrink: 0 }}
            >
              Change Password
            </button>
          )}
        </div>

        {showPasswordForm && (
          <div className="settings-password-expand">
            <div className="settings-password-row">
              {/* Current Password */}
              <div className="settings-field">
                <label className="settings-label" htmlFor="current-password-input">Current Password</label>
                <div className="settings-pw-input-wrap">
                  <input
                    id="current-password-input"
                    className="settings-input"
                    type={showCurr ? 'text' : 'password'}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button className="settings-pw-toggle" onClick={() => setShowCurr(v => !v)} type="button" tabIndex={-1}>
                    <EyeIcon open={showCurr} />
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="settings-field">
                <label className="settings-label" htmlFor="new-password-input">New Password</label>
                <div className="settings-pw-input-wrap">
                  <input
                    id="new-password-input"
                    className="settings-input"
                    type={showNew ? 'text' : 'password'}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button className="settings-pw-toggle" onClick={() => setShowNew(v => !v)} type="button" tabIndex={-1}>
                    <EyeIcon open={showNew} />
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="settings-field">
                <label className="settings-label" htmlFor="confirm-password-input">Confirm New Password</label>
                <div className="settings-pw-input-wrap">
                  <input
                    id="confirm-password-input"
                    className="settings-input"
                    type={showConf ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="••••••••"
                    onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                  />
                  <button className="settings-pw-toggle" onClick={() => setShowConf(v => !v)} type="button" tabIndex={-1}>
                    <EyeIcon open={showConf} />
                  </button>
                </div>
              </div>
            </div>

            <Alert type={pwAlert.type} message={pwAlert.msg} />

            <div className="settings-form-actions" style={{ gap: 10 }}>
              <button
                className="settings-btn-secondary"
                onClick={handleCancelPassword}
                disabled={pwSaving}
              >
                Cancel
              </button>
              <button
                className="settings-btn-secondary settings-btn-save"
                onClick={handleChangePassword}
                disabled={pwSaving}
                id="save-password-btn"
              >
                {pwSaving && <Spinner dark />}
                {pwSaving ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </div>
        )}

        {/* Show alert outside form too (after collapse) */}
        {!showPasswordForm && <Alert type={pwAlert.type} message={pwAlert.msg} />}
      </div>

    </div>
  );
}
