import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient.js';

export const LandingPage = () => {
  const [surveys, setSurveys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const res = await apiClient.get('/surveys/public');
        if (res.success) {
          setSurveys(res.data.surveys || []);
        }
      } catch (err) {
        console.error('Error fetching public surveys:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSurveys();
  }, []);

  const filteredSurveys = surveys.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="ls-container">
      {/* LimeSurvey Public Header & Presentation Jumbotron */}
      <div
        className="ls-card"
        style={{
          textAlign: 'center',
          padding: 'var(--ls-space-10) var(--ls-space-6)',
          marginBottom: 'var(--ls-space-8)',
          backgroundColor: '#fff',
          boxShadow: 'var(--ls-shadow-offset)',
        }}
      >
        <img
          src="https://www.limesurvey.org/images/limesurvey/svg/logo_limesurvey_head.svg"
          alt="LimeSurvey Logo"
          style={{ height: '70px', marginBottom: 'var(--ls-space-4)' }}
        />
        <h1 style={{ fontSize: 'var(--ls-font-size-2xl)', fontWeight: 700, marginBottom: '8px' }}>
          LimeSurvey Public Portal
        </h1>
        <p style={{ color: 'var(--ls-color-g-600)', maxWidth: '600px', margin: '0 auto var(--ls-space-6) auto' }}>
          Welcome to the open survey portal. You can browse active questionnaires below or enter your private access token to participate.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/login?role=voter" className="ls-btn ls-btn-primary">
            <i className="ri-key-2-line" /> Enter Access Code
          </Link>
          <Link to="/login?role=admin" className="ls-btn ls-btn-outline">
            <i className="ri-shield-user-line" /> Administrator Sign In
          </Link>
        </div>
      </div>

      {/* Survey Search & Filter */}
      <div className="ls-page-header">
        <div>
          <h2 className="ls-page-title" style={{ fontSize: 'var(--ls-font-size-xl)' }}>
            Available Surveys ({surveys.length})
          </h2>
          <p className="ls-page-subtitle">Select a survey below to begin answering questions.</p>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            className="ls-input"
            placeholder="Search surveys..."
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
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="ls-card" style={{ height: '180px' }}>
              <div className="ls-skeleton" style={{ width: '60%', marginBottom: '16px' }} />
              <div className="ls-skeleton" style={{ width: '90%', marginBottom: '12px' }} />
              <div className="ls-skeleton" style={{ width: '40%' }} />
            </div>
          ))}
        </div>
      ) : filteredSurveys.length === 0 ? (
        <div className="ls-card ls-empty-state">
          <i className="ri-inbox-line ls-empty-icon" />
          <h3>No Public Surveys Found</h3>
          <p style={{ marginTop: '8px' }}>
            {search ? 'No surveys matched your search criteria.' : 'There are currently no active public surveys available.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {filteredSurveys.map((survey) => (
            <div
              key={survey.id}
              className="ls-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: 'var(--ls-font-size-md)', fontWeight: 600 }}>{survey.title}</h3>
                  <span className="ls-badge ls-badge-success">Active</span>
                </div>
                <p style={{ color: 'var(--ls-color-g-600)', fontSize: '14px', marginBottom: '16px', lineHeight: 1.5 }}>
                  {survey.description || 'No description provided.'}
                </p>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '13px',
                    color: 'var(--ls-color-g-600)',
                    marginBottom: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--ls-color-g-200)',
                  }}
                >
                  <span>
                    <i className="ri-questionnaire-line" /> {survey._count?.questions || 0} Questions
                  </span>
                  <span>
                    <i className="ri-chat-check-line" /> {survey._count?.responses || 0} Submissions
                  </span>
                </div>

                <Link
                  to={`/surveys/${survey.id}/take`}
                  className="ls-btn ls-btn-primary"
                  style={{ width: '100%' }}
                >
                  <i className="ri-pencil-line" /> Take Survey
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ukraine Support Banner */}
      <div
        className="ls-card"
        style={{
          marginTop: 'var(--ls-space-10)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              flexShrink: 0,
            }}
          >
            🇺🇦
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
              LimeSurvey supports Ukraine's right to defend itself
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              Stand with the people of Ukraine and contribute to humanitarian and medical assistance.
            </div>
          </div>
        </div>

        <a
          href="https://u24.gov.ua/"
          target="_blank"
          rel="noopener noreferrer"
          className="ls-btn ls-btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '14px',
            padding: '10px 20px',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          <span>Donate to United24</span>
          <i className="ri-external-link-line" style={{ fontSize: '14px' }} />
        </a>
      </div>
    </div>
  );
};
