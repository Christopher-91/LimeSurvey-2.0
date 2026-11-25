import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient.js';
import { useToast } from '../context/ToastContext.jsx';

/**
 * Extracts initials for the administrator avatar circle
 */
const getInitials = (name, fallback = 'A') => {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

/**
 * Formats a Date into a friendly localized string
 */
const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Returns a human-friendly relative time string (e.g. "3 mins ago")
 */
const getRelativeTime = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - d) / 1000);

  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Parses simple browser / OS from user-agent string
 */
const parseUserAgent = (ua) => {
  if (!ua) return 'Web Browser';
  let browser = 'Browser';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';

  let os = '';
  if (ua.includes('Mac OS') || ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return os ? `${browser} on ${os}` : browser;
};

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL'); // 'ALL' | 'LOGIN' | 'LOGOUT'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const { showToast } = useToast();

  const fetchLogs = async (pageNum = 1) => {
    try {
      setIsRefreshing(true);
      const params = new URLSearchParams();
      params.append('page', pageNum);
      params.append('limit', '30');
      if (actionFilter && actionFilter !== 'ALL') {
        params.append('action', actionFilter);
      }
      if (search && search.trim()) {
        params.append('search', search.trim());
      }

      const [logsRes, statsRes] = await Promise.all([
        apiClient.get(`/audit-logs?${params.toString()}`),
        apiClient.get('/audit-logs/stats'),
      ]);

      if (logsRes.success) {
        setLogs(logsRes.data.logs || []);
        setTotalPages(logsRes.data.totalPages || 1);
        setTotalRecords(logsRes.data.total || 0);
        setPage(logsRes.data.page || 1);
      }

      if (statsRes.success) {
        setStats(statsRes.data.stats);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load audit logs', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleExportCsv = () => {
    if (!logs || logs.length === 0) {
      showToast('No logs available to export.', 'info');
      return;
    }

    const headers = ['ID', 'Action', 'Date & Time', 'Username', 'Full Name', 'Email', 'IP Address', 'User Agent'];
    const rows = logs.map((l) => [
      l.id,
      l.action,
      new Date(l.timestamp).toISOString(),
      `"${l.username || ''}"`,
      `"${l.fullName || l.user?.fullName || ''}"`,
      `"${l.email || l.user?.email || ''}"`,
      `"${l.ipAddress || ''}"`,
      `"${(l.userAgent || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `admin_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit logs exported to CSV successfully.', 'success');
  };

  return (
    <div className="ls-container">
      {/* Header */}
      <div className="ls-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Link to="/admin/dashboard" style={{ fontSize: '14px', textDecoration: 'none', color: 'var(--ls-color-primary)', fontWeight: 600 }}>
              ← Back to Dashboard
            </Link>
          </div>
          <h1 className="ls-page-title" style={{ margin: 0 }}>
            Administrator Audit Logs
          </h1>
          <p className="ls-page-subtitle">
            Chronological records of administrator login and logout timestamps, IP addresses, and session authentication events.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => fetchLogs(page)}
            className="ls-btn ls-btn-outline"
            disabled={isRefreshing}
            style={{ gap: '6px' }}
          >
            <i className={isRefreshing ? 'ri-loader-4-line ri-spin' : 'ri-refresh-line'} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="ls-btn ls-btn-outline"
            style={{ gap: '6px' }}
          >
            <i className="ri-download-2-line" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: 'var(--ls-space-6)',
        }}
      >
        <div className="ls-card" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--ls-color-g-600)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Audit Events
          </span>
          <div style={{ fontSize: '28px', fontWeight: 700, margin: '4px 0', color: 'var(--ls-color-primary)' }}>
            {stats ? stats.totalEvents : totalRecords}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--ls-color-g-600)' }}>All authentication records</span>
        </div>

        <div className="ls-card" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--ls-color-g-600)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Logins
          </span>
          <div style={{ fontSize: '28px', fontWeight: 700, margin: '4px 0', color: '#16a34a' }}>
            {stats ? stats.totalLogins : '—'}
          </div>
          <span style={{ fontSize: '12px', color: '#16a34a' }}>
            <i className="ri-login-box-line" /> Successful sign-ins
          </span>
        </div>

        <div className="ls-card" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--ls-color-g-600)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Logouts
          </span>
          <div style={{ fontSize: '28px', fontWeight: 700, margin: '4px 0', color: '#64748b' }}>
            {stats ? stats.totalLogouts : '—'}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--ls-color-g-600)' }}>
            <i className="ri-logout-box-r-line" /> Terminated sessions
          </span>
        </div>

        <div className="ls-card" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--ls-color-g-600)', textTransform: 'uppercase', fontWeight: 600 }}>
            Active Admins Logged
          </span>
          <div style={{ fontSize: '28px', fontWeight: 700, margin: '4px 0', color: 'var(--ls-color-grape)' }}>
            {stats ? stats.uniqueAdminsCount : '—'}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--ls-color-g-600)' }}>Unique admin accounts</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="ls-card" style={{ marginBottom: 'var(--ls-space-6)', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          {/* Action Filter Pills */}
          <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setActionFilter('ALL')}
              className="ls-btn ls-btn-sm"
              style={{
                backgroundColor: actionFilter === 'ALL' ? '#ffffff' : 'transparent',
                color: actionFilter === 'ALL' ? '#0f172a' : '#64748b',
                boxShadow: actionFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                border: 'none',
                fontWeight: 600,
              }}
            >
              All Events
            </button>
            <button
              type="button"
              onClick={() => setActionFilter('LOGIN')}
              className="ls-btn ls-btn-sm"
              style={{
                backgroundColor: actionFilter === 'LOGIN' ? '#ffffff' : 'transparent',
                color: actionFilter === 'LOGIN' ? '#16a34a' : '#64748b',
                boxShadow: actionFilter === 'LOGIN' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                border: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <i className="ri-login-box-line" /> Logins Only
            </button>
            <button
              type="button"
              onClick={() => setActionFilter('LOGOUT')}
              className="ls-btn ls-btn-sm"
              style={{
                backgroundColor: actionFilter === 'LOGOUT' ? '#ffffff' : 'transparent',
                color: actionFilter === 'LOGOUT' ? '#475569' : '#64748b',
                boxShadow: actionFilter === 'LOGOUT' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                border: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <i className="ri-logout-box-r-line" /> Logouts Only
            </button>
          </div>

          {/* Search Input Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', minWidth: '280px', flex: '1', maxWidth: '420px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                className="ls-input"
                placeholder="Search admin, email, or IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '34px', fontSize: '13.5px' }}
              />
              <i
                className="ri-search-line"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
            </div>
            <button type="submit" className="ls-btn ls-btn-primary ls-btn-sm" style={{ padding: '0 16px' }}>
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="ls-card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '40px 24px' }}>
            <div className="ls-skeleton" style={{ width: '40%', marginBottom: '16px' }} />
            <div className="ls-skeleton" style={{ width: '100%', marginBottom: '12px' }} />
            <div className="ls-skeleton" style={{ width: '100%', marginBottom: '12px' }} />
            <div className="ls-skeleton" style={{ width: '80%' }} />
          </div>
        ) : logs.length === 0 ? (
          <div className="ls-empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <i className="ri-history-line ls-empty-icon" style={{ fontSize: '42px', color: '#94a3b8' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginTop: '12px', color: '#1e293b' }}>
              No audit records found
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '420px', margin: '6px auto 0' }}>
              {search || actionFilter !== 'ALL'
                ? 'No events match your current filter criteria. Try clearing the search or switching filters.'
                : 'Administrator login and logout events will be logged here automatically.'}
            </p>
          </div>
        ) : (
          <div className="ls-table-container">
            <table className="ls-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>ID</th>
                  <th>Action</th>
                  <th>Administrator</th>
                  <th>Date & Time</th>
                  <th>IP Address</th>
                  <th>Client / Device</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const isLogin = log.action === 'LOGIN';
                  const adminName = log.fullName || log.user?.fullName || log.username || 'Administrator';
                  const adminEmail = log.email || log.user?.email || '—';

                  return (
                    <tr key={log.id}>
                      <td style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
                        #{log.id}
                      </td>
                      <td>
                        <span
                          className="ls-badge"
                          style={{
                            backgroundColor: isLogin ? '#ecfdf5' : '#f1f5f9',
                            color: isLogin ? '#15803d' : '#475569',
                            border: isLogin ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                          }}
                        >
                          <i className={isLogin ? 'ri-login-box-line' : 'ri-logout-box-r-line'} />
                          {isLogin ? 'LOGIN' : 'LOGOUT'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: isLogin ? 'var(--ls-color-primary-subtle)' : '#e2e8f0',
                              color: isLogin ? 'var(--ls-color-primary-active)' : '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '12px',
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(adminName, log.username?.[0] || 'A')}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13.5px' }}>
                              {adminName}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              @{log.username} &bull; {adminEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>
                            {formatDateTime(log.timestamp)}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '1px' }}>
                            {getRelativeTime(log.timestamp)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <code style={{ fontSize: '12.5px', color: '#334155', backgroundColor: '#f8fafc', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                            {log.ipAddress || '127.0.0.1'}
                          </code>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12.5px', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <i className="ri-computer-line" style={{ color: '#94a3b8', fontSize: '14px' }} />
                          <span>{parseUserAgent(log.userAgent)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
            }}
          >
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalRecords} total entries)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => fetchLogs(page - 1)}
                disabled={page <= 1}
                className="ls-btn ls-btn-outline ls-btn-sm"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => fetchLogs(page + 1)}
                disabled={page >= totalPages}
                className="ls-btn ls-btn-outline ls-btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
