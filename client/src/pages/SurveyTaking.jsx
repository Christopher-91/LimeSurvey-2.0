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
    const locEndMessage =
      survey?.settings?.translations?.[selectedLang]?.endMessage !== undefined
        ? survey?.settings?.translations?.[selectedLang]?.endMessage
        : survey.endMessage;

    return (
      <div className="ls-container" style={{ maxWidth: '640px', marginTop: 'var(--ls-space-8)' }}>
        <div className="ls-card" style={{ textAlign: 'center', padding: 'var(--ls-space-10) var(--ls-space-6)' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--ls-color-primary-subtle)',
              color: 'var(--ls-color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto var(--ls-space-4) auto',
            }}
          >
            <i className="ri-check-line" />
          </div>

          <h1 style={{ fontSize: 'var(--ls-font-size-2xl)', marginBottom: '12px' }}>
            {getUiText('success_title', selectedLang)}
          </h1>
          <p style={{ color: 'var(--ls-color-g-600)', fontSize: '16px', lineHeight: 1.6, marginBottom: 'var(--ls-space-8)' }}>
            {locEndMessage || getUiText('success_message', selectedLang)}
          </p>

          <Link to="/" className="ls-btn ls-btn-primary">
            {getUiText('return_home', selectedLang)}
          </Link>
        </div>
      </div>
    );
  }

  const localizedSurvey = getLocalizedSurvey(survey, selectedLang);
  const supportedLangs =
    Array.isArray(survey?.settings?.supportedLanguages) && survey.settings.supportedLanguages.length > 0
      ? survey.settings.supportedLanguages
      : ['en'];

  return (
    <div className="ls-container" style={{ maxWidth: '780px' }}>
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
            <i className="ri-translate-2" style={{ color: 'var(--ls-color-primary, #10b981)', fontSize: '16px' }} />
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
      <div className="ls-card" style={{ marginBottom: 'var(--ls-space-6)', borderTop: '6px solid var(--ls-color-primary)' }}>
        <h1 style={{ fontSize: 'var(--ls-font-size-2xl)', fontWeight: 700, marginBottom: '8px' }}>
          {localizedSurvey.title}
        </h1>
        {localizedSurvey.description && (
          <p style={{ color: 'var(--ls-color-g-600)', fontSize: '15px', marginBottom: '16px' }}>
            {localizedSurvey.description}
          </p>
        )}
        {localizedSurvey.welcomeMessage && (
          <div style={{ backgroundColor: 'var(--ls-color-g-100)', padding: '14px 18px', borderRadius: 'var(--ls-radius-sm)', fontSize: '14px', borderLeft: '3px solid var(--ls-color-action)' }}>
            {localizedSurvey.welcomeMessage}
          </div>
        )}

        {token && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--ls-color-primary)' }}>
            <i className="ri-shield-keyhole-line" /> Access Token Verified: <code>{token}</code>
          </div>
        )}
      </div>

      {/* Questionnaire Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {questions.map((rawQ, idx) => {
            const q = getLocalizedQuestion(rawQ, selectedLang, survey?.settings);

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
                <span style={{ fontWeight: 700, color: 'var(--ls-color-primary)' }}>
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
              {/* 1. Single Choice (Radio) */}
              {['single_choice', 'multiple_choice'].includes(q.type) &&
                !(q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple)) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {q.options?.map((opt) => (
                    <label
                      key={opt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        borderRadius: 'var(--ls-radius-sm)',
                        backgroundColor: answers[q.code] === opt.code ? 'var(--ls-color-primary-subtle)' : 'var(--ls-color-g-100)',
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: answers[q.code] === opt.code ? 'var(--ls-color-primary)' : 'transparent',
                      }}
                    >
                      <input
                        type="radio"
                        name={q.code}
                        value={opt.code}
                        checked={answers[q.code] === opt.code}
                        onChange={() => handleAnswerChange(q.code, opt.code)}
                        style={{ accentColor: 'var(--ls-color-primary)', width: '18px', height: '18px' }}
                      />
                      <span style={{ fontSize: '15px' }}>{opt.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* 2. Multiple Choice (Checkboxes) */}
              {['single_choice', 'multiple_choice'].includes(q.type) &&
                (q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple)) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {q.options?.map((opt) => {
                    const isChecked = Array.isArray(answers[q.code]) && answers[q.code].includes(opt.code);
                    return (
                      <label
                        key={opt.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          borderRadius: 'var(--ls-radius-sm)',
                          backgroundColor: isChecked ? 'var(--ls-color-primary-subtle)' : 'var(--ls-color-g-100)',
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor: isChecked ? 'var(--ls-color-primary)' : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          value={opt.code}
                          checked={isChecked}
                          onChange={() => handleMultiChoiceToggle(q.code, opt.code)}
                          style={{ accentColor: 'var(--ls-color-primary)', width: '18px', height: '18px' }}
                        />
                        <span style={{ fontSize: '15px' }}>{opt.text}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 2.5 Ranking / Preference Order */}
              {q.type === 'ranking' && (
                <RankingQuestionInput
                  question={q}
                  value={answers[q.code]}
                  onChange={(rankedCodes) => handleAnswerChange(q.code, rankedCodes)}
                  lang={selectedLang}
                />
              )}

              {/* 3. Rating (1 - 5 Stars) */}
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
                          borderColor: isSelected ? '#d8bd20' : 'var(--ls-color-g-300)',
                        }}
                      >
                        <i className={isSelected ? 'ri-star-fill' : 'ri-star-line'} style={{ color: '#e69500' }} />
                        {star}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 4. Yes / No Switch */}
              {q.type === 'yes_no' && (
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button
                    type="button"
                    onClick={() => handleAnswerChange(q.code, 'Y')}
                    className="ls-btn"
                    style={{
                      flex: 1,
                      backgroundColor: answers[q.code] === 'Y' ? 'var(--ls-color-primary)' : 'var(--ls-color-g-100)',
                      color: answers[q.code] === 'Y' ? '#fff' : 'var(--ls-color-g-900)',
                      border: '1px solid var(--ls-color-g-400)',
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

              {/* 5. Short Free Text */}
              {q.type === 'short_text' && (
                <input
                  type="text"
                  className={`ls-input ${errors[q.code] ? 'error' : ''}`}
                  placeholder={getUiText('short_placeholder', selectedLang)}
                  value={answers[q.code] || ''}
                  onChange={(e) => handleAnswerChange(q.code, e.target.value)}
                />
              )}

              {/* 6. Long Free Text */}
              {q.type === 'long_text' && (
                <textarea
                  className={`ls-textarea ${errors[q.code] ? 'error' : ''}`}
                  rows="4"
                  placeholder={getUiText('long_placeholder', selectedLang)}
                  value={answers[q.code] || ''}
                  onChange={(e) => handleAnswerChange(q.code, e.target.value)}
                />
              )}

              {/* 7. Number */}
              {q.type === 'number' && (
                <input
                  type="number"
                  className={`ls-input ${errors[q.code] ? 'error' : ''}`}
                  placeholder="e.g. 42"
                  value={answers[q.code] || ''}
                  onChange={(e) => handleAnswerChange(q.code, e.target.value)}
                  style={{ maxWidth: '240px' }}
                />
              )}

              {/* 8. Date */}
              {q.type === 'date' && (
                <input
                  type="date"
                  className={`ls-input ${errors[q.code] ? 'error' : ''}`}
                  value={answers[q.code] || ''}
                  onChange={(e) => handleAnswerChange(q.code, e.target.value)}
                  style={{ maxWidth: '240px' }}
                />
              )}

              {/* 9. Matrix / Grid */}
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
                                style={{ accentColor: 'var(--ls-color-primary)', width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 10. File Upload / Media Attachments */}
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
            style={{ minWidth: '240px' }}
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
