import React from 'react';

/**
 * Segmented Voter / Admin Toggle
 * Features animated sliding pill highlight, keyboard accessibility (tablist, aria-selected, arrow keys)
 */
export const SegmentedToggle = ({ activeRole, onChange }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const nextRole = activeRole === 'voter' ? 'admin' : 'voter';
      onChange(nextRole);
    }
  };

  return (
    <div
      className="ls-segmented-toggle"
      role="tablist"
      aria-label="Login Role Selection"
      onKeyDown={handleKeyDown}
    >
      <div
        className={`ls-toggle-slider ${activeRole === 'admin' ? 'admin-active' : ''}`}
        aria-hidden="true"
      />

      <button
        type="button"
        role="tab"
        id="tab-voter"
        aria-selected={activeRole === 'voter'}
        aria-controls="panel-voter"
        tabIndex={activeRole === 'voter' ? 0 : -1}
        className={`ls-toggle-btn ${activeRole === 'voter' ? 'active' : ''}`}
        onClick={() => onChange('voter')}
      >
        <i className="ri-user-voice-line" />
        <span>Voter Login</span>
      </button>

      <button
        type="button"
        role="tab"
        id="tab-admin"
        aria-selected={activeRole === 'admin'}
        aria-controls="panel-admin"
        tabIndex={activeRole === 'admin' ? 0 : -1}
        className={`ls-toggle-btn ${activeRole === 'admin' ? 'active' : ''}`}
        onClick={() => onChange('admin')}
      >
        <i className="ri-shield-user-line" />
        <span>Admin Login</span>
      </button>
    </div>
  );
};
