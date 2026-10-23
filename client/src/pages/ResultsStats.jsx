import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiClient } from '../api/apiClient.js';
import { useToast } from '../context/ToastContext.jsx';

/**
 * Extracts voter initials for the attendance avatar circle
 */
const getInitials = (name) => {
  if (!name) return 'V';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

/**
 * Formats JSONB answer values for human-readable display on feedback cards
 */
const formatAnswerValue = (val, question) => {
  if (val === undefined || val === null || val === '') {
    return <span style={{ color: 'var(--ls-color-g-600)', fontStyle: 'italic' }}>No answer provided</span>;
  }

  // Multi-choice array
  if (Array.isArray(val)) {
    if (val.length === 0) {
      return <span style={{ color: 'var(--ls-color-g-600)', fontStyle: 'italic' }}>None selected</span>;
    }
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {val.map((item, idx) => {
          const opt = question?.options?.find((o) => o.code === item);
          return (
            <span key={idx} className="ls-badge ls-badge-secondary">
              {opt ? opt.text : item}
            </span>
          );
        })}
      </div>
    );
  }

  // Single choice lookup
  if (question?.options && question.options.length > 0) {
    const opt = question.options.find((o) => o.code === String(val));
    if (opt) {
      return (
        <span className="ls-badge ls-badge-secondary" style={{ fontSize: '13px', padding: '4px 10px' }}>
          {opt.text}
        </span>
      );
    }
  }

  // Rating display
  if (question?.type === 'rating') {
    return (
      <span className="ls-badge" style={{ backgroundColor: 'var(--ls-color-banana)', color: '#000', fontSize: '13px' }}>
        ★ {val} / 5 Stars
      </span>
    );
  }

  // Long text / comments
  return (
    <div
      style={{
        padding: '12px 16px',
        backgroundColor: 'var(--ls-color-g-100)',
        borderRadius: 'var(--ls-radius-sm)',
        fontSize: '14px',
        borderLeft: '3px solid var(--ls-color-primary)',
        color: 'var(--ls-color-g-900)',
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
      }}
    >
      "{val}"
    </div>
  );
};

export const ResultsStats = () => {
  const { id } = useParams();
  const [stats, setStats] = useState(null);
  const [responses, setResponses] = useState([]); // Standard non-ZK responses
  const [ghostComments, setGhostComments] = useState([]); // ZK View 1
  const [attendanceData, setAttendanceData] = useState(null); // ZK View 2
  const [zkView, setZkView] = useState('ghost_comments'); // 'ghost_comments' | 'attendance'
  const [isLoading, setIsLoading] = useState(true);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const [statsRes, respRes] = await Promise.all([
          apiClient.get(`/surveys/${id}/statistics`),
          apiClient.get(`/surveys/${id}/responses?view=ghost_comments`),
        ]);

        if (statsRes.success) setStats(statsRes.data.stats);

        if (respRes.success) {
          const resData = respRes.data;
          if (resData.zeroKnowledgeEnabled) {
            setGhostComments(resData.comments || resData.responses || []);
          } else {
            setResponses(resData.responses || []);
          }
        }
      } catch (err) {
        showToast(err.message || 'Failed to load survey results', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  const handleSwitchZkView = async (nextView) => {
    if (nextView === zkView) return;
    setZkView(nextView);

    if (nextView === 'attendance' && !attendanceData) {
      setIsViewLoading(true);
      try {
        const res = await apiClient.get(`/surveys/${id}/responses?view=attendance`);
        if (res.success) {
          setAttendanceData(res.data);
        }
      } catch (err) {
        showToast(err.message || 'Failed to load voter attendance list', 'error');
      } finally {
        setIsViewLoading(false);
      }
    }
  };

  const handleKeyDownToggle = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      handleSwitchZkView(zkView === 'ghost_comments' ? 'attendance' : 'ghost_comments');
    }
  };

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

  const isZk = Boolean(stats.zeroKnowledgeEnabled);

  return (
    <div className="ls-container">
      {/* Header with Export buttons and ZK Pill Badge */}
      <div className="ls-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link to="/admin/surveys" style={{ fontSize: '14px' }}>
              ← Back to Surveys
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 className="ls-page-title" style={{ margin: 0 }}>
              Results: {stats.title}
            </h1>
            {isZk && (
              <span
                className="ls-badge"
                style={{
                  backgroundColor: 'var(--ls-color-primary-subtle)',
                  color: 'var(--ls-color-primary-active)',
                  border: '1px solid rgba(20, 174, 92, 0.3)',
                  fontSize: '11px',
                  letterSpacing: '0.6px',
                  padding: '4px 10px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <i className="ri-shield-keyhole-line" style={{ fontSize: '13px' }} />
                ZK PROTOCOL
              </span>
            )}
          </div>
          <p className="ls-page-subtitle">
            {isZk
              ? 'Real-time statistical aggregation protected by secret-ballot decoupling.'
              : 'Real-time response aggregation and statistical analysis.'}
          </p>
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

      {/* ==========================================================================
          ZERO KNOWLEDGE PROTOCOL TOGGLE & MUTUALLY EXCLUSIVE VIEWS
          ========================================================================== */}
      {isZk ? (
        <div>
          {/* Section Header with Segmented Toggle */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: 'var(--ls-space-4)',
            }}
          >
            <div>
              <h2 style={{ fontSize: 'var(--ls-font-size-xl)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Submissions & Attendance</span>
                <span
                  className="ls-badge"
                  style={{
                    backgroundColor: 'var(--ls-color-primary-subtle)',
                    color: 'var(--ls-color-primary-active)',
                    border: '1px solid rgba(20, 174, 92, 0.3)',
                    fontSize: '11px',
                  }}
                >
                  Secret Ballot
                </span>
              </h2>
              <p style={{ color: 'var(--ls-color-g-600)', fontSize: '13px', marginTop: '4px' }}>
                Zero Knowledge Protocol active: feedback comments and voter profiles are completely decoupled.
              </p>
            </div>

            {/* Two-sided Segmented Toggle Switch */}
            <div
              className="ls-segmented-toggle wide"
              role="tablist"
              aria-label="Zero Knowledge View Selection"
              onKeyDown={handleKeyDownToggle}
              style={{ margin: 0 }}
            >
              <div
                className={`ls-toggle-slider ${zkView === 'attendance' ? 'toggled' : ''}`}
                aria-hidden="true"
              />

              <button
                type="button"
                role="tab"
                id="tab-ghost-comments"
                aria-selected={zkView === 'ghost_comments'}
                aria-controls="panel-ghost-comments"
                tabIndex={zkView === 'ghost_comments' ? 0 : -1}
                className={`ls-toggle-btn ${zkView === 'ghost_comments' ? 'active' : ''}`}
                onClick={() => handleSwitchZkView('ghost_comments')}
              >
                <i className="ri-ghost-line" style={{ fontSize: '16px' }} />
                <span>Ghost Comments</span>
              </button>

              <button
                type="button"
                role="tab"
                id="tab-attendance"
                aria-selected={zkView === 'attendance'}
                aria-controls="panel-attendance"
                tabIndex={zkView === 'attendance' ? 0 : -1}
                className={`ls-toggle-btn ${zkView === 'attendance' ? 'active' : ''}`}
                onClick={() => handleSwitchZkView('attendance')}
              >
                <i className="ri-team-line" style={{ fontSize: '16px' }} />
                <span>User Profiles</span>
              </button>
            </div>
          </div>

          {/* Clean Info Banner indicating active state */}
          {zkView === 'ghost_comments' ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 18px',
                backgroundColor: 'var(--ls-color-primary-subtle)',
                border: '1px solid rgba(20, 174, 92, 0.25)',
                borderRadius: 'var(--ls-radius-md)',
                color: 'var(--ls-color-g-900)',
                fontSize: '13.5px',
                marginBottom: 'var(--ls-space-6)',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--ls-radius-full)',
                  backgroundColor: 'var(--ls-color-primary)',
                  color: 'var(--ls-color-white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '15px',
                }}
              >
                <i className="ri-ghost-line" />
              </div>
              <div>
                <strong>Zero Knowledge Protocol Active:</strong> Voter identities are hidden. Switch to User Profiles to check attendance.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 18px',
                backgroundColor: 'var(--ls-color-white)',
                border: '1px solid var(--ls-color-g-400)',
                borderRadius: 'var(--ls-radius-md)',
                color: 'var(--ls-color-g-900)',
                fontSize: '13.5px',
                marginBottom: 'var(--ls-space-6)',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--ls-radius-full)',
                  backgroundColor: 'var(--ls-color-g-800)',
                  color: 'var(--ls-color-white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '15px',
                }}
              >
                <i className="ri-eye-off-line" />
              </div>
              <div>
                <strong>Zero Knowledge Protocol Active:</strong> Feedback comments are hidden while viewing voter attendance.
              </div>
            </div>
          )}

          {/* VIEW 1: GHOST COMMENTS */}
          {zkView === 'ghost_comments' && (
            <div id="panel-ghost-comments" role="tabpanel" aria-labelledby="tab-ghost-comments">
              {ghostComments.length === 0 ? (
                <div className="ls-card ls-empty-state">
                  <i className="ri-ghost-line ls-empty-icon" />
                  <h3>No feedback comments recorded yet</h3>
                  <p style={{ marginTop: '6px' }}>Responses will appear here anonymously as participants submit their secret ballots.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {ghostComments.map((comment, idx) => (
                    <div
                      key={comment.id || idx}
                      className="ls-card"
                      style={{
                        borderLeft: '4px solid var(--ls-color-primary)',
                        transition: 'box-shadow 0.2s ease',
                      }}
                    >
                      {/* Anonymous Header */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '16px',
                          paddingBottom: '12px',
                          borderBottom: '1px solid var(--ls-color-g-200)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: 'var(--ls-radius-full)',
                              backgroundColor: '#f1f5f9',
                              border: '1px solid var(--ls-color-g-300)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--ls-color-g-700)',
                              fontSize: '18px',
                            }}
                          >
                            <i className="ri-ghost-line" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ls-color-g-900)' }}>
                              Anonymous Voter
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--ls-color-g-600)' }}>
                              Identity Decoupled by Secret Ballot Protocol • Order randomized
                            </div>
                          </div>
                        </div>

                        <span
                          className="ls-badge"
                          style={{
                            backgroundColor: 'var(--ls-color-primary-subtle)',
                            color: 'var(--ls-color-primary-active)',
                            border: '1px solid rgba(20, 174, 92, 0.25)',
                            fontSize: '11px',
                          }}
                        >
                          <i className="ri-shield-check-line" /> Secret Ballot
                        </span>
                      </div>

                      {/* Answers Map */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {Object.entries(comment.answers || {}).map(([key, val]) => {
                          const question = stats.questions?.find(
                            (q) => q.code === key || String(q.questionId) === String(key)
                          );
                          return (
                            <div key={key}>
                              <div style={{ fontSize: '12px', color: 'var(--ls-color-primary)', fontWeight: 600, marginBottom: '2px' }}>
                                {question ? `${question.text} (${question.code})` : key}
                              </div>
                              <div>{formatAnswerValue(val, question)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: USER PROFILES (ATTENDANCE) */}
          {zkView === 'attendance' && (
            <div id="panel-attendance" role="tabpanel" aria-labelledby="tab-attendance">
              {isViewLoading ? (
                <div className="ls-card">
                  <div className="ls-skeleton" style={{ width: '40%', marginBottom: '14px' }} />
                  <div className="ls-skeleton" style={{ width: '100%', marginBottom: '10px' }} />
                  <div className="ls-skeleton" style={{ width: '100%', marginBottom: '10px' }} />
                  <div className="ls-skeleton" style={{ width: '100%' }} />
                </div>
              ) : (
                <div className="ls-card">
                  {/* Roster Header with Participation Summary */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginBottom: 'var(--ls-space-4)',
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Voter Participation Roster</h3>
                      <p style={{ fontSize: '13px', color: 'var(--ls-color-g-600)', margin: '2px 0 0 0' }}>
                        Sorted alphabetically by name. Individual submission responses are completely decoupled and hidden.
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="ls-badge ls-badge-secondary" style={{ fontSize: '12px', padding: '4px 10px' }}>
                        <i className="ri-user-follow-line" />
                        {attendanceData?.participation
                          ? `${attendanceData.participation.totalSubmissions} / ${attendanceData.participation.assignedVoters} Completed (${attendanceData.participation.completionRate}%)`
                          : `${stats.totalResponses} / ${stats.totalVoters} Completed`}
                      </span>
                    </div>
                  </div>

                  {(!attendanceData?.voters || attendanceData.voters.length === 0) ? (
                    <div className="ls-empty-state">
                      <i className="ri-group-line ls-empty-icon" />
                      <h3>No registered voters assigned</h3>
                      <p style={{ marginTop: '6px' }}>Add participant tokens under Survey Settings &gt; Participants.</p>
                    </div>
                  ) : (
                    <div className="ls-table-container">
                      <table className="ls-table">
                        <thead>
                          <tr>
                            <th>Participant Name</th>
                            <th>Email Address</th>
                            <th>Participation Status</th>
                            <th>Completion Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceData.voters.map((voter) => (
                            <tr key={voter.id || voter.voterId}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: 'var(--ls-radius-full)',
                                      backgroundColor: voter.has_completed ? 'var(--ls-color-primary-subtle)' : 'var(--ls-color-g-200)',
                                      color: voter.has_completed ? 'var(--ls-color-primary-active)' : 'var(--ls-color-g-700)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 600,
                                      fontSize: '12px',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {getInitials(voter.name)}
                                  </div>
                                  <span style={{ fontWeight: 600, color: 'var(--ls-color-g-900)' }}>
                                    {voter.name}
                                  </span>
                                </div>
                              </td>
                              <td style={{ color: 'var(--ls-color-g-700)' }}>{voter.email || '—'}</td>
                              <td>
                                {voter.has_completed ? (
                                  <span className="ls-badge ls-badge-success">
                                    <i className="ri-checkbox-circle-fill" /> Completed
                                  </span>
                                ) : (
                                  <span className="ls-badge ls-badge-secondary">
                                    <i className="ri-time-line" /> Pending
                                  </span>
                                )}
                              </td>
                              <td style={{ color: 'var(--ls-color-g-600)', fontSize: '13px' }}>
                                {voter.completedAt ? new Date(voter.completedAt).toLocaleString() : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* STANDARD RAW SUBMISSION LOG (Non-ZK Surveys) */
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
      )}
    </div>
  );
};
