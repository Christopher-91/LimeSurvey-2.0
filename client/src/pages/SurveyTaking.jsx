import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/apiClient.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatFileSize, getFileIcon, isImageFile } from '../utils/fileUtils.js';
import {
  SUPPORTED_LANGUAGES,
  autoTranslateQuestion,
  getLocalizedQuestion,
  getLocalizedSurvey,
  getUiText,
} from '../utils/i18n.js';

const RankingQuestionInput = ({ question, value, onChange, lang = 'en' }) => {
  const options = question.options || [];

  const [items, setItems] = useState(() => {
    if (Array.isArray(value) && value.length === options.length) {
      return value.map((code) => options.find((o) => o.code === code) || { code, text: code });
    }
    return [...options];
  });

  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  useEffect(() => {
    if (Array.isArray(value) && value.length === options.length) {
      const mapped = value.map((code) => options.find((o) => o.code === code) || { code, text: code });
      setItems(mapped);
    } else if (!value || value.length === 0) {
      onChange(options.map((o) => o.code));
    }
  }, [value, options]);

  const updateOrder = (newItems) => {
    setItems(newItems);
    onChange(newItems.map((o) => o.code));
  };

  const moveItem = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    updateOrder(updated);
  };

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    moveItem(draggedIdx, targetIdx);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleRankSelect = (currentIdx, newRank1Based) => {
    const targetIdx = newRank1Based - 1;
    if (targetIdx === currentIdx || targetIdx < 0 || targetIdx >= items.length) return;
    moveItem(currentIdx, targetIdx);
  };

  const handleReset = () => {
    updateOrder([...options]);
  };

  const getRankSuffix = (rank) => {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `${rank}th`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '10px 14px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#475569',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="ri-arrow-up-down-line" style={{ color: '#10b981', fontSize: '16px' }} />
          <span>
            {getUiText('ranking_hint', lang)}
          </span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '12px',
            textDecoration: 'underline',
            padding: '2px 4px',
          }}
          title="Reset to default order"
        >
          Reset order
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((item, idx) => {
          const rank = idx + 1;
          const isDragging = draggedIdx === idx;
          const isDragOver = dragOverIdx === idx;

          return (
            <div
              key={item.code}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={() => {
                setDraggedIdx(null);
                setDragOverIdx(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: isDragOver ? '#ecfdf5' : '#ffffff',
                border: isDragOver ? '2px dashed #10b981' : isDragging ? '1px dashed #94a3b8' : '1px solid #e2e8f0',
                borderRadius: '8px',
                opacity: isDragging ? 0.45 : 1,
                cursor: 'grab',
                transition: 'all 0.15s ease',
                boxShadow: isDragOver ? '0 4px 12px rgba(16, 185, 129, 0.12)' : '0 1px 2px rgba(0,0,0,0.03)',
                userSelect: 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#94a3b8',
                  fontSize: '20px',
                  cursor: 'grab',
                }}
                title="Drag to reorder"
              >
                <i className="ri-draggable" />
              </div>

              <div
                style={{
                  minWidth: '46px',
                  height: '32px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  flexShrink: 0,
                  backgroundColor: rank === 1 ? '#10b981' : rank === 2 ? '#0284c7' : rank === 3 ? '#6366f1' : '#f1f5f9',
                  color: rank <= 3 ? '#ffffff' : '#475569',
                  border: rank === 1 ? '1px solid #059669' : rank === 2 ? '1px solid #0369a1' : rank === 3 ? '1px solid #4f46e5' : '1px solid #cbd5e1',
                  boxShadow: rank === 1 ? '0 1px 3px rgba(16, 185, 129, 0.3)' : 'none',
                }}
              >
                {getRankSuffix(rank)}
              </div>

              <div style={{ flex: 1, fontSize: '15px', fontWeight: 500, color: '#0f172a' }}>
                {item.text}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Rank:</span>
                <select
                  value={rank}
                  onChange={(e) => handleRankSelect(idx, parseInt(e.target.value, 10))}
                  style={{
                    padding: '5px 8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#1e293b',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  title="Assign rank position"
                >
                  {items.map((_, rIdx) => (
                    <option key={rIdx + 1} value={rIdx + 1}>
                      {rIdx + 1} ({getRankSuffix(rIdx + 1)} choice)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'inline-flex', gap: '3px' }}>
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveItem(idx, idx - 1)}
                  style={{
                    width: '30px',
                    height: '30px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '5px',
                    backgroundColor: idx === 0 ? '#f8fafc' : '#ffffff',
                    color: idx === 0 ? '#cbd5e1' : '#475569',
                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                  }}
                  title="Move Up"
                >
                  <i className="ri-arrow-up-s-line" />
                </button>
                <button
                  type="button"
                  disabled={idx === items.length - 1}
                  onClick={() => moveItem(idx, idx + 1)}
                  style={{
                    width: '30px',
                    height: '30px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '5px',
                    backgroundColor: idx === items.length - 1 ? '#f8fafc' : '#ffffff',
                    color: idx === items.length - 1 ? '#cbd5e1' : '#475569',
                    cursor: idx === items.length - 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                  }}
                  title="Move Down"
                >
                  <i className="ri-arrow-down-s-line" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FileUploadQuestionInput = ({ question, value, onChange, error, lang = 'en' }) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState(null);
  const settings = question.settings || {};
  const maxFiles = settings.maxFiles || 3;
  const maxFileSize = settings.maxFileSize || 10;
  const allowedTypes = settings.allowedTypes || 'all';

  const filesList = Array.isArray(value) ? value : [];

  const handleFiles = (incoming) => {
    setFileError(null);
    const files = Array.from(incoming);
    const maxBytes = maxFileSize * 1024 * 1024;
    const remainingSlots = maxFiles - filesList.length;

    if (remainingSlots <= 0) {
      setFileError(`Maximum limit of ${maxFiles} file${maxFiles > 1 ? 's' : ''} reached.`);
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    const validFiles = [];

    for (const file of filesToProcess) {
      if (file.size > maxBytes) {
        setFileError(`"${file.name}" exceeds the ${maxFileSize} MB size limit.`);
        return;
      }
      if (allowedTypes === 'images' && !file.type.startsWith('image/')) {
        setFileError(`"${file.name}" is not an image file (PNG, JPG, etc.).`);
        return;
      }
      if (allowedTypes === 'media' && !file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
        setFileError(`"${file.name}" is not an audio or video file.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const fileObj = {
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: e.target.result,
        };
        validFiles.push(fileObj);
        if (validFiles.length === filesToProcess.length) {
          onChange([...filesList, ...validFiles]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (idx) => {
    const updated = filesList.filter((_, i) => i !== idx);
    onChange(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${error || fileError ? 'var(--ls-color-danger, #ef4444)' : isDragOver ? 'var(--ls-color-primary, #10b981)' : 'var(--ls-color-g-400, #cbd5e1)'}`,
          borderRadius: 'var(--ls-radius-md, 8px)',
          padding: '24px 20px',
          textAlign: 'center',
          backgroundColor: isDragOver ? 'var(--ls-color-primary-subtle, #ecfdf5)' : 'var(--ls-color-g-100, #f8fafc)',
          cursor: filesList.length >= maxFiles ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          style={{ display: 'none' }}
          disabled={filesList.length >= maxFiles}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: isDragOver ? '#d1fae5' : '#e2e8f0',
            color: 'var(--ls-color-primary, #10b981)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            margin: '0 auto 10px auto',
          }}
        >
          <i className="ri-upload-cloud-2-line" />
        </div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ls-color-g-900, #0f172a)' }}>
          {filesList.length >= maxFiles
            ? getUiText('file_limit_reached', lang)
            : getUiText('file_upload_prompt', lang)}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ls-color-g-600, #64748b)', marginTop: '4px' }}>
          {allowedTypes === 'images' && 'Images only (PNG, JPG, WebP, SVG)'}
          {allowedTypes === 'documents' && 'Documents (PDF, Word, Excel, Text)'}
          {allowedTypes === 'media' && 'Media (Audio & Video files)'}
          {allowedTypes === 'all' && 'All standard file types supported'}
          {` • Max ${maxFileSize} MB per file • Up to ${maxFiles} file${maxFiles > 1 ? 's' : ''}`}
        </div>
      </div>

      {/* File-level error banner */}
      {fileError && (
        <div style={{ fontSize: '12px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <i className="ri-error-warning-line" /> {fileError}
        </div>
      )}

      {/* Attached Files List */}
      {filesList.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ls-color-g-700, #334155)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{getUiText('attached_files', lang)} ({filesList.length} of {maxFiles}):</span>
            <button
              type="button"
              onClick={() => onChange([])}
              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', padding: 0 }}
            >
              {getUiText('remove_all', lang)}
            </button>
          </div>
          {filesList.map((file, fIdx) => (
            <div
              key={fIdx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: 'var(--ls-radius-sm, 6px)',
                backgroundColor: '#ffffff',
                border: '1px solid var(--ls-color-g-300, #e2e8f0)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              {isImageFile(file.type, file.name) && file.dataUrl ? (
                <img
                  src={file.dataUrl}
                  alt={file.name}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '4px',
                    objectFit: 'cover',
                    border: '1px solid #cbd5e1',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--ls-color-g-100, #f1f5f9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    color: 'var(--ls-color-g-700, #475569)',
                    flexShrink: 0,
                  }}
                >
                  <i className={getFileIcon(file.type, file.name)} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--ls-color-g-900, #0f172a)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={file.name}
                >
                  {file.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ls-color-g-600, #64748b)', marginTop: '2px' }}>
                  {formatFileSize(file.size)}
                </div>
              </div>

              {/* View / Download preview link */}
              {file.dataUrl && (
                <a
                  href={file.dataUrl}
                  download={file.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--ls-color-g-100, #f1f5f9)',
                    color: 'var(--ls-color-g-800, #334155)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Preview / Download file"
                >
                  <i className="ri-external-link-line" />
                </a>
              )}

              <button
                type="button"
                onClick={() => removeFile(fIdx)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '18px',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                title="Remove attachment"
              >
                <i className="ri-delete-bin-line" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CompletionLandingPage = ({ survey, selectedLang }) => {
  const theme = survey?.settings?.theme || {};
  const accentColor = theme.accentColor || '#10b981';
  const showLogo = Boolean(theme.showLogo && theme.logoUrl);
  const completion = theme.completion || {};

  const locEndMessage =
    survey?.settings?.translations?.[selectedLang]?.endMessage !== undefined
      ? survey?.settings?.translations?.[selectedLang]?.endMessage
      : survey?.endMessage;

  const headline = completion.customTitle?.trim() || getUiText('success_title', selectedLang);
  const message = completion.customMessage?.trim() || locEndMessage || getUiText('success_message', selectedLang);

  const redirectEnabled = Boolean(completion.redirectEnabled && completion.redirectUrl);
  const initialDelay = typeof completion.redirectDelay === 'number' ? completion.redirectDelay : 3;
  const [secondsRemaining, setSecondsRemaining] = useState(initialDelay);

  useEffect(() => {
    if (!redirectEnabled) return;
    if (secondsRemaining <= 0) {
      window.location.href = completion.redirectUrl;
      return;
    }
    const timer = setTimeout(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [redirectEnabled, secondsRemaining, completion.redirectUrl]);

  return (
    <div className="ls-container" style={{ maxWidth: '640px', marginTop: 'var(--ls-space-8)' }}>
      <div
        className="ls-card"
        style={{
          textAlign: 'center',
          padding: 'var(--ls-space-10) var(--ls-space-6)',
          borderTop: `6px solid ${accentColor}`,
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
        }}
      >
        {showLogo && (
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
            <img
              src={theme.logoUrl}
              alt="Brand Logo"
              style={{ maxHeight: '60px', maxWidth: '240px', objectFit: 'contain' }}
            />
          </div>
        )}

        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            backgroundColor: `${accentColor}18`,
            color: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '34px',
            margin: '0 auto 20px auto',
          }}
        >
          <i className="ri-check-line" />
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
          {headline}
        </h1>
        <p style={{ color: '#475569', fontSize: '15px', lineHeight: 1.6, marginBottom: '28px', whiteSpace: 'pre-wrap' }}>
          {message}
        </p>

        {redirectEnabled ? (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#334155' }}>
              <i className="ri-loader-4-line ri-spin" style={{ color: accentColor }} />
              <span>
                Redirecting automatically in <strong>{secondsRemaining}s</strong>...
              </span>
            </div>

            <a
              href={completion.redirectUrl}
              className="ls-btn ls-btn-primary"
              style={{
                backgroundColor: accentColor,
                borderColor: accentColor,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 24px',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              <span>{completion.buttonText || 'Continue to Website'}</span>
              <i className="ri-arrow-right-line" />
            </a>
          </div>
        ) : (
          <Link
            to="/"
            className="ls-btn ls-btn-primary"
            style={{
              backgroundColor: accentColor,
              borderColor: accentColor,
              padding: '10px 24px',
              fontSize: '14px',
            }}
          >
            {getUiText('return_home', selectedLang)}
          </Link>
        )}
      </div>
    </div>
  );
};

const MapBrowserQuestionInput = ({ question, value, onChange }) => {
  const [data, setData] = useState(() => value || null);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  useEffect(() => {
    if (!data) {
      const userAgent = navigator.userAgent || '';
      let browser = 'Unknown Browser';
      if (userAgent.includes('Firefox')) browser = 'Mozilla Firefox';
      else if (userAgent.includes('SamsungBrowser')) browser = 'Samsung Internet';
      else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';
      else if (userAgent.includes('Edge') || userAgent.includes('Edg')) browser = 'Microsoft Edge';
      else if (userAgent.includes('Chrome')) browser = 'Google Chrome';
      else if (userAgent.includes('Safari')) browser = 'Apple Safari';

      let os = 'Unknown OS';
      if (userAgent.includes('Win')) os = 'Windows';
      else if (userAgent.includes('Mac')) os = 'macOS';
      else if (userAgent.includes('Android')) os = 'Android';
      else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
      else if (userAgent.includes('Linux')) os = 'Linux';

      const screenRes = typeof window !== 'undefined' && window.screen
        ? `${window.screen.width}x${window.screen.height}`
        : 'Unknown';
      const tz = typeof Intl !== 'undefined' && Intl.DateTimeFormat
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : 'UTC';
      const language = navigator.language || 'en-US';

      const initialData = {
        browser,
        os,
        screenResolution: screenRes,
        timezone: tz,
        language,
        timestamp: new Date().toISOString(),
      };
      setData(initialData);
      onChange(initialData);
    }
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const updated = {
          ...(data || {}),
          gps: {
            latitude: Number(pos.coords.latitude.toFixed(5)),
            longitude: Number(pos.coords.longitude.toFixed(5)),
            accuracy: Math.round(pos.coords.accuracy),
          },
        };
        setData(updated);
        onChange(updated);
      },
      (err) => {
        setLocating(false);
        setGpsError(err.message || 'Unable to retrieve location.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div
      style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        padding: '16px',
        maxWidth: '560px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <i className="ri-shield-check-line" style={{ color: '#10b981', fontSize: '20px' }} />
        <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b' }}>
          Environment &amp; Telemetry Detection
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '8px',
          fontSize: '12.5px',
          backgroundColor: '#ffffff',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div>
          <span style={{ color: '#64748b', display: 'block' }}>Browser:</span>
          <strong>{data?.browser || 'Detecting...'}</strong>
        </div>
        <div>
          <span style={{ color: '#64748b', display: 'block' }}>Operating System:</span>
          <strong>{data?.os || 'Detecting...'}</strong>
        </div>
        <div>
          <span style={{ color: '#64748b', display: 'block' }}>Screen Viewport:</span>
          <strong>{data?.screenResolution || 'Detecting...'}</strong>
        </div>
        <div>
          <span style={{ color: '#64748b', display: 'block' }}>Timezone:</span>
          <strong>{data?.timezone || 'Detecting...'}</strong>
        </div>
      </div>

      {question.settings?.captureGps !== false && (
        <div style={{ marginTop: '12px' }}>
          {data?.gps ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#ecfdf5',
                color: '#065f46',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid #a7f3d0',
              }}
            >
              <i className="ri-map-pin-2-fill" style={{ color: '#10b981' }} />
              <span>Location captured: {data.gps.latitude}, {data.gps.longitude} (±{data.gps.accuracy}m)</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={locating}
              className="ls-btn ls-btn-outline ls-btn-sm"
              style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <i className={locating ? 'ri-loader-4-line ri-spin' : 'ri-map-pin-line'} />
              {locating ? 'Detecting GPS Location...' : 'Include GPS Coordinates'}
            </button>
          )}
          {gpsError && (
            <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#ef4444' }}>
              {gpsError}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const EquationQuestionInput = ({ question, allAnswers, onChange }) => {
  const formula = question.settings?.formula || '';

  const calculateResult = () => {
    if (!formula) return 0;
    try {
      const expression = formula.replace(/\{([A-Za-z0-9_]+)\}/g, (_, qCode) => {
        const val = allAnswers[qCode];
        if (typeof val === 'number') return String(val);
        if (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '') return String(Number(val));
        if (typeof val === 'object' && val !== null) {
          const subSum = Object.values(val).reduce((a, b) => a + (Number(b) || 0), 0);
          return String(subSum);
        }
        return '0';
      });

      const sanitized = expression.replace(/[^0-9.+\-*/() ]/g, '');
      if (!sanitized.trim()) return 0;
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${sanitized});`)();
      return typeof result === 'number' && !isNaN(result) ? Math.round(result * 100) / 100 : 0;
    } catch {
      return 0;
    }
  };

  const calculatedValue = calculateResult();

  useEffect(() => {
    onChange(calculatedValue);
  }, [calculatedValue]);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 18px',
        borderRadius: '8px',
        backgroundColor: '#fdf2f8',
        border: '1px solid #fbcfe8',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9d174d', fontWeight: 600, fontSize: '14px' }}>
        <i className="ri-functions" style={{ fontSize: '18px' }} />
        <span>Calculated Score:</span>
      </div>
      <div style={{ fontSize: '20px', fontWeight: 800, color: '#831843', fontFamily: 'monospace' }}>
        {calculatedValue}
      </div>
    </div>
  );
};

export const SurveyTaking = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { showToast } = useToast();

  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');

  useEffect(() => {
    const fetchSurveyToTake = async () => {
      try {
        const res = await apiClient.get(`/surveys/${id}/take`);
        if (res.success && res.data.survey) {
          const s = res.data.survey;
          setSurvey(s);
          const sSettings = s.settings || {};
          const defLang = sSettings.defaultLanguage || 'en';
          setSelectedLang(defLang);

          const allQ = [
            ...(s.questions || []),
            ...((s.groups || []).flatMap((g) => g.questions || [])),
          ];
          setQuestions(allQ);
        }
      } catch (err) {
        showToast(err.message || 'Unable to open survey', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSurveyToTake();
  }, [id]);

  // Auto-translate questions on the fly if respondent toggles to an untranslated language
  useEffect(() => {
    if (!survey || selectedLang === (survey?.settings?.defaultLanguage || 'en')) return;

    const missing = questions.some(
      (q) => q.text?.trim() && !q.settings?.translations?.[selectedLang]?.text?.trim()
    );

    if (missing) {
      const translateMissing = async () => {
        try {
          const updated = await Promise.all(
            questions.map(async (q) => {
              const curTrans = q.settings?.translations || {};
              if (curTrans[selectedLang]?.text?.trim() || !q.text?.trim()) {
                return q;
              }
              const translatedQ = await autoTranslateQuestion(
                q,
                selectedLang,
                survey?.settings?.defaultLanguage || 'en'
              );
              if (translatedQ) {
                return {
                  ...q,
                  settings: {
                    ...(q.settings || {}),
                    translations: {
                      ...curTrans,
                      [selectedLang]: {
                        ...translatedQ,
                      },
                    },
                  },
                };
              }
              return q;
            })
          );
          setQuestions(updated);
        } catch (err) {
          console.error('Auto-translate on taking survey error:', err);
        }
      };
      translateMissing();
    }
  }, [selectedLang, survey]);

  const handleAnswerChange = (qCode, value) => {
    setAnswers((prev) => ({
      ...prev,
      [qCode]: value,
    }));
    if (errors[qCode]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[qCode];
        return copy;
      });
    }
  };

  const handleMultiChoiceToggle = (qCode, optionCode) => {
    const current = Array.isArray(answers[qCode]) ? answers[qCode] : [];
    const updated = current.includes(optionCode)
      ? current.filter((c) => c !== optionCode)
      : [...current, optionCode];
    handleAnswerChange(qCode, updated);
  };

  const validate = () => {
    const newErrors = {};
    for (const q of questions) {
      if (q.mandatory) {
        const val = answers[q.code];
        if (
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0)
        ) {
          newErrors[q.code] = 'This question is required.';
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast(getUiText('validation_error', selectedLang), 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post(`/surveys/${id}/responses`, {
        answers,
        token: token || undefined,
      });

      if (res.success) {
        setIsCompleted(true);
        showToast(getUiText('success_message', selectedLang), 'success');
      }
    } catch (err) {
      showToast(err.message || 'Submission failed. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="ls-container" style={{ maxWidth: '720px' }}>
        <div className="ls-card">
          <div className="ls-skeleton" style={{ width: '60%', marginBottom: '20px' }} />
          <div className="ls-skeleton" style={{ width: '90%', marginBottom: '14px' }} />
          <div className="ls-skeleton" style={{ width: '40%' }} />
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="ls-container" style={{ maxWidth: '600px', textAlign: 'center' }}>
        <div className="ls-card ls-empty-state">
          <i className="ri-error-warning-line ls-empty-icon" style={{ color: 'var(--ls-color-danger)' }} />
          <h2>Survey Unavailable</h2>
          <p style={{ margin: '12px 0 24px 0' }}>This survey could not be found or is currently closed.</p>
          <Link to="/" className="ls-btn ls-btn-primary">
            Back to Public Surveys
          </Link>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return <CompletionLandingPage survey={survey} selectedLang={selectedLang} />;
  }

  const localizedSurvey = getLocalizedSurvey(survey, selectedLang);
  const theme = survey?.settings?.theme || {};
  const accentColor = theme.accentColor || '#10b981';
  const showLogo = Boolean(theme.showLogo && theme.logoUrl);
  const supportedLangs =
    Array.isArray(survey?.settings?.supportedLanguages) && survey.settings.supportedLanguages.length > 0
      ? survey.settings.supportedLanguages
      : ['en'];

  return (
    <div className="ls-container" style={{ maxWidth: '780px', fontFamily: theme.fontFamily || 'inherit' }}>
      {theme.fontFamily && (
        <style>{`
          .ls-container, .ls-container input, .ls-container textarea, .ls-container select, .ls-container button, .ls-container label, .ls-container p, .ls-container span, .ls-container h1, .ls-container h2, .ls-container h3 {
            font-family: ${theme.fontFamily} !important;
          }
        `}</style>
      )}
      {/* Multilingual Selector Header Bar */}
      {supportedLangs.length > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ffffff',
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
          >
            <i className="ri-translate-2" style={{ color: accentColor, fontSize: '16px' }} />
            <label htmlFor="survey-lang-select" style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
              {getUiText('language', selectedLang)}:
            </label>
            <select
              id="survey-lang-select"
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '13px',
                fontWeight: 600,
                color: '#0f172a',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {supportedLangs.map((code) => {
                const lObj = SUPPORTED_LANGUAGES.find((l) => l.code === code) || { code, name: code };
                return (
                  <option key={code} value={code}>
                    {lObj.name} ({lObj.nativeName || lObj.name})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}

      {/* Survey Title & Welcome Card */}
      <div className="ls-card" style={{ marginBottom: 'var(--ls-space-6)', borderTop: `6px solid ${accentColor}` }}>
        {showLogo && (
          <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center' }}>
            <img
              src={theme.logoUrl}
              alt="Brand Logo"
              style={{ maxHeight: '56px', maxWidth: '220px', objectFit: 'contain' }}
            />
          </div>
        )}
        <h1 style={{ fontSize: 'var(--ls-font-size-2xl)', fontWeight: 700, marginBottom: '8px' }}>
          {localizedSurvey.title}
        </h1>
        {localizedSurvey.description && (
          <p style={{ color: 'var(--ls-color-g-600)', fontSize: '15px', marginBottom: '16px' }}>
            {localizedSurvey.description}
          </p>
        )}
        {localizedSurvey.welcomeMessage && (
          <div style={{ backgroundColor: 'var(--ls-color-g-100)', padding: '14px 18px', borderRadius: 'var(--ls-radius-sm)', fontSize: '14px', borderLeft: `3px solid ${accentColor}` }}>
            {localizedSurvey.welcomeMessage}
          </div>
        )}

        {token && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: accentColor }}>
            <i className="ri-shield-keyhole-line" /> Access Token Verified: <code>{token}</code>
          </div>
        )}
      </div>

      {/* Questionnaire Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {questions.map((rawQ, idx) => {
            const q = getLocalizedQuestion(rawQ, selectedLang, survey?.settings);

            if (q.settings?.isGroupHeader) {
              return (
                <div
                  key={q.id || idx}
                  style={{
                    padding: '20px 24px',
                    borderRadius: 'var(--ls-radius-md)',
                    backgroundColor: `${accentColor}12`,
                    border: '1px solid',
                    borderColor: `${accentColor}40`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <i className="ri-folder-2-line" style={{ fontSize: '20px', color: accentColor }} />
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--ls-color-g-900)' }}>
                      {q.text || 'Question Group'}
                    </h3>
                  </div>
                  {q.helpText && (
                    <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--ls-color-g-700)' }}>
                      {q.helpText}
                    </p>
                  )}
                </div>
              );
            }

            return (
              <div
                key={q.id || idx}
                className="ls-card"
                style={{
                  borderLeft: errors[q.code] ? '4px solid var(--ls-color-danger)' : undefined,
                  transition: 'border 0.2s',
                }}
              >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontWeight: 700, color: accentColor }}>
                  {idx + 1}.
                </span>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '16px', fontWeight: 600, display: 'block', color: 'var(--ls-color-g-900)' }}>
                    {q.text} {q.mandatory && <span style={{ color: 'var(--ls-color-danger)' }}>*</span>}
                  </label>
                  {q.helpText && (
                    <span style={{ fontSize: '13px', color: 'var(--ls-color-g-600)', display: 'block', marginTop: '2px' }}>
                      {q.helpText}
                    </span>
                  )}
                </div>
              </div>

              {/* RENDER QUESTION BY TYPE */}
              {/* 1. Single Choice */}
              {['single_choice', 'multiple_choice'].includes(q.type) &&
                !(q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple)) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Dropdown Display */}
                  {q.settings?.displayType === 'dropdown' ? (
                    <select
                      className={`ls-select ${errors[q.code] ? 'error' : ''}`}
                      value={answers[q.code] || ''}
                      onChange={(e) => handleAnswerChange(q.code, e.target.value)}
                      style={{ maxWidth: '420px', padding: '10px 14px', fontSize: '15px' }}
                    >
                      <option value="">-- Please select an option --</option>
                      {q.options?.map((opt) => (
                        <option key={opt.code || opt.id} value={opt.code}>
                          {opt.text}
                        </option>
                      ))}
                    </select>
                  ) : q.settings?.displayType === 'button_group' ? (
                    /* Segmented Button Pills Display */
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {q.options?.map((opt) => {
                        const isSelected = answers[q.code] === opt.code;
                        return (
                          <button
                            key={opt.code || opt.id}
                            type="button"
                            onClick={() => handleAnswerChange(q.code, opt.code)}
                            style={{
                              padding: '10px 18px',
                              borderRadius: '24px',
                              border: '2px solid',
                              borderColor: isSelected ? accentColor : 'var(--ls-color-g-300)',
                              backgroundColor: isSelected ? accentColor : '#ffffff',
                              color: isSelected ? '#ffffff' : 'var(--ls-color-g-900)',
                              fontWeight: 600,
                              fontSize: '14px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                            }}
                          >
                            {opt.text}
                          </button>
                        );
                      })}
                    </div>
                  ) : q.settings?.displayType === 'gender_cards' ? (
                    /* Gender Cards Display */
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                      {q.options?.map((opt) => {
                        const isSelected = answers[q.code] === opt.code;
                        const icon =
                          opt.code === 'F' ? 'ri-women-line' :
                          opt.code === 'M' ? 'ri-men-line' :
                          opt.code === 'NB' ? 'ri-genderless-line' : 'ri-user-smile-line';
                        return (
                          <div
                            key={opt.code || opt.id}
                            onClick={() => handleAnswerChange(q.code, opt.code)}
                            style={{
                              border: '2px solid',
                              borderColor: isSelected ? accentColor : '#e2e8f0',
                              borderRadius: '8px',
                              padding: '16px 12px',
                              textAlign: 'center',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? `${accentColor}14` : '#ffffff',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <i className={icon} style={{ fontSize: '28px', color: isSelected ? accentColor : '#64748b', display: 'block', marginBottom: '6px' }} />
                            <div style={{ fontSize: '13.5px', fontWeight: 600, color: isSelected ? accentColor : '#1e293b' }}>
                              {opt.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : q.settings?.displayType === 'image_select' ? (
                    /* Image Select Cards Grid */
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                      {q.options?.map((opt) => {
                        const isSelected = answers[q.code] === opt.code;
                        return (
                          <div
                            key={opt.code || opt.id}
                            onClick={() => handleAnswerChange(q.code, opt.code)}
                            style={{
                              border: '2px solid',
                              borderColor: isSelected ? accentColor : '#e2e8f0',
                              borderRadius: '8px',
                              padding: '10px',
                              textAlign: 'center',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? `${accentColor}14` : '#ffffff',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {opt.imageUrl ? (
                              <img
                                src={opt.imageUrl}
                                alt={opt.text}
                                style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '100%',
                                  height: '80px',
                                  backgroundColor: '#f1f5f9',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#94a3b8',
                                  fontSize: '28px',
                                  marginBottom: '8px',
                                }}
                              >
                                <i className="ri-image-2-line" />
                              </div>
                            )}
                            <div style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? accentColor : '#1e293b' }}>
                              {opt.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Default List (Radio) */
                    q.options?.map((opt) => (
                      <label
                        key={opt.id || opt.code}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          borderRadius: 'var(--ls-radius-sm)',
                          backgroundColor: answers[q.code] === opt.code ? `${accentColor}18` : 'var(--ls-color-g-100)',
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor: answers[q.code] === opt.code ? accentColor : 'transparent',
                        }}
                      >
                        <input
                          type="radio"
                          name={q.code}
                          value={opt.code}
                          checked={answers[q.code] === opt.code}
                          onChange={() => handleAnswerChange(q.code, opt.code)}
                          style={{ accentColor: accentColor, width: '18px', height: '18px' }}
                        />
                        <span style={{ fontSize: '15px' }}>{opt.text}</span>
                      </label>
                    ))
                  )}

                  {/* List with comment / Other Field */}
                  {q.settings?.hasOtherComment && (
                    <div style={{ marginTop: '6px' }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--ls-color-g-800)', marginBottom: '4px' }}>
                        Other / Additional Comments:
                      </label>
                      <input
                        type="text"
                        className="ls-input"
                        placeholder="Please specify any additional details..."
                        value={answers[`${q.code}_comment`] || ''}
                        onChange={(e) => handleAnswerChange(`${q.code}_comment`, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 2. Multiple Choice */}
              {['single_choice', 'multiple_choice'].includes(q.type) &&
                (q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple)) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {q.settings?.displayType === 'button_group' ? (
                    /* Multiple Choice Button Pills */
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {q.options?.map((opt) => {
                        const isChecked = Array.isArray(answers[q.code]) && answers[q.code].includes(opt.code);
                        return (
                          <button
                            key={opt.code || opt.id}
                            type="button"
                            onClick={() => handleMultiChoiceToggle(q.code, opt.code)}
                            style={{
                              padding: '10px 18px',
                              borderRadius: '24px',
                              border: '2px solid',
                              borderColor: isChecked ? accentColor : 'var(--ls-color-g-300)',
                              backgroundColor: isChecked ? accentColor : '#ffffff',
                              color: isChecked ? '#ffffff' : 'var(--ls-color-g-900)',
                              fontWeight: 600,
                              fontSize: '14px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            {isChecked && <i className="ri-check-line" />}
                            {opt.text}
                          </button>
                        );
                      })}
                    </div>
                  ) : q.settings?.displayType === 'image_select' ? (
                    /* Multiple Choice Image Select Grid */
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                      {q.options?.map((opt) => {
                        const isChecked = Array.isArray(answers[q.code]) && answers[q.code].includes(opt.code);
                        return (
                          <div
                            key={opt.code || opt.id}
                            onClick={() => handleMultiChoiceToggle(q.code, opt.code)}
                            style={{
                              border: '2px solid',
                              borderColor: isChecked ? accentColor : '#e2e8f0',
                              borderRadius: '8px',
                              padding: '10px',
                              textAlign: 'center',
                              cursor: 'pointer',
                              position: 'relative',
                              backgroundColor: isChecked ? `${accentColor}14` : '#ffffff',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {isChecked && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  backgroundColor: accentColor,
                                  color: '#ffffff',
                                  borderRadius: '50%',
                                  width: '22px',
                                  height: '22px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '13px',
                                }}
                              >
                                <i className="ri-check-line" />
                              </div>
                            )}
                            {opt.imageUrl ? (
                              <img
                                src={opt.imageUrl}
                                alt={opt.text}
                                style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '100%',
                                  height: '80px',
                                  backgroundColor: '#f1f5f9',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#94a3b8',
                                  fontSize: '28px',
                                  marginBottom: '8px',
                                }}
                              >
                                <i className="ri-image-2-line" />
                              </div>
                            )}
                            <div style={{ fontSize: '14px', fontWeight: 600, color: isChecked ? accentColor : '#1e293b' }}>
                              {opt.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Default Multiple Choice Checkboxes */
                    q.options?.map((opt) => {
                      const isChecked = Array.isArray(answers[q.code]) && answers[q.code].includes(opt.code);
                      return (
                        <label
                          key={opt.id || opt.code}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 14px',
                            borderRadius: 'var(--ls-radius-sm)',
                            backgroundColor: isChecked ? `${accentColor}18` : 'var(--ls-color-g-100)',
                            cursor: 'pointer',
                            border: '1px solid',
                            borderColor: isChecked ? accentColor : 'transparent',
                          }}
                        >
                          <input
                            type="checkbox"
                            value={opt.code}
                            checked={isChecked}
                            onChange={() => handleMultiChoiceToggle(q.code, opt.code)}
                            style={{ accentColor: accentColor, width: '18px', height: '18px' }}
                          />
                          <span style={{ fontSize: '15px' }}>{opt.text}</span>
                        </label>
                      );
                    })
                  )}

                  {/* Multiple Choice with comments */}
                  {q.settings?.hasOtherComment && (
                    <div style={{ marginTop: '6px' }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--ls-color-g-800)', marginBottom: '4px' }}>
                        Other / Additional Comments:
                      </label>
                      <input
                        type="text"
                        className="ls-input"
                        placeholder="Please specify any additional details..."
                        value={answers[`${q.code}_comment`] || ''}
                        onChange={(e) => handleAnswerChange(`${q.code}_comment`, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 3. Ranking / Preference Order */}
              {q.type === 'ranking' && (
                <RankingQuestionInput
                  question={q}
                  value={answers[q.code]}
                  onChange={(rankedCodes) => handleAnswerChange(q.code, rankedCodes)}
                  lang={selectedLang}
                />
              )}

              {/* 4. Rating (1 - 5 Stars) */}
              {q.type === 'rating' && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isSelected = String(answers[q.code]) === String(star);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleAnswerChange(q.code, String(star))}
                        className="ls-btn"
                        style={{
                          flex: 1,
                          minWidth: '60px',
                          height: '50px',
                          backgroundColor: isSelected ? 'var(--ls-color-banana)' : 'var(--ls-color-g-100)',
                          color: '#000',
                          fontWeight: 600,
                          fontSize: '16px',
                          border: '1px solid',
                          borderColor: isSelected ? accentColor : 'var(--ls-color-g-300)',
                        }}
                      >
                        <i className={isSelected ? 'ri-star-fill' : 'ri-star-line'} style={{ color: '#e69500' }} />
                        {star}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 5. Yes / No Switch */}
              {q.type === 'yes_no' && (
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button
                    type="button"
                    onClick={() => handleAnswerChange(q.code, 'Y')}
                    className="ls-btn"
                    style={{
                      flex: 1,
                      backgroundColor: answers[q.code] === 'Y' ? accentColor : 'var(--ls-color-g-100)',
                      color: answers[q.code] === 'Y' ? '#fff' : 'var(--ls-color-g-900)',
                      border: '1px solid',
                      borderColor: answers[q.code] === 'Y' ? accentColor : 'var(--ls-color-g-400)',
                    }}
                  >
                    <i className="ri-check-line" /> {getUiText('yes', selectedLang)}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAnswerChange(q.code, 'N')}
                    className="ls-btn"
                    style={{
                      flex: 1,
                      backgroundColor: answers[q.code] === 'N' ? 'var(--ls-color-danger)' : 'var(--ls-color-g-100)',
                      color: answers[q.code] === 'N' ? '#fff' : 'var(--ls-color-g-900)',
                      border: '1px solid var(--ls-color-g-400)',
                    }}
                  >
                    <i className="ri-close-line" /> {getUiText('no', selectedLang)}
                  </button>
                </div>
              )}

              {/* 6. Short Free Text */}
              {q.type === 'short_text' && (
                <input
                  type="text"
                  className={`ls-input ${errors[q.code] ? 'error' : ''}`}
                  placeholder={getUiText('short_placeholder', selectedLang)}
                  value={answers[q.code] || ''}
                  onChange={(e) => handleAnswerChange(q.code, e.target.value)}
                />
              )}

              {/* 7. Long Free Text */}
              {q.type === 'long_text' && (
                <textarea
                  className={`ls-textarea ${errors[q.code] ? 'error' : ''}`}
                  rows="4"
                  placeholder={getUiText('long_placeholder', selectedLang)}
                  value={answers[q.code] || ''}
                  onChange={(e) => handleAnswerChange(q.code, e.target.value)}
                />
              )}

              {/* 8. Multiple Short Text */}
              {q.type === 'multiple_short_text' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(q.settings?.fields || ['Field 1', 'Field 2']).map((fld, fIdx) => (
                    <div key={fIdx}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ls-color-g-800)', marginBottom: '4px' }}>
                        {fld}
                      </label>
                      <input
                        type="text"
                        className="ls-input"
                        placeholder={`Enter ${fld}...`}
                        value={answers[q.code]?.[fld] || ''}
                        onChange={(e) => {
                          const current = typeof answers[q.code] === 'object' && answers[q.code] !== null ? answers[q.code] : {};
                          handleAnswerChange(q.code, { ...current, [fld]: e.target.value });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* 9. Numerical Input (Single) */}
              {['number', 'numerical_input'].includes(q.type) && (
                <div style={{ display: 'flex', alignItems: 'center', maxWidth: '300px' }}>
                  {q.settings?.prefix && (
                    <span style={{ padding: '8px 12px', backgroundColor: 'var(--ls-color-g-200)', border: '1px solid var(--ls-color-g-400)', borderRight: 'none', borderRadius: '4px 0 0 4px', fontSize: '14px', fontWeight: 600 }}>
                      {q.settings.prefix}
                    </span>
                  )}
                  <input
                    type="number"
                    className={`ls-input ${errors[q.code] ? 'error' : ''}`}
                    min={q.settings?.min}
                    max={q.settings?.max}
                    step={q.settings?.step || 'any'}
                    placeholder="0"
                    value={answers[q.code] !== undefined ? answers[q.code] : ''}
                    onChange={(e) => handleAnswerChange(q.code, e.target.value)}
                    style={{
                      borderRadius: q.settings?.prefix && q.settings?.suffix ? '0' : q.settings?.prefix ? '0 4px 4px 0' : q.settings?.suffix ? '4px 0 0 4px' : '4px',
                    }}
                  />
                  {q.settings?.suffix && (
                    <span style={{ padding: '8px 12px', backgroundColor: 'var(--ls-color-g-200)', border: '1px solid var(--ls-color-g-400)', borderLeft: 'none', borderRadius: '0 4px 4px 0', fontSize: '14px', fontWeight: 600 }}>
                      {q.settings.suffix}
                    </span>
                  )}
                </div>
              )}

              {/* 10. Multiple Numerical Input with running Grand Total */}
              {q.type === 'multiple_numerical_input' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(q.settings?.rows || ['Item 1', 'Item 2']).map((row, rIdx) => (
                    <div key={rIdx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: 'var(--ls-color-g-900)' }}>
                        {row}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', width: '160px' }}>
                        {q.settings?.prefix && (
                          <span style={{ padding: '6px 10px', backgroundColor: 'var(--ls-color-g-200)', border: '1px solid var(--ls-color-g-400)', borderRight: 'none', borderRadius: '4px 0 0 4px', fontSize: '13px', fontWeight: 600 }}>
                            {q.settings.prefix}
                          </span>
                        )}
                        <input
                          type="number"
                          className="ls-input"
                          placeholder="0.00"
                          value={answers[q.code]?.[row] !== undefined ? answers[q.code][row] : ''}
                          onChange={(e) => {
                            const current = typeof answers[q.code] === 'object' && answers[q.code] !== null ? answers[q.code] : {};
                            handleAnswerChange(q.code, { ...current, [row]: e.target.value });
                          }}
                          style={{
                            borderRadius: q.settings?.prefix ? '0 4px 4px 0' : '4px',
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  {q.settings?.showSum !== false && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '8px',
                        padding: '10px 14px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '14px',
                      }}
                    >
                      <span>Grand Total:</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '16px', color: accentColor }}>
                        {q.settings?.prefix || ''}
                        {(
                          Object.values(
                            typeof answers[q.code] === 'object' && answers[q.code] !== null ? answers[q.code] : {}
                          ).reduce((acc, v) => acc + (parseFloat(v) || 0), 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 11. Date / Time */}
              {['date', 'date_time'].includes(q.type) && (
                <input
                  type={
                    (q.settings?.inputType || 'datetime') === 'time'
                      ? 'time'
                      : (q.settings?.inputType || 'datetime') === 'date'
                      ? 'date'
                      : 'datetime-local'
                  }
                  className={`ls-input ${errors[q.code] ? 'error' : ''}`}
                  value={answers[q.code] || ''}
                  onChange={(e) => handleAnswerChange(q.code, e.target.value)}
                  style={{ maxWidth: '280px' }}
                />
              )}

              {/* 12. Map / Browser Detection */}
              {q.type === 'map_browser' && (
                <MapBrowserQuestionInput
                  question={q}
                  value={answers[q.code]}
                  onChange={(telemetry) => handleAnswerChange(q.code, telemetry)}
                />
              )}

              {/* 13. Equation Calculation */}
              {q.type === 'equation' && (
                <EquationQuestionInput
                  question={q}
                  allAnswers={answers}
                  onChange={(result) => handleAnswerChange(q.code, result)}
                />
              )}

              {/* 14. Matrix / Grid */}
              {q.type === 'matrix' && (
                <div style={{ overflowX: 'auto', border: '1px solid var(--ls-color-g-300)', borderRadius: 'var(--ls-radius-sm)', background: '#fff' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--ls-color-g-100)' }}>
                        <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--ls-color-g-400)' }}></th>
                        {(q.settings?.columns || (q.options?.length ? q.options.map((o) => o.text) : ['1', '2', '3', '4', '5'])).map((col, cIdx) => (
                          <th key={cIdx} style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, borderBottom: '1px solid var(--ls-color-g-400)', color: 'var(--ls-color-g-800)' }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(q.settings?.rows || ['Item 1', 'Item 2']).map((row, rIdx) => (
                        <tr key={rIdx} style={{ borderBottom: '1px solid var(--ls-color-g-200)' }}>
                          <td style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 500, fontSize: '14px', color: 'var(--ls-color-g-900)' }}>
                            {row}
                          </td>
                          {(q.settings?.columns || (q.options?.length ? q.options.map((o) => o.text) : ['1', '2', '3', '4', '5'])).map((col, cIdx) => (
                            <td key={cIdx} style={{ padding: '12px 14px' }}>
                              <input
                                type="radio"
                                name={`${q.code}_${rIdx}`}
                                checked={answers[q.code]?.[row] === col}
                                onChange={() => {
                                  const current = typeof answers[q.code] === 'object' && answers[q.code] !== null ? answers[q.code] : {};
                                  handleAnswerChange(q.code, { ...current, [row]: col });
                                }}
                                style={{ accentColor: accentColor, width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 15. File Upload / Media Attachments */}
              {q.type === 'file_upload' && (
                <FileUploadQuestionInput
                  question={q}
                  value={answers[q.code]}
                  onChange={(files) => handleAnswerChange(q.code, files)}
                  error={errors[q.code]}
                  lang={selectedLang}
                />
              )}

              {/* Validation error */}
              {errors[q.code] && (
                <p className="ls-error-text" style={{ marginTop: '8px' }}>
                  <i className="ri-alert-line" /> {errors[q.code]}
                </p>
              )}
            </div>
          );
        })}
        </div>

        {/* Submit Bar */}
        <div style={{ marginTop: 'var(--ls-space-8)', textAlign: 'center' }}>
          <button
            type="submit"
            className="ls-btn ls-btn-primary ls-btn-lg"
            style={{ minWidth: '240px', backgroundColor: accentColor, borderColor: accentColor }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <i className="ri-loader-4-line ri-spin" /> {getUiText('submitting', selectedLang)}
              </>
            ) : (
              <>
                <i className="ri-send-plane-fill" /> {getUiText('submit', selectedLang)}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
