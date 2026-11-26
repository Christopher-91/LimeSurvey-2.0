import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export const VoterDashboard = () => {
  const { user } = useAuth();
  const isZk = Boolean(user?.zeroKnowledgeEnabled ?? user?.survey?.zeroKnowledgeEnabled);

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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                Assigned Survey
              </h3>
              {isZk && (
                <span
                  className="ls-badge"
                  style={{
                    backgroundColor: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #10b981',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 700,
                    fontSize: '11px',
                  }}
                  title="Zero-Knowledge Protocol active: responses are fully anonymous"
                >
                  <i className="ri-shield-keyhole-line" /> ZKP ACTIVE
                </span>
              )}
            </div>
            <p style={{ color: 'var(--ls-color-g-600)', fontSize: '14px', marginBottom: '14px' }}>
              {user.surveyTitle || user.survey?.title || `Survey #${user.surveyId}`}
            </p>

            {isZk && (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  fontSize: '13px',
                  color: '#166534',
                }}
              >
                <i className="ri-shield-check-fill" style={{ fontSize: '18px', color: '#16a34a', flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <strong>Zero-Knowledge Protocol Active:</strong> Your responses to this survey are cryptographically decoupled from your voter account and access code. 100% anonymous participation is guaranteed.
                </div>
              </div>
            )}

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
