import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SegmentedToggle } from '../components/SegmentedToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export const LoginPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, isAuthenticated, isAdmin } = useAuth();

  // Role initialization from deep link or default to 'voter'
  const initialRole = searchParams.get('role') === 'admin' ? 'admin' : 'voter';
  const [role, setRole] = useState(initialRole);
  const [adminMode, setAdminMode] = useState('login'); // 'login' | 'register'

  // Login form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Registration form states (Admin only)
  const [fullName, setFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // UI status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  // Sync role with query params
  useEffect(() => {
    const paramRole = searchParams.get('role');
    if (paramRole === 'admin' || paramRole === 'voter') {
      setRole(paramRole);
    }
  }, [searchParams]);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdmin ? '/admin/dashboard' : '/voter/dashboard', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setAdminMode('login');
    setFieldErrors({});
    setGeneralError('');
    setSearchParams(newRole === 'admin' ? { role: 'admin' } : {});
  };

  const validateForm = () => {
    const errors = {};

    if (role === 'admin' && adminMode === 'register') {
      if (!fullName.trim()) {
        errors.fullName = 'Please enter your full name.';
      }

      if (!regUsername.trim()) {
        errors.regUsername = 'Please enter a username.';
      } else if (regUsername.trim().length < 3) {
        errors.regUsername = 'Username must be at least 3 characters.';
      } else if (!/^[a-zA-Z0-9_-]+$/.test(regUsername.trim())) {
        errors.regUsername = 'Username can only contain letters, numbers, underscores, and hyphens.';
      }

      if (!regEmail.trim()) {
        errors.regEmail = 'Please enter your email address.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
        errors.regEmail = 'Please enter a valid email address.';
      }

      if (!regPassword) {
        errors.regPassword = 'Password is required.';
      } else if (regPassword.length < 8) {
        errors.regPassword = 'Password must be at least 8 characters long.';
      }

      if (regPassword !== regConfirmPassword) {
        errors.regConfirmPassword = 'Passwords do not match.';
      }
    } else {
      if (!identifier.trim()) {
        errors.identifier =
          role === 'admin'
            ? 'Please enter your administrator username or email.'
            : 'Please enter your survey access code.';
      }

      if (role === 'admin' && !password) {
        errors.password = 'Please enter your administrator password.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (role === 'admin' && adminMode === 'register') {
        const data = await register({
          username: regUsername.trim(),
          email: regEmail.trim(),
          password: regPassword,
          fullName: fullName.trim(),
        });
        navigate(data.redirectTo || '/admin/dashboard', { replace: true });
      } else {
        const data = await login({
          role,
          identifier: identifier.trim(),
          password,
          rememberMe,
        });

        const returnTo = searchParams.get('returnTo');
        if (returnTo) {
          navigate(returnTo, { replace: true });
        } else {
          navigate(data.redirectTo || (role === 'admin' ? '/admin/dashboard' : '/voter/dashboard'), {
            replace: true,
          });
        }
      }
    } catch (err) {
      setGeneralError(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ls-container" style={{ maxWidth: '480px', marginTop: 'var(--ls-space-8)' }}>
      <div className="ls-card" style={{ padding: 'var(--ls-space-8) var(--ls-space-6)' }}>
        
        {/* Top-Center Segmented Voter / Admin Toggle */}
        <div style={{ textAlign: 'center' }}>
          <SegmentedToggle activeRole={role} onChange={handleRoleChange} />
        </div>

        {/* Dynamic Card Heading */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--ls-space-6)' }}>
          <h1 style={{ fontSize: 'var(--ls-font-size-2xl)', marginBottom: '8px' }}>
            {role === 'voter'
              ? 'Voter & Participant Portal'
              : adminMode === 'register'
              ? 'Create Administrator Account'
              : 'Administration Login'}
          </h1>
          <p className="ls-helper-text" style={{ fontSize: '14px' }}>
            {role === 'voter'
              ? 'Enter your survey access token to participate in a questionnaire.'
              : adminMode === 'register'
              ? 'Register a new administrator account to design, manage, and analyze surveys.'
              : 'Access the LimeSurvey control panel to manage surveys and responses.'}
          </p>
        </div>

        {/* General Error Banner */}
        {generalError && (
          <div
            className="ls-error-banner"
            role="alert"
            style={{
              backgroundColor: '#feecee',
              border: '1px solid var(--ls-color-danger)',
              borderRadius: 'var(--ls-radius-sm)',
              padding: '12px 16px',
              marginBottom: 'var(--ls-space-5)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#a01524',
              fontSize: '14px',
            }}
          >
            <i className="ri-error-warning-fill" style={{ fontSize: '18px' }} />
            <span>{generalError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* ========================================= */}
          {/* ADMIN REGISTRATION FORM */}
          {/* ========================================= */}
          {role === 'admin' && adminMode === 'register' ? (
            <>
              {/* Full Name */}
              <div className="ls-form-group">
                <label className="ls-label" htmlFor="reg-fullname">
                  Full Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-fullname"
                    type="text"
                    className={`ls-input ${fieldErrors.fullName ? 'error' : ''}`}
                    placeholder="e.g. Jane Doe"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: null }));
                    }}
                    disabled={isSubmitting}
                    style={{ paddingLeft: '38px' }}
                  />
                  <i
                    className="ri-user-smile-line"
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--ls-color-g-600)',
                    }}
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="ls-error-text">
                    <i className="ri-alert-line" /> {fieldErrors.fullName}
                  </p>
                )}
              </div>

              {/* Username */}
              <div className="ls-form-group">
                <label className="ls-label" htmlFor="reg-username">
                  Username *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-username"
                    type="text"
                    autoComplete="username"
                    className={`ls-input ${fieldErrors.regUsername ? 'error' : ''}`}
                    placeholder="e.g. janedoe"
                    value={regUsername}
                    onChange={(e) => {
                      setRegUsername(e.target.value);
                      if (fieldErrors.regUsername) setFieldErrors((prev) => ({ ...prev, regUsername: null }));
                    }}
                    disabled={isSubmitting}
                    style={{ paddingLeft: '38px' }}
                  />
                  <i
                    className="ri-user-line"
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--ls-color-g-600)',
                    }}
                  />
                </div>
                {fieldErrors.regUsername && (
                  <p className="ls-error-text">
                    <i className="ri-alert-line" /> {fieldErrors.regUsername}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div className="ls-form-group">
                <label className="ls-label" htmlFor="reg-email">
                  Email Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    className={`ls-input ${fieldErrors.regEmail ? 'error' : ''}`}
                    placeholder="e.g. jane@example.com"
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      if (fieldErrors.regEmail) setFieldErrors((prev) => ({ ...prev, regEmail: null }));
                    }}
                    disabled={isSubmitting}
                    style={{ paddingLeft: '38px' }}
                  />
                  <i
                    className="ri-mail-line"
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--ls-color-g-600)',
                    }}
                  />
                </div>
                {fieldErrors.regEmail && (
                  <p className="ls-error-text">
                    <i className="ri-alert-line" /> {fieldErrors.regEmail}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="ls-form-group">
                <label className="ls-label" htmlFor="reg-password">
                  Password * (min 8 characters)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`ls-input ${fieldErrors.regPassword ? 'error' : ''}`}
                    placeholder="••••••••••••"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (fieldErrors.regPassword) setFieldErrors((prev) => ({ ...prev, regPassword: null }));
                    }}
                    disabled={isSubmitting}
                    style={{ paddingLeft: '38px', paddingRight: '40px' }}
                  />
                  <i
                    className="ri-lock-line"
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--ls-color-g-600)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((prev) => !prev)}
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--ls-color-g-600)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <i className={showRegPassword ? 'ri-eye-off-line' : 'ri-eye-line'} style={{ fontSize: '18px' }} />
                  </button>
                </div>
                {fieldErrors.regPassword && (
                  <p className="ls-error-text">
                    <i className="ri-alert-line" /> {fieldErrors.regPassword}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="ls-form-group">
                <label className="ls-label" htmlFor="reg-confirm-password">
                  Confirm Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-confirm-password"
                    type={showRegPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`ls-input ${fieldErrors.regConfirmPassword ? 'error' : ''}`}
                    placeholder="••••••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => {
                      setRegConfirmPassword(e.target.value);
                      if (fieldErrors.regConfirmPassword) setFieldErrors((prev) => ({ ...prev, regConfirmPassword: null }));
                    }}
                    disabled={isSubmitting}
                    style={{ paddingLeft: '38px' }}
                  />
                  <i
                    className="ri-lock-check-line"
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--ls-color-g-600)',
                    }}
                  />
                </div>
                {fieldErrors.regConfirmPassword && (
                  <p className="ls-error-text">
                    <i className="ri-alert-line" /> {fieldErrors.regConfirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button for Registration */}
              <button
                type="submit"
                className="ls-btn ls-btn-primary ls-btn-lg"
                style={{ width: '100%', marginTop: 'var(--ls-space-2)' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="ri-loader-4-line ri-spin" /> Creating Account...
                  </>
                ) : (
                  <>
                    <i className="ri-user-add-line" /> Create Administrator Account
                  </>
                )}
              </button>

              {/* Toggle to Sign In */}
              <div style={{ textAlign: 'center', marginTop: 'var(--ls-space-4)' }}>
                <p style={{ fontSize: '14px', color: 'var(--ls-color-g-700)' }}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAdminMode('login');
                      setFieldErrors({});
                      setGeneralError('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--ls-color-primary)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                      fontSize: '14px',
                    }}
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </>
          ) : (
            /* ========================================= */
            /* LOGIN FORM (Admin Login or Voter Access)   */
            /* ========================================= */
            <>
              {/* Identifier Input */}
              <div className="ls-form-group">
                <label className="ls-label" htmlFor="login-identifier">
                  {role === 'admin' ? 'Username or Email' : 'Survey Access Code'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-identifier"
                    name="identifier"
                    type="text"
                    autoComplete={role === 'admin' ? 'username' : 'off'}
                    className={`ls-input ${fieldErrors.identifier ? 'error' : ''}`}
                    placeholder={
                      role === 'admin'
                        ? 'e.g. admin or admin@limesurvey.local'
                        : 'e.g. VOTE-DEMO-2026'
                    }
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (fieldErrors.identifier) setFieldErrors((prev) => ({ ...prev, identifier: null }));
                    }}
                    disabled={isSubmitting}
                    style={{ paddingLeft: '38px' }}
                  />
                  <i
                    className={role === 'admin' ? 'ri-user-line' : 'ri-key-2-line'}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--ls-color-g-600)',
                    }}
                  />
                </div>
                {fieldErrors.identifier && (
                  <p className="ls-error-text">
                    <i className="ri-alert-line" /> {fieldErrors.identifier}
                  </p>
                )}
              </div>

              {/* Password Input (Admin Only) */}
              {role === 'admin' && (
                <div className="ls-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="ls-label" htmlFor="login-password">
                      Password
                    </label>
                    <a
                      href="#forgot-password"
                      onClick={(e) => {
                        e.preventDefault();
                        alert('Password reset instructions have been sent to system administration.');
                      }}
                      style={{ fontSize: 'var(--ls-font-size-xs)' }}
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className={`ls-input ${fieldErrors.password ? 'error' : ''}`}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
                      }}
                      disabled={isSubmitting}
                      style={{ paddingLeft: '38px', paddingRight: '40px' }}
                    />
                    <i
                      className="ri-lock-line"
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--ls-color-g-600)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--ls-color-g-600)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} style={{ fontSize: '18px' }} />
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="ls-error-text">
                      <i className="ri-alert-line" /> {fieldErrors.password}
                    </p>
                  )}
                </div>
              )}

              {/* Remember Me Checkbox (Admin Only) */}
              {role === 'admin' && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--ls-space-6)' }}>
                  <input
                    id="login-remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ marginRight: '8px', cursor: 'pointer' }}
                  />
                  <label htmlFor="login-remember" style={{ fontSize: '14px', color: 'var(--ls-color-g-700)', cursor: 'pointer' }}>
                    Remember this device for 30 days
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="ls-btn ls-btn-primary ls-btn-lg"
                style={{ width: '100%' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="ri-loader-4-line ri-spin" /> Authenticating...
                  </>
                ) : (
                  <>
                    <i className={role === 'admin' ? 'ri-shield-keyhole-line' : 'ri-login-circle-line'} />
                    {role === 'admin' ? 'Log in as Administrator' : 'Enter Survey'}
                  </>
                )}
              </button>

              {/* Toggle to Sign Up (Admin Only) */}
              {role === 'admin' && (
                <div style={{ textAlign: 'center', marginTop: 'var(--ls-space-4)' }}>
                  <p style={{ fontSize: '14px', color: 'var(--ls-color-g-700)' }}>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAdminMode('register');
                        setFieldErrors({});
                        setGeneralError('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--ls-color-primary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                        fontSize: '14px',
                      }}
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              )}
            </>
          )}
        </form>

        {/* Footer info link */}
        <div style={{ textAlign: 'center', marginTop: 'var(--ls-space-6)', paddingTop: 'var(--ls-space-4)', borderTop: '1px solid var(--ls-color-g-200)' }}>
          <p style={{ fontSize: '13px', color: 'var(--ls-color-g-600)' }}>
            Looking for public surveys?{' '}
            <Link to="/" style={{ fontWeight: 500 }}>
              Browse Available Surveys
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
