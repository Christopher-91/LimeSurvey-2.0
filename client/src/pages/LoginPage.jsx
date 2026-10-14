import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SegmentedToggle } from '../components/SegmentedToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export const LoginPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, isAuthenticated, isAdmin } = useAuth();

  // Role initialization from deep link or default to 'voter'
  const initialRole = searchParams.get('role') === 'admin' ? 'admin' : 'voter';
  const [role, setRole] = useState(initialRole);

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
    setFieldErrors({});
    setGeneralError('');
    setSearchParams(newRole === 'admin' ? { role: 'admin' } : {});
  };

  const validateForm = () => {
    const errors = {};
    if (!identifier.trim()) {
      errors.identifier =
        role === 'admin'
          ? 'Please enter your administrator username or email.'
          : 'Please enter your voter ID, email, or survey access code.';
    }

    if (role === 'admin' && !password) {
      errors.password = 'Please enter your administrator password.';
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
    } catch (err) {
      // Security rule: Clear failed-login message that does not reveal which field was wrong
      setGeneralError(err.message || 'Invalid login credentials. Please verify your details.');
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
            {role === 'admin' ? 'Administration Login' : 'Voter & Participant Portal'}
          </h1>
          <p className="ls-helper-text" style={{ fontSize: '14px' }}>
            {role === 'admin'
              ? 'Access the LimeSurvey control panel to manage surveys and responses.'
              : 'Enter your survey access token or voter credentials to participate.'}
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

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Identifier Input */}
          <div className="ls-form-group">
            <label className="ls-label" htmlFor="login-identifier">
              {role === 'admin' ? 'Username or Email' : 'Voter Access Code / Voter ID'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-identifier"
                name="identifier"
                type={role === 'admin' ? 'text' : 'text'}
                autoComplete={role === 'admin' ? 'username' : 'off'}
                className={`ls-input ${fieldErrors.identifier ? 'error' : ''}`}
                placeholder={
                  role === 'admin'
                    ? 'e.g. admin or admin@limesurvey.local'
                    : 'e.g. VOTE-DEMO-2026 or participant email'
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

          {/* Password Input (Required for Admin, Optional for Voter) */}
          <div className="ls-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="ls-label" htmlFor="login-password">
                Password {role === 'voter' && <span style={{ color: 'var(--ls-color-g-600)', fontWeight: 400 }}>(Optional for token access)</span>}
              </label>
              {role === 'admin' && (
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
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={role === 'admin' ? 'current-password' : 'off'}
                className={`ls-input ${fieldErrors.password ? 'error' : ''}`}
                placeholder={role === 'admin' ? '••••••••••••' : 'Optional password'}
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

          {/* Remember Me Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--ls-space-6)' }}>
            <input
              id="login-remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                accentColor: 'var(--ls-color-primary)',
                marginRight: '8px',
                cursor: 'pointer',
              }}
            />
            <label htmlFor="login-remember" style={{ fontSize: '14px', color: 'var(--ls-color-g-700)', cursor: 'pointer' }}>
              Remember this device for 30 days
            </label>
          </div>

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
