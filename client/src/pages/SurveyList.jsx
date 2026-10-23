import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient.js';
import { useToast } from '../context/ToastContext.jsx';

export const SurveyList = () => {
  const [surveys, setSurveys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [surveyToDelete, setSurveyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [permanentDelete, setPermanentDelete] = useState(false);
  const { showToast } = useToast();

  const fetchSurveys = async () => {
    try {
      const res = await apiClient.get('/surveys');
      if (res.success) {
        setSurveys(res.data.surveys || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load surveys', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const handleToggleActive = async (id) => {
    try {
      const res = await apiClient.patch(`/surveys/${id}/toggle-active`);
      if (res.success) {
        showToast(res.data.message, 'success');
        fetchSurveys();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update survey status', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!surveyToDelete) return;
    setIsDeleting(true);
    try {
      const url = permanentDelete
        ? `/surveys/${surveyToDelete.id}?permanent=true`
        : `/surveys/${surveyToDelete.id}`;
      const res = await apiClient.delete(url);
      if (res.success) {
        showToast(res.data?.message || 'Survey successfully deleted.', 'success');
        // Optimistically update the list immediately
        setSurveys((prev) => prev.filter((s) => s.id !== surveyToDelete.id));
        setSurveyToDelete(null);
        setPermanentDelete(false);
        fetchSurveys();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete survey', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && surveyToDelete && !isDeleting) {
        setSurveyToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [surveyToDelete, isDeleting]);

  const filtered = surveys.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="ls-container">
      <div className="ls-page-header">
        <div>
          <h1 className="ls-page-title">Surveys Management</h1>
          <p className="ls-page-subtitle">Create, configure, publish, and analyze all survey questionnaires.</p>
        </div>
        <Link to="/admin/surveys/new" className="ls-btn ls-btn-primary">
          <i className="ri-add-line" /> Create New Survey
        </Link>
      </div>

      <div className="ls-card" style={{ marginBottom: 'var(--ls-space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <input
              type="text"
              className="ls-input"
              placeholder="Filter by title or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
            <i
              className="ri-search-line"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--ls-color-g-600)',
              }}
            />
          </div>
          <span style={{ fontSize: '14px', color: 'var(--ls-color-g-600)' }}>
            Showing {filtered.length} of {surveys.length} surveys
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="ls-card" style={{ padding: '24px' }}>
          <div className="ls-skeleton" style={{ width: '100%', marginBottom: '14px' }} />
          <div className="ls-skeleton" style={{ width: '100%', marginBottom: '14px' }} />
          <div className="ls-skeleton" style={{ width: '100%' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="ls-card ls-empty-state">
          <i className="ri-file-search-line ls-empty-icon" />
          <h3>No surveys found</h3>
          <p style={{ marginTop: '8px' }}>
            {search ? 'Try clearing your search query.' : 'Create your first survey using the button above.'}
          </p>
        </div>
      ) : (
        <div className="ls-table-container">
          <table className="ls-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Survey Title</th>
                <th style={{ width: '110px' }}>Status</th>
                <th style={{ width: '90px', textAlign: 'center' }}>Questions</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Submissions</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Voters</th>
                <th style={{ width: '260px', minWidth: '250px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600, color: 'var(--ls-color-g-600)', whiteSpace: 'nowrap' }}>
                    #{s.id}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Link to={`/admin/surveys/${s.id}/edit`} style={{ fontWeight: 600, color: 'var(--ls-color-g-900)' }}>
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
                      <div style={{ fontSize: '13px', color: 'var(--ls-color-g-600)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '350px' }}>
                        {s.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(s.id)}
                      className={`ls-badge ${s.active ? 'ls-badge-success' : 'ls-badge-secondary'}`}
                      style={{ border: 'none', cursor: 'pointer' }}
                      title="Click to toggle published status"
                    >
                      <i className={s.active ? 'ri-checkbox-circle-fill' : 'ri-pause-circle-line'} />
                      {s.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'center' }}>{s._count?.questions || 0}</td>
                  <td style={{ textAlign: 'center' }}>{s._count?.responses || 0}</td>
                  <td style={{ textAlign: 'center' }}>{s._count?.voters || 0}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <Link
                        to={`/admin/surveys/${s.id}/statistics`}
                        className="ls-btn ls-btn-outline ls-btn-sm"
                        title="View Statistics"
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
                      <a
                        href={`/api/v1/surveys/${s.id}/export?format=xlsx`}
                        className="ls-btn ls-btn-outline ls-btn-sm"
                        title="Download Excel XLSX"
                        download
                      >
                        <i className="ri-file-excel-line" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setSurveyToDelete(s)}
                        className="ls-btn ls-btn-outline ls-btn-sm"
                        style={{ color: 'var(--ls-color-danger)', borderColor: 'rgba(255, 81, 95, 0.4)' }}
                        title="Delete Survey"
                      >
                        <i className="ri-delete-bin-line" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modern Confirmation Modal for Deleting Survey */}
      {surveyToDelete && (
        <div
          className="ls-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              setSurveyToDelete(null);
            }
          }}
        >
          <div className="ls-modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
            <div className="ls-modal-header">
              <div className="ls-modal-title" id="delete-modal-title">
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 81, 95, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ls-color-danger)',
                    fontSize: '20px',
                    flexShrink: 0,
                  }}
                >
                  <i className="ri-delete-bin-line" />
                </div>
                <span>Delete Survey</span>
              </div>
              <button
                type="button"
                className="ls-modal-close-btn"
                onClick={() => !isDeleting && setSurveyToDelete(null)}
                disabled={isDeleting}
                aria-label="Close modal"
              >
                <i className="ri-close-line" />
              </button>
            </div>

            <div className="ls-modal-body">
              <p style={{ marginBottom: '14px', fontSize: '15px' }}>
                Are you sure you want to delete this survey questionnaire?
              </p>

              <div
                style={{
                  backgroundColor: 'var(--ls-color-g-100)',
                  border: '1px solid var(--ls-color-g-300)',
                  borderRadius: 'var(--ls-radius-md)',
                  padding: '14px 16px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--ls-color-g-900)', fontSize: '15px' }}>
                    {surveyToDelete.title}
                  </span>
                  <span className="ls-badge ls-badge-secondary" style={{ flexShrink: 0 }}>
                    #{surveyToDelete.id}
                  </span>
                </div>
                {surveyToDelete.description && (
                  <p style={{ fontSize: '13px', color: 'var(--ls-color-g-600)', marginTop: '4px' }}>
                    {surveyToDelete.description}
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--ls-color-g-300)',
                    fontSize: '12px',
                    color: 'var(--ls-color-g-700)',
                  }}
                >
                  <span>
                    <strong style={{ color: 'var(--ls-color-g-900)' }}>{surveyToDelete._count?.questions || 0}</strong> Questions
                  </span>
                  <span>•</span>
                  <span>
                    <strong style={{ color: 'var(--ls-color-g-900)' }}>{surveyToDelete._count?.responses || 0}</strong> Submissions
                  </span>
                  <span>•</span>
                  <span>
                    <strong style={{ color: 'var(--ls-color-g-900)' }}>{surveyToDelete._count?.voters || 0}</strong> Voters
                  </span>
                  <span>•</span>
                  <span style={{ color: surveyToDelete.active ? 'var(--ls-color-primary)' : 'var(--ls-color-g-600)', fontWeight: 600 }}>
                    {surveyToDelete.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255, 81, 95, 0.08)',
                  border: '1px solid rgba(255, 81, 95, 0.25)',
                  borderRadius: 'var(--ls-radius-sm)',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: '#b91c1c',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <i className="ri-error-warning-line" style={{ fontSize: '16px', marginTop: '1px', flexShrink: 0 }} />
                <span>
                  This will unpublish the survey and remove it from active listings and participant view.
                </span>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '14px',
                  fontSize: '13px',
                  color: 'var(--ls-color-g-700)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={permanentDelete}
                  onChange={(e) => setPermanentDelete(e.target.checked)}
                  disabled={isDeleting}
                />
                <span>Permanently purge survey and all associated records from database</span>
              </label>
            </div>

            <div className="ls-modal-footer">
              <button
                type="button"
                className="ls-btn ls-btn-outline ls-btn-sm"
                onClick={() => setSurveyToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ls-btn ls-btn-danger ls-btn-sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {isDeleting ? (
                  <>
                    <i className="ri-loader-4-line ri-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <i className="ri-delete-bin-line" /> Delete Survey
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

