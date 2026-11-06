import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient.js';
import ukraineFlag from '../assets/ukraine-flag.svg';

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

      {/* Horizontal Divider Separating Public Surveys from Solidarity Banner */}
      <div
        style={{
          width: '100%',
          margin: 'var(--ls-space-10) 0 var(--ls-space-6) 0',
          borderTop: '1px solid #e2e8f0',
        }}
      />

      {/* Ukraine Solidarity Banner - Slim Height & Full Horizontal Width */}
      <div
        className="ls-card"
        style={{
          width: '100%',
          padding: 0,
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
          marginBottom: 'var(--ls-space-8)',
        }}
      >
        {/* Dual-Color Ukrainian National Stripe (Azure Blue + Golden Yellow) */}
        <div
          style={{
            height: '3.5px',
            width: '100%',
            background: 'linear-gradient(90deg, #0057B7 0%, #0057B7 50%, #FFD700 50%, #FFD700 100%)',
          }}
        />

        <div
          style={{
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            background: 'linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%)',
          }}
        >
          {/* Left Content */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 500px' }}>
            <img
              src={ukraineFlag}
              alt="Flag of Ukraine"
              style={{
                width: '44px',
                height: '30px',
                borderRadius: '4px',
                objectFit: 'cover',
                boxShadow: '0 2px 8px rgba(0, 87, 183, 0.2)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                flexShrink: 0,
              }}
            />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#0f172a',
                    margin: 0,
                    letterSpacing: '-0.2px',
                  }}
                >
                  LimeSurvey supports Ukraine's right to defend itself
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#059669',
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    padding: '1px 7px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <i className="ri-shield-check-fill" style={{ fontSize: '12px' }} /> u24.gov.ua
                </span>
              </div>
              <p
                style={{
                  fontSize: '13px',
                  color: '#64748b',
                  margin: '2px 0 0 0',
                }}
              >
                Join the global effort supporting humanitarian and defense assistance directly via United24, the official platform of Ukraine.
              </p>
            </div>
          </div>

          {/* Right Action Button */}
          <div style={{ flexShrink: 0 }}>
            <a
              href="https://u24.gov.ua/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '13.5px',
                padding: '9px 18px',
                borderRadius: '7px',
                whiteSpace: 'nowrap',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                border: '1px solid #0f172a',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.12)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1e293b';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0f172a';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.12)';
              }}
            >
              <span style={{ color: '#FFD700', fontSize: '13px' }}>★</span>
              <span>Donate to United24</span>
              <i className="ri-arrow-right-up-line" style={{ fontSize: '14px', opacity: 0.8 }} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
