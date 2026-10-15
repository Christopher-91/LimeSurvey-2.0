import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isVoter, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="ls-navbar" role="banner">
      <Link to="/" className="ls-navbar-brand">
        <img
          src="https://www.limesurvey.org/images/limesurvey/svg/logo_limesurvey_head.svg"
          alt="LimeSurvey Logo"
        />
        <span>LimeSurvey</span>
      </Link>

      <nav className="ls-navbar-actions" aria-label="Main Navigation">
        <NavLink
          to="/"
          className={({ isActive }) => `ls-navbar-link ${isActive ? 'active' : ''}`}
          end
        >
          <i className="ri-survey-line" />
          <span>Surveys</span>
        </NavLink>

        {isAdmin && (
          <>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => `ls-navbar-link ${isActive ? 'active' : ''}`}
            >
              <i className="ri-dashboard-line" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/admin/surveys"
              className={({ isActive }) => `ls-navbar-link ${isActive ? 'active' : ''}`}
            >
              <i className="ri-file-list-3-line" />
              <span>Manage Surveys</span>
            </NavLink>
          </>
        )}

        {isVoter && (
          <NavLink
            to="/voter/dashboard"
            className={({ isActive }) => `ls-navbar-link ${isActive ? 'active' : ''}`}
          >
            <i className="ri-user-star-line" />
            <span>My Survey</span>
          </NavLink>
        )}

        <a
          href="/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="ls-navbar-link"
          title="OpenAPI 3.0 Documentation"
        >
          <i className="ri-book-read-line" />
          <span>API Docs</span>
        </a>

        {isAuthenticated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
            <span
              className={`ls-badge ${isAdmin ? 'ls-badge-success' : 'ls-badge-info'}`}
            >
              <i className={isAdmin ? 'ri-shield-check-line' : 'ri-user-line'} />
              {isAdmin ? 'Admin' : 'Voter'}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--ls-color-g-300)' }}>
              {user.fullName || user.username || user.voterId || user.email}
            </span>
            <button
              onClick={handleLogout}
              className="ls-btn ls-btn-outline ls-btn-sm"
              style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
            >
              <i className="ri-logout-box-r-line" />
              Logout
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};
