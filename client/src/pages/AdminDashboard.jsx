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
  const activeSurveys = surveys.filter((s) => s.active).length;

  return (
    <div className="ls-container">
      {/* Welcome Banner */}
      <div className="ls-page-header">
        <div>
          <h1 className="ls-page-title">Administration Dashboard</h1>
          <p className="ls-page-subtitle">
            Logged in as <strong>{user?.fullName || user?.username}</strong> ({user?.email})
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/admin/surveys/new" className="ls-btn ls-btn-primary">
            <i className="ri-add-circle-line" /> Create New Survey
          </Link>
          <Link to="/admin/surveys" className="ls-btn ls-btn-outline">
            <i className="ri-list-check-2" /> All Surveys
          </Link>
        </div>
      </div>

      {/* KPI Stats Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: 'var(--ls-space-8)' }}>
        <div className="ls-card" style={{ borderLeft: '4px solid var(--ls-color-primary)' }}>
          <span style={{ fontSize: '13px', color: 'var(--ls-color-g-600)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Surveys
          </span>
          <div style={{ fontSize: '32px', fontWeight: 700, margin: '8px 0', color: 'var(--ls-color-g-900)' }}>
            {isLoading ? '-' : surveys.length}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--ls-color-primary)' }}>
            <i className="ri-checkbox-circle-fill" /> {activeSurveys} Active Surveys
          </span>
        </div>

        <div className="ls-card" style={{ borderLeft: '4px solid var(--ls-color-grape)' }}>
          <span style={{ fontSize: '13px', color: 'var(--ls-color-g-600)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Submissions
          </span>
          <div style={{ fontSize: '32px', fontWeight: 700, margin: '8px 0', color: 'var(--ls-color-g-900)' }}>
            {isLoading ? '-' : totalResponses}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--ls-color-g-600)' }}>
            Across all questionnaires
          </span>
        </div>

        <div className="ls-card" style={{ borderLeft: '4px solid var(--ls-color-orange)' }}>
          <span style={{ fontSize: '13px', color: 'var(--ls-color-g-600)', textTransform: 'uppercase', fontWeight: 600 }}>
            Configured Questions
          </span>
          <div style={{ fontSize: '32px', fontWeight: 700, margin: '8px 0', color: 'var(--ls-color-g-900)' }}>
            {isLoading ? '-' : totalQuestions}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--ls-color-g-600)' }}>
            Standard & matrix formats
          </span>
        </div>

        <div className="ls-card" style={{ borderLeft: '4px solid var(--ls-color-action)' }}>
          <span style={{ fontSize: '13px', color: 'var(--ls-color-g-600)', textTransform: 'uppercase', fontWeight: 600 }}>
            API & Database
          </span>
          <div style={{ fontSize: '20px', fontWeight: 600, margin: '14px 0', color: 'var(--ls-color-g-900)' }}>
            PostgreSQL + JSONB
          </div>
          <a href="/api/docs" target="_blank" rel="noreferrer" style={{ fontSize: '12px' }}>
            OpenAPI Documentation →
          </a>
        </div>
      </div>

      {/* Quick Action Boxes (LimeSurvey Classic Feature Recreated) */}
      <h2 style={{ fontSize: 'var(--ls-font-size-lg)', marginBottom: 'var(--ls-space-4)' }}>
        Quick Management
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: 'var(--ls-space-8)' }}>
        <Link to="/admin/surveys/new" className="ls-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--ls-color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ls-color-primary)', fontSize: '24px' }}>
              <i className="ri-file-add-line" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Create Survey</h3>
              <p style={{ fontSize: '13px', color: 'var(--ls-color-g-600)' }}>Build a new questionnaire</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/surveys" className="ls-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#f1edfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ls-color-grape)', fontSize: '24px' }}>
              <i className="ri-folders-line" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Survey Inventory</h3>
              <p style={{ fontSize: '13px', color: 'var(--ls-color-g-600)' }}>Browse and edit existing surveys</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Surveys Table */}
      <div className="ls-card">
        <div className="ls-card-header">
          <h2 className="ls-card-title">Recent Surveys</h2>
          <Link to="/admin/surveys" className="ls-btn ls-btn-outline ls-btn-sm">
            View All ({surveys.length})
          </Link>
        </div>

        {isLoading ? (
          <div style={{ padding: '20px 0' }}>
            <div className="ls-skeleton" style={{ width: '100%', marginBottom: '12px' }} />
            <div className="ls-skeleton" style={{ width: '100%', marginBottom: '12px' }} />
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
          <div className="ls-table-container">
            <table className="ls-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Questions</th>
                  <th>Responses</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {surveys.slice(0, 5).map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: 'var(--ls-color-g-600)' }}>#{s.id}</td>
                    <td>
                      <Link to={`/admin/surveys/${s.id}/edit`} style={{ fontWeight: 600, color: 'var(--ls-color-g-900)' }}>
                        {s.title}
                      </Link>
                    </td>
                    <td>
                      <span className={`ls-badge ${s.active ? 'ls-badge-success' : 'ls-badge-secondary'}`}>
                        {s.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{s._count?.questions || 0}</td>
                    <td>{s._count?.responses || 0}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link
                          to={`/admin/surveys/${s.id}/statistics`}
                          className="ls-btn ls-btn-outline ls-btn-sm"
                          title="View Statistics & Results"
                        >
                          <i className="ri-bar-chart-fill" /> Results
                        </Link>
                        <Link
                          to={`/admin/surveys/${s.id}/edit`}
                          className="ls-btn ls-btn-outline ls-btn-sm"
                          title="Edit Questions"
                        >
                          <i className="ri-edit-line" /> Edit
                        </Link>
                        <Link
                          to={`/surveys/${s.id}/take`}
                          target="_blank"
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
    </div>
  );
};
