import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export const VoterDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="ls-container" style={{ maxWidth: '680px' }}>
      <div className="ls-page-header">
        <div>
          <h1 className="ls-page-title">Voter Portal</h1>
          <p className="ls-page-subtitle">
            Authenticated via Access Code: <code>{user?.token}</code>
          </p>
        </div>
      </div>

      <div className="ls-card" style={{ marginBottom: 'var(--ls-space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: 'var(--ls-space-4)' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--ls-color-primary-subtle)',
              color: 'var(--ls-color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}
          >
            <i className="ri-user-star-line" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : `Participant #${user?.voterId || user?.id}`}
            </h2>
            <span style={{ fontSize: '14px', color: 'var(--ls-color-g-600)' }}>
              {user?.email || 'Anonymous Verified Voter'}
            </span>
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: 'var(--ls-color-g-100)', borderRadius: 'var(--ls-radius-sm)', marginBottom: 'var(--ls-space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Participation Status</span>
            <span className={`ls-badge ${user?.completed ? 'ls-badge-success' : 'ls-badge-info'}`}>
              {user?.completed ? 'Response Completed' : 'Pending Participation'}
            </span>
          </div>
        </div>

        {user?.surveyId ? (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
              Assigned Survey
            </h3>
            <p style={{ color: 'var(--ls-color-g-600)', fontSize: '14px', marginBottom: '20px' }}>
              {user.surveyTitle || `Survey #${user.surveyId}`}
            </p>

            {user.completed ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--ls-color-primary)' }}>
                <i className="ri-checkbox-circle-fill" style={{ fontSize: '20px' }} />
                <span>Your response has been securely recorded. Thank you for your feedback!</span>
              </div>
            ) : (
              <Link
                to={`/surveys/${user.surveyId}/take?token=${user.token}`}
                className="ls-btn ls-btn-primary ls-btn-lg"
                style={{ width: '100%' }}
              >
                <i className="ri-pencil-line" /> Open & Fill Survey Now
              </Link>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>No individual survey is linked to this account.</p>
            <Link to="/" className="ls-btn ls-btn-outline" style={{ marginTop: '12px' }}>
              Browse Public Surveys
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
