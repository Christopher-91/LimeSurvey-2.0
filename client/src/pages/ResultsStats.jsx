import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiClient } from '../api/apiClient.js';
import { useToast } from '../context/ToastContext.jsx';

export const ResultsStats = () => {
  const { id } = useParams();
  const [stats, setStats] = useState(null);
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const [statsRes, respRes] = await Promise.all([
          apiClient.get(`/surveys/${id}/statistics`),
          apiClient.get(`/surveys/${id}/responses`),
        ]);

        if (statsRes.success) setStats(statsRes.data.stats);
        if (respRes.success) setResponses(respRes.data.responses || []);
      } catch (err) {
        showToast(err.message || 'Failed to load survey results', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  if (isLoading) {
    return (
      <div className="ls-container">
        <div className="ls-card">
          <div className="ls-skeleton" style={{ width: '50%', marginBottom: '20px' }} />
          <div className="ls-skeleton" style={{ width: '80%', marginBottom: '14px' }} />
          <div className="ls-skeleton" style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="ls-container">
        <div className="ls-card ls-empty-state">
          <h3>No statistics available for this survey</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="ls-container">
      {/* Header with Export buttons */}
      <div className="ls-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link to="/admin/surveys" style={{ fontSize: '14px' }}>
              ← Back to Surveys
            </Link>
          </div>
          <h1 className="ls-page-title">Results: {stats.title}</h1>
          <p className="ls-page-subtitle">Real-time response aggregation and statistical analysis.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href={`/api/v1/surveys/${id}/export?format=xlsx`}
            className="ls-btn ls-btn-primary"
            download
          >
            <i className="ri-file-excel-2-line" /> Export to Excel (.xlsx)
          </a>
          <a
            href={`/api/v1/surveys/${id}/export?format=csv`}
            className="ls-btn ls-btn-outline"
            download
          >
            <i className="ri-file-text-line" /> Export CSV
          </a>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: 'var(--ls-space-8)' }}>
        <div className="ls-card">
          <span style={{ fontSize: '13px', color: 'var(--ls-color-g-600)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Submissions
          </span>
          <div style={{ fontSize: '32px', fontWeight: 700, margin: '6px 0', color: 'var(--ls-color-primary)' }}>
            {stats.totalResponses}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--ls-color-g-600)' }}>Total completed responses</span>
        </div>

        <div className="ls-card">
          <span style={{ fontSize: '13px', color: 'var(--ls-color-g-600)', textTransform: 'uppercase', fontWeight: 600 }}>
            Registered Voters
          </span>
          <div style={{ fontSize: '32px', fontWeight: 700, margin: '6px 0', color: 'var(--ls-color-grape)' }}>
            {stats.totalVoters}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--ls-color-g-600)' }}>Access tokens issued</span>
        </div>

        <div className="ls-card">
          <span style={{ fontSize: '13px', color: 'var(--ls-color-g-600)', textTransform: 'uppercase', fontWeight: 600 }}>
            Completion Rate
          </span>
          <div style={{ fontSize: '32px', fontWeight: 700, margin: '6px 0', color: 'var(--ls-color-g-900)' }}>
            {stats.completionRate}%
          </div>
          <span style={{ fontSize: '12px', color: 'var(--ls-color-success)' }}>
            <i className="ri-check-double-line" /> Participation index
          </span>
        </div>
      </div>

      {/* Question Distributions */}
      <h2 style={{ fontSize: 'var(--ls-font-size-xl)', marginBottom: 'var(--ls-space-4)' }}>
        Question Breakdowns ({stats.questions?.length || 0})
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: 'var(--ls-space-8)' }}>
        {stats.questions?.map((q, idx) => (
          <div key={q.questionId} className="ls-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--ls-color-primary)', fontWeight: 600 }}>
                  Question #{idx + 1} ({q.code})
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 600, marginTop: '2px' }}>{q.text}</h3>
              </div>
              <span className="ls-badge ls-badge-secondary">
                {q.totalAnswered} Answers
              </span>
            </div>

            {/* Average rating badge */}
            {q.averageRating && (
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Average Score:</span>
                <span className="ls-badge" style={{ backgroundColor: 'var(--ls-color-banana)', color: '#000', fontSize: '14px' }}>
                  ★ {q.averageRating} / 5.0
                </span>
              </div>
            )}

            {/* Render Distribution Bars for choices */}
            {q.options && q.options.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {q.options.map((opt) => (
                  <div key={opt.code}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 500 }}>{opt.text}</span>
                      <span style={{ color: 'var(--ls-color-g-600)' }}>
                        {opt.count} ({opt.percentage}%)
                      </span>
                    </div>
                    {/* Visual Progress Bar matching LimeSurvey tokens */}
                    <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--ls-color-g-200)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${opt.percentage}%`,
                          height: '100%',
                          backgroundColor: 'var(--ls-color-primary)',
                          borderRadius: '9999px',
                          transition: 'width 0.4s ease-in-out',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Render Free Text Recent Responses */}
            {q.recentResponses && (
              <div>
                {q.recentResponses.length === 0 ? (
                  <p style={{ color: 'var(--ls-color-g-600)', fontSize: '14px', fontStyle: 'italic' }}>
                    No responses recorded yet for this question.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {q.recentResponses.map((text, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '10px 14px',
                          backgroundColor: 'var(--ls-color-g-100)',
                          borderRadius: 'var(--ls-radius-sm)',
                          fontSize: '14px',
                          borderLeft: '3px solid var(--ls-color-g-400)',
                        }}
                      >
                        "{text}"
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Raw Response Log */}
      <div className="ls-card">
        <h2 className="ls-card-title" style={{ marginBottom: 'var(--ls-space-4)' }}>
          Raw Submission Log ({responses.length})
        </h2>

        {responses.length === 0 ? (
          <div className="ls-empty-state">
            <i className="ri-inbox-line ls-empty-icon" />
            <p>No answers have been submitted yet.</p>
          </div>
        ) : (
          <div className="ls-table-container">
            <table className="ls-table">
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>Submit Date</th>
                  <th>Voter Token</th>
                  <th>Answers JSONB Data</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.id}</td>
                    <td>{new Date(r.submitDate).toLocaleString()}</td>
                    <td>
                      {r.voter ? <code>{r.voter.token}</code> : <span className="ls-badge ls-badge-secondary">Anonymous</span>}
                    </td>
                    <td>
                      <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                        {JSON.stringify(r.answers)}
                      </code>
                    </td>
                    <td>{r.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
