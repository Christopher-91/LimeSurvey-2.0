import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const res = await apiClient.get('/surveys');
        if (res.success) {
          setSurveys(res.data.surveys || []);
        }
      } catch (err) {
        console.error('Error fetching admin dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const totalResponses = surveys.reduce((acc, s) => acc + (s._count?.responses || 0), 0);
  const totalQuestions = surveys.reduce((acc, s) => acc + (s._count?.questions || 0), 0);
  const totalVoters = surveys.reduce((acc, s) => acc + (s._count?.voters || 0), 0);
  const activeSurveys = surveys.filter((s) => s.active).length;
  const zkSurveysCount = surveys.filter(
    (s) => s.zeroKnowledgeEnabled || s.zero_knowledge_enabled
  ).length;

  return (
    <div className="ls-container">
      {/* Welcome & Page Header */}
      <div className="ls-page-header">
        <div>
          <h1 className="ls-page-title">Administration Dashboard</h1>
          <p className="ls-page-subtitle">
            Logged in as <strong>{user?.fullName || user?.username}</strong> ({user?.email})
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <a
            href="/api/docs"
            target="_blank"
            rel="noreferrer"
            className="ls-btn ls-btn-outline"
            title="Interactive OpenAPI / Swagger Documentation"
            style={{ gap: '6px' }}
          >
            <i className="ri-book-open-line" /> API Docs
          </a>
          <Link to="/admin/surveys" className="ls-btn ls-btn-outline">
            <i className="ri-file-list-3-line" /> All Surveys
          </Link>
          <Link to="/admin/surveys/new" className="ls-btn ls-btn-primary">
            <i className="ri-add-line" /> Create New Survey
          </Link>
        </div>
      </div>

      {/* KPI Stats Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '20px',
          marginBottom: 'var(--ls-space-8)',
        }}
      >
        {/* Card 1: Total Surveys */}
        <div
          className="ls-card"
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--ls-radius-lg)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                color: 'var(--ls-color-g-600)',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.5px',
              }}
            >
              Total Surveys
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--ls-radius-sm)',
                backgroundColor: 'var(--ls-color-primary-subtle)',
                color: 'var(--ls-color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0,
              }}
            >
              <i className="ri-survey-line" />
            </div>
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--ls-color-g-900)',
              lineHeight: 1.1,
              marginBottom: '10px',
            }}
          >
            {isLoading ? '-' : surveys.length}
          </div>
          <span
            style={{
              fontSize: '13px',
              color: 'var(--ls-color-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500,
            }}
          >
            <i className="ri-checkbox-circle-fill" /> {activeSurveys} Active {activeSurveys === 1 ? 'Survey' : 'Surveys'}
          </span>
        </div>

        {/* Card 2: Total Submissions */}
        <div
          className="ls-card"
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--ls-radius-lg)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                color: 'var(--ls-color-g-600)',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.5px',
              }}
            >
              Total Submissions
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--ls-radius-sm)',
                backgroundColor: 'var(--ls-color-primary-subtle)',
                color: 'var(--ls-color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0,
              }}
            >
              <i className="ri-inbox-archive-line" />
            </div>
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--ls-color-g-900)',
              lineHeight: 1.1,
              marginBottom: '10px',
            }}
          >
            {isLoading ? '-' : totalResponses}
          </div>
          <span style={{ fontSize: '13px', color: 'var(--ls-color-g-600)' }}>
            Across all questionnaires
          </span>
        </div>

        {/* Card 3: Configured Questions */}
        <div
          className="ls-card"
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--ls-radius-lg)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                color: 'var(--ls-color-g-600)',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.5px',
              }}
            >
              Configured Questions
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--ls-radius-sm)',
                backgroundColor: 'var(--ls-color-primary-subtle)',
                color: 'var(--ls-color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0,
              }}
            >
              <i className="ri-questionnaire-line" />
            </div>
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--ls-color-g-900)',
              lineHeight: 1.1,
              marginBottom: '10px',
            }}
          >
            {isLoading ? '-' : totalQuestions}
          </div>
          <span style={{ fontSize: '13px', color: 'var(--ls-color-g-600)' }}>
            Active & draft surveys
          </span>
        </div>

        {/* Card 4: Total Voters / Secret Ballots */}
        <div
          className="ls-card"
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--ls-radius-lg)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                color: 'var(--ls-color-g-600)',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.5px',
              }}
            >
              Total Voters / Secret Ballots
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--ls-radius-sm)',
                backgroundColor: 'var(--ls-color-primary-subtle)',
                color: 'var(--ls-color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0,
              }}
            >
              <i className="ri-shield-keyhole-line" />
            </div>
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--ls-color-g-900)',
              lineHeight: 1.1,
              marginBottom: '10px',
            }}
          >
            {isLoading ? '-' : totalVoters}
          </div>
          <Link
            to="/admin/surveys"
            style={{
              fontSize: '13px',
              color: 'var(--ls-color-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <i className="ri-shield-keyhole-line" />
            {zkSurveysCount} Secret Ballot {zkSurveysCount === 1 ? 'Survey' : 'Surveys'} &rarr;
          </Link>
        </div>
      </div>

      {/* Recent Surveys Section (Pulled immediately beneath KPI cards) */}
      <div className="ls-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            borderBottom: '1px solid var(--ls-color-g-300)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ls-color-g-900)', margin: 0 }}>
              Recent Surveys
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--ls-color-g-600)', marginTop: '2px', margin: 0 }}>
              Latest questionnaires and live submission activity
            </p>
          </div>
          <Link to="/admin/surveys" className="ls-btn ls-btn-outline ls-btn-sm">
            View All ({surveys.length}) <i className="ri-arrow-right-line" style={{ marginLeft: '4px' }} />
          </Link>
        </div>

        {isLoading ? (
          <div style={{ padding: '24px' }}>
            <div className="ls-skeleton" style={{ width: '100%', marginBottom: '14px' }} />
            <div className="ls-skeleton" style={{ width: '100%', marginBottom: '14px' }} />
            <div className="ls-skeleton" style={{ width: '100%' }} />
          </div>
        ) : surveys.length === 0 ? (
          <div className="ls-empty-state">
            <i className="ri-folder-open-line ls-empty-icon" />
            <h3>No surveys have been created yet</h3>
            <p style={{ margin: '8px 0 16px 0' }}>Get started by creating your very first survey questionnaire.</p>
            <Link to="/admin/surveys/new" className="ls-btn ls-btn-primary">
              <i className="ri-add-line" /> Create First Survey
            </Link>
          </div>
        ) : (
          <div className="ls-table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="ls-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th>Survey Title</th>
                  <th style={{ width: '110px' }}>Status</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Questions</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Submissions</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Voters</th>
                  <th style={{ width: '220px', minWidth: '220px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {surveys.slice(0, 6).map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: 'var(--ls-color-g-600)', whiteSpace: 'nowrap' }}>
                      #{s.id}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <Link
                          to={`/admin/surveys/${s.id}/edit`}
                          style={{ fontWeight: 600, color: 'var(--ls-color-g-900)' }}
                        >
                          {s.title}
                        </Link>
                        {(s.zeroKnowledgeEnabled || s.zero_knowledge_enabled) && (
                          <span
                            className="ls-badge"
                            style={{
                              backgroundColor: 'var(--ls-color-primary-subtle)',
                              color: 'var(--ls-color-primary-active)',
                              border: '1px solid rgba(20, 174, 92, 0.3)',
                              fontSize: '10px',
                              letterSpacing: '0.5px',
                              padding: '2px 7px',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                            title="Zero Knowledge Protocol Active: Voter identities and comments are decoupled"
                          >
                            <i className="ri-shield-keyhole-line" style={{ fontSize: '11px' }} />
                            ZK PROTOCOL
                          </span>
                        )}
                      </div>
                      {s.description && (
                        <div
                          style={{
                            fontSize: '13px',
                            color: 'var(--ls-color-g-600)',
                            marginTop: '2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '380px',
                          }}
                        >
                          {s.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`ls-badge ${s.active ? 'ls-badge-success' : 'ls-badge-secondary'}`}>
                        <i className={s.active ? 'ri-checkbox-circle-fill' : 'ri-pause-circle-line'} />
                        {s.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{s._count?.questions || 0}</td>
                    <td style={{ textAlign: 'center' }}>{s._count?.responses || 0}</td>
                    <td style={{ textAlign: 'center' }}>{s._count?.voters || 0}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Link
                          to={`/admin/surveys/${s.id}/statistics`}
                          className="ls-btn ls-btn-outline ls-btn-sm"
                          title="View Statistics & Results"
                        >
                          <i className="ri-bar-chart-2-line" /> Results
                        </Link>
                        <Link
                          to={`/admin/surveys/${s.id}/edit`}
                          className="ls-btn ls-btn-outline ls-btn-sm"
                          title="Edit Survey & Questions"
                        >
                          <i className="ri-settings-3-line" /> Edit
                        </Link>
                        <Link
                          to={`/surveys/${s.id}/take`}
                          target="_blank"
                          rel="noreferrer"
                          className="ls-btn ls-btn-outline ls-btn-sm"
                          title="Preview Survey"
                        >
                          <i className="ri-external-link-line" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Architecture & Documentation Footer */}
      <footer
        style={{
          marginTop: 'var(--ls-space-10)',
          paddingTop: 'var(--ls-space-6)',
          borderTop: '1px solid var(--ls-color-g-300)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '13px',
          color: 'var(--ls-color-g-600)',
        }}
      >
        <span>
          LimeSurvey Modern Architecture &bull; Node.js, Express &amp; PostgreSQL (JSONB)
        </span>
        <a
          href="/api/docs"
          target="_blank"
          rel="noreferrer"
          style={{
            color: 'var(--ls-color-link)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <i className="ri-external-link-line" /> OpenAPI Documentation &rarr;
        </a>
      </footer>
    </div>
  );
};
