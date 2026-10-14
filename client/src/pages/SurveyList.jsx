import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient.js';
import { useToast } from '../context/ToastContext.jsx';

export const SurveyList = () => {
  const [surveys, setSurveys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
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

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await apiClient.delete(`/surveys/${id}`);
      if (res.success) {
        showToast('Survey successfully deleted', 'info');
        fetchSurveys();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete survey', 'error');
    }
  };

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

      <div className="ls-card">
        {isLoading ? (
          <div style={{ padding: '24px 0' }}>
            <div className="ls-skeleton" style={{ width: '100%', marginBottom: '14px' }} />
            <div className="ls-skeleton" style={{ width: '100%', marginBottom: '14px' }} />
            <div className="ls-skeleton" style={{ width: '100%' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="ls-empty-state">
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
                  <th style={{ width: '90px' }}>Questions</th>
                  <th style={{ width: '100px' }}>Submissions</th>
                  <th style={{ width: '90px' }}>Voters</th>
                  <th style={{ width: '280px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: 'var(--ls-color-g-600)' }}>#{s.id}</td>
                    <td>
                      <Link to={`/admin/surveys/${s.id}/edit`} style={{ fontWeight: 600, color: 'var(--ls-color-g-900)' }}>
                        {s.title}
                      </Link>
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
                    <td>{s._count?.questions || 0}</td>
                    <td>{s._count?.responses || 0}</td>
                    <td>{s._count?.voters || 0}</td>
                    <td style={{ textAlign: 'right' }}>
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
                          onClick={() => handleDelete(s.id, s.title)}
                          className="ls-btn ls-btn-outline ls-btn-sm"
                          style={{ color: 'var(--ls-color-danger)' }}
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
      </div>
    </div>
  );
};
