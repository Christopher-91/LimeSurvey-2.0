import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/apiClient.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatFileSize, getFileIcon, isImageFile } from '../utils/fileUtils.js';
import {
  SUPPORTED_LANGUAGES,
  autoTranslateQuestion,
  autoTranslateText,
  getLocalizedQuestion,
  getLocalizedSurvey,
  getUiText,
} from '../utils/i18n.js';

const PreviewRankingQuestion = ({ question, value, onChange }) => {
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
    if (dragOverIdx !== index) setDragOverIdx(index);
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

  const getRankSuffix = (rank) => {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `${rank}th`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginBottom: '2px' }}>
        <i className="ri-arrow-up-down-line" /> Drag items or select rank dropdowns to reorder (1st to {items.length}):
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                gap: '10px',
                padding: '8px 12px',
                backgroundColor: isDragOver ? '#ecfdf5' : '#ffffff',
                border: isDragOver ? '2px dashed #10b981' : isDragging ? '1px dashed #94a3b8' : '1px solid #e2e8f0',
                borderRadius: '6px',
                opacity: isDragging ? 0.45 : 1,
                cursor: 'grab',
                transition: 'all 0.15s ease',
                userSelect: 'none',
              }}
            >
              <i className="ri-draggable" style={{ color: '#94a3b8', fontSize: '18px' }} />
              <div
                style={{
                  minWidth: '40px',
                  height: '26px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  flexShrink: 0,
                  backgroundColor: rank === 1 ? '#10b981' : rank === 2 ? '#0284c7' : rank === 3 ? '#6366f1' : '#f1f5f9',
                  color: rank <= 3 ? '#ffffff' : '#475569',
                  border: rank === 1 ? '1px solid #059669' : '1px solid #cbd5e1',
                }}
              >
                {getRankSuffix(rank)}
              </div>
              <div style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>
                {item.text}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Rank:</span>
                <select
                  value={rank}
                  onChange={(e) => handleRankSelect(idx, parseInt(e.target.value, 10))}
                  style={{
                    padding: '3px 6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  {items.map((_, rIdx) => (
                    <option key={rIdx + 1} value={rIdx + 1}>
                      {rIdx + 1} ({getRankSuffix(rIdx + 1)})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'inline-flex', gap: '2px' }}>
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveItem(idx, idx - 1)}
                  style={{
                    width: '26px',
                    height: '26px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    backgroundColor: idx === 0 ? '#f8fafc' : '#ffffff',
                    color: idx === 0 ? '#cbd5e1' : '#475569',
                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                  }}
                >
                  <i className="ri-arrow-up-s-line" />
                </button>
                <button
                  type="button"
                  disabled={idx === items.length - 1}
                  onClick={() => moveItem(idx, idx + 1)}
                  style={{
                    width: '26px',
                    height: '26px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    backgroundColor: idx === items.length - 1 ? '#f8fafc' : '#ffffff',
                    color: idx === items.length - 1 ? '#cbd5e1' : '#475569',
                    cursor: idx === items.length - 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                  }}
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

const PreviewFileUploadQuestion = ({ question, value, onChange }) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const settings = question.settings || {};
  const maxFiles = settings.maxFiles || 3;
  const maxFileSize = settings.maxFileSize || 10;
  const allowedTypes = settings.allowedTypes || 'all';

  const filesList = Array.isArray(value) ? value : [];

  const handleFiles = (incoming) => {
    const files = Array.from(incoming);
    const maxBytes = maxFileSize * 1024 * 1024;
    const remainingSlots = maxFiles - filesList.length;

    if (remainingSlots <= 0) {
      alert(`Maximum file limit of ${maxFiles} reached.`);
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      if (file.size > maxBytes) {
        alert(`File "${file.name}" exceeds the ${maxFileSize}MB limit.`);
        return;
      }
      if (allowedTypes === 'images' && !file.type.startsWith('image/')) {
        alert(`File "${file.name}" is not an image.`);
        return;
      }
      if (allowedTypes === 'media' && !file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
        alert(`File "${file.name}" is not an audio or video file.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newFileObj = {
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: e.target.result,
        };
        onChange([...(Array.isArray(value) ? value : []), newFileObj]);
      };
      reader.readAsDataURL(file);
    });
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
          border: `2px dashed ${isDragOver ? '#10b981' : '#cbd5e1'}`,
          borderRadius: '8px',
          padding: '22px 16px',
          textAlign: 'center',
          backgroundColor: isDragOver ? '#ecfdf5' : '#f8fafc',
          cursor: filesList.length >= maxFiles ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
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
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: isDragOver ? '#d1fae5' : '#e2e8f0',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            margin: '0 auto 8px auto',
          }}
        >
          <i className="ri-upload-cloud-2-line" />
        </div>
        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b' }}>
          {filesList.length >= maxFiles
            ? `Limit of ${maxFiles} files reached`
            : 'Click to browse or drag and drop files here'}
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
          {allowedTypes === 'images' && 'Images only (PNG, JPG, WebP, SVG)'}
          {allowedTypes === 'documents' && 'Documents (PDF, Word, Excel, Text)'}
          {allowedTypes === 'media' && 'Media (Audio & Video files)'}
          {allowedTypes === 'all' && 'All standard file types supported'}
          {` • Up to ${maxFileSize} MB per file • Max ${maxFiles} file${maxFiles > 1 ? 's' : ''}`}
        </div>
      </div>

      {/* Uploaded Files Preview Cards */}
      {filesList.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
            <span>Attached Files ({filesList.length}/{maxFiles}):</span>
            <button
              type="button"
              onClick={() => onChange([])}
              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', padding: 0 }}
            >
              Clear all
            </button>
          </div>
          {filesList.map((file, fIdx) => (
            <div
              key={fIdx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              {isImageFile(file.type, file.name) && file.dataUrl ? (
                <img
                  src={file.dataUrl}
                  alt={file.name}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '4px',
                    objectFit: 'cover',
                    border: '1px solid #cbd5e1',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '4px',
                    backgroundColor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    color: '#64748b',
                    flexShrink: 0,
                  }}
                >
                  <i className={getFileIcon(file.type, file.name)} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#0f172a',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={file.name}
                >
                  {file.name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {formatFileSize(file.size)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(fIdx)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '16px',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                title="Remove file"
              >
                <i className="ri-close-line" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const SurveyBuilder = () => {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('builder'); // 'builder' | 'voters'
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState({});

  const handlePreviewAnswerChange = (qKey, value) => {
    setPreviewAnswers((prev) => ({
      ...prev,
      [qKey]: value,
    }));
  };

  const handleTestSubmitPreview = () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q.mandatory) {
        const val = previewAnswers[q.code || `Q_${i}`];
        if (
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0) ||
          (typeof val === 'object' && Object.keys(val).length === 0)
        ) {
          showToast(`Mandatory question #${i + 1} ("${q.text || `Question ${i + 1}`}") is required before submitting.`, 'warning');
          return;
        }
      }
    }
    showToast('Preview test submission successful! All required fields are validated.', 'success');
  };

  const handleResetPreviewAnswers = () => {
    setPreviewAnswers({});
    showToast('Preview responses reset.', 'info');
  };

  // Survey Header Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [endMessage, setEndMessage] = useState('');
  const [showWelcomeCompletion, setShowWelcomeCompletion] = useState(false);

  // Deployment & Privacy Settings
  const [active, setActive] = useState(false);
  const [zeroKnowledgeEnabled, setZeroKnowledgeEnabled] = useState(false);

  // Multilingual Configuration State
  const [supportedLanguages, setSupportedLanguages] = useState(['en']);
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [surveyTranslations, setSurveyTranslations] = useState({});
  const [editingLanguage, setEditingLanguage] = useState('en');
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [previewLang, setPreviewLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatingQIdx, setTranslatingQIdx] = useState(null);

  // Multilingual Field Getters and Setters
  const getQuestionTextForEdit = (q) => {
    if (editingLanguage === defaultLanguage) return q.text;
    return q.settings?.translations?.[editingLanguage]?.text ?? '';
  };

  const setQuestionTextForEdit = (idx, value) => {
    if (editingLanguage === defaultLanguage) {
      updateQuestion(idx, { text: value });
    } else {
      const q = questions[idx];
      const curTrans = q.settings?.translations || {};
      const langTrans = curTrans[editingLanguage] || {};
      updateQuestion(idx, {
        settings: {
          ...(q.settings || {}),
          translations: {
            ...curTrans,
            [editingLanguage]: {
              ...langTrans,
              text: value,
            },
          },
        },
      });
    }
  };

  const getQuestionHelpForEdit = (q) => {
    if (editingLanguage === defaultLanguage) return q.helpText;
    return q.settings?.translations?.[editingLanguage]?.helpText ?? '';
  };

  const setQuestionHelpForEdit = (idx, value) => {
    if (editingLanguage === defaultLanguage) {
      updateQuestion(idx, { helpText: value });
    } else {
      const q = questions[idx];
      const curTrans = q.settings?.translations || {};
      const langTrans = curTrans[editingLanguage] || {};
      updateQuestion(idx, {
        settings: {
          ...(q.settings || {}),
          translations: {
            ...curTrans,
            [editingLanguage]: {
              ...langTrans,
              helpText: value,
            },
          },
        },
      });
    }
  };

  const getOptionTextForEdit = (q, opt) => {
    if (editingLanguage === defaultLanguage) return opt.text;
    return q.settings?.translations?.[editingLanguage]?.options?.[opt.code] ?? '';
  };

  const setOptionTextForEdit = (qIdx, optIdx, value) => {
    if (editingLanguage === defaultLanguage) {
      handleUpdateOption(qIdx, optIdx, value);
    } else {
      const q = questions[qIdx];
      const opt = q.options[optIdx];
      const curTrans = q.settings?.translations || {};
      const langTrans = curTrans[editingLanguage] || {};
      const optTrans = langTrans.options || {};
      updateQuestion(qIdx, {
        settings: {
          ...(q.settings || {}),
          translations: {
            ...curTrans,
            [editingLanguage]: {
              ...langTrans,
              options: {
                ...optTrans,
                [opt.code]: value,
              },
            },
          },
        },
      });
    }
  };

  const getMatrixItemForEdit = (q, kind, itemIdx, defaultVal) => {
    if (editingLanguage === defaultLanguage) return defaultVal;
    const transList = q.settings?.translations?.[editingLanguage]?.[kind];
    if (Array.isArray(transList) && transList[itemIdx] !== undefined) {
      return transList[itemIdx];
    }
    return '';
  };

  const setMatrixItemForEdit = (qIdx, kind, itemIdx, value) => {
    if (editingLanguage === defaultLanguage) {
      handleUpdateMatrixSettings(qIdx, kind, itemIdx, value);
    } else {
      const q = questions[qIdx];
      const curTrans = q.settings?.translations || {};
      const langTrans = curTrans[editingLanguage] || {};
      const baseList = q.settings?.[kind] || (kind === 'rows' ? ['Row 1', 'Row 2'] : ['Column 1', 'Column 2', 'Column 3']);
      const currentList = Array.isArray(langTrans[kind]) ? [...langTrans[kind]] : [...baseList];
      currentList[itemIdx] = value;
      updateQuestion(qIdx, {
        settings: {
          ...(q.settings || {}),
          translations: {
            ...curTrans,
            [editingLanguage]: {
              ...langTrans,
              [kind]: currentList,
            },
          },
        },
      });
    }
  };

  const getSurveyTitleForEdit = () => {
    if (editingLanguage === defaultLanguage) return title;
    return surveyTranslations[editingLanguage]?.title ?? '';
  };

  const setSurveyTitleForEdit = (value) => {
    if (editingLanguage === defaultLanguage) {
      setTitle(value);
    } else {
      setSurveyTranslations((prev) => ({
        ...prev,
        [editingLanguage]: {
          ...(prev[editingLanguage] || {}),
          title: value,
        },
      }));
    }
  };

  const getSurveyDescForEdit = () => {
    if (editingLanguage === defaultLanguage) return description;
    return surveyTranslations[editingLanguage]?.description ?? '';
  };

  const setSurveyDescForEdit = (value) => {
    if (editingLanguage === defaultLanguage) {
      setDescription(value);
    } else {
      setSurveyTranslations((prev) => ({
        ...prev,
        [editingLanguage]: {
          ...(prev[editingLanguage] || {}),
          description: value,
        },
      }));
    }
  };

  const getSurveyWelcomeForEdit = () => {
    if (editingLanguage === defaultLanguage) return welcomeMessage;
    return surveyTranslations[editingLanguage]?.welcomeMessage ?? '';
  };

  const setSurveyWelcomeForEdit = (value) => {
    if (editingLanguage === defaultLanguage) {
      setWelcomeMessage(value);
    } else {
      setSurveyTranslations((prev) => ({
        ...prev,
        [editingLanguage]: {
          ...(prev[editingLanguage] || {}),
          welcomeMessage: value,
        },
      }));
    }
  };

  const getSurveyEndForEdit = () => {
    if (editingLanguage === defaultLanguage) return endMessage;
    return surveyTranslations[editingLanguage]?.endMessage ?? '';
  };

  const setSurveyEndForEdit = (value) => {
    if (editingLanguage === defaultLanguage) {
      setEndMessage(value);
    } else {
      setSurveyTranslations((prev) => ({
        ...prev,
        [editingLanguage]: {
          ...(prev[editingLanguage] || {}),
          endMessage: value,
        },
      }));
    }
  };

  const handleCopyAllFromEnglish = () => {
    if (editingLanguage === defaultLanguage) return;
    setSurveyTranslations((prev) => ({
      ...prev,
      [editingLanguage]: {
        ...(prev[editingLanguage] || {}),
        title,
        description,
        welcomeMessage,
        endMessage,
      },
    }));

    setQuestions((prev) =>
      prev.map((q) => {
        const curTrans = q.settings?.translations || {};
        const langTrans = curTrans[editingLanguage] || {};
        const optMap = {};
        (q.options || []).forEach((o) => {
          optMap[o.code] = o.text;
        });
        return {
          ...q,
          settings: {
            ...(q.settings || {}),
            translations: {
              ...curTrans,
              [editingLanguage]: {
                ...langTrans,
                text: q.text,
                helpText: q.helpText,
                options: optMap,
                rows: q.settings?.rows ? [...q.settings.rows] : undefined,
                columns: q.settings?.columns ? [...q.settings.columns] : undefined,
              },
            },
          },
        };
      })
    );
    showToast(`Copied base language text into ${SUPPORTED_LANGUAGES.find((l) => l.code === editingLanguage)?.name}`, 'info');
  };

  // Automatic Machine Translation Handlers
  const handleSelectLanguage = async (targetLang) => {
    setEditingLanguage(targetLang);
    if (targetLang === defaultLanguage) return;

    setIsTranslating(true);
    try {
      // 1. Auto-translate survey title / description if needed
      if (!surveyTranslations[targetLang]?.title && title.trim()) {
        const transTitle = await autoTranslateText(title, targetLang, defaultLanguage);
        const transDesc = description.trim() ? await autoTranslateText(description, targetLang, defaultLanguage) : '';
        const transWelcome = welcomeMessage.trim() ? await autoTranslateText(welcomeMessage, targetLang, defaultLanguage) : '';
        const transEnd = endMessage.trim() ? await autoTranslateText(endMessage, targetLang, defaultLanguage) : '';

        setSurveyTranslations((prev) => ({
          ...prev,
          [targetLang]: {
            ...(prev[targetLang] || {}),
            title: transTitle,
            description: transDesc,
            welcomeMessage: transWelcome,
            endMessage: transEnd,
          },
        }));
      }

      // 2. Auto-translate questions missing targetLang translation
      let translatedCount = 0;
      const updatedQuestions = await Promise.all(
        questions.map(async (q) => {
          const curTrans = q.settings?.translations || {};
          const langTrans = curTrans[targetLang] || {};

          // If question already translated, keep existing
          if (langTrans.text && langTrans.text.trim()) {
            return q;
          }

          if (!q.text || !q.text.trim()) {
            return q;
          }

          translatedCount++;
          const translatedQ = await autoTranslateQuestion(q, targetLang, defaultLanguage);
          if (translatedQ) {
            return {
              ...q,
              settings: {
                ...(q.settings || {}),
                translations: {
                  ...curTrans,
                  [targetLang]: {
                    ...langTrans,
                    text: translatedQ.text || q.text,
                    helpText: translatedQ.helpText !== undefined ? translatedQ.helpText : q.helpText,
                    options: translatedQ.options || {},
                    rows: translatedQ.rows || q.settings?.rows,
                    columns: translatedQ.columns || q.settings?.columns,
                  },
                },
              },
            };
          }
          return q;
        })
      );

      setQuestions(updatedQuestions);
      const targetLangName = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang)?.name || targetLang;
      if (translatedCount > 0) {
        showToast(`Questions automatically translated to ${targetLangName}!`, 'success');
      }
    } catch (err) {
      console.error('Auto-translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslateSingleQuestion = async (qIndex, targetLang = editingLanguage) => {
    if (targetLang === defaultLanguage) return;
    const q = questions[qIndex];
    if (!q || !q.text?.trim()) {
      showToast('Please enter base question text before translating.', 'info');
      return;
    }

    setTranslatingQIdx(qIndex);
    try {
      const translatedQ = await autoTranslateQuestion(q, targetLang, defaultLanguage);
      if (translatedQ) {
        const curTrans = q.settings?.translations || {};
        const langTrans = curTrans[targetLang] || {};

        updateQuestion(qIndex, {
          settings: {
            ...(q.settings || {}),
            translations: {
              ...curTrans,
              [targetLang]: {
                ...langTrans,
                text: translatedQ.text || q.text,
                helpText: translatedQ.helpText !== undefined ? translatedQ.helpText : q.helpText,
                options: translatedQ.options || {},
                rows: translatedQ.rows || q.settings?.rows,
                columns: translatedQ.columns || q.settings?.columns,
              },
            },
          },
        });

        const targetLangName = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang)?.name || targetLang;
        showToast(`Question #${qIndex + 1} translated to ${targetLangName}!`, 'success');
      }
    } catch (err) {
      console.error('Single translation error:', err);
      showToast('Translation service unavailable.', 'error');
    } finally {
      setTranslatingQIdx(null);
    }
  };

  const handleForceTranslateAll = async (targetLang = editingLanguage) => {
    if (targetLang === defaultLanguage) return;
    setIsTranslating(true);
    try {
      if (title.trim()) {
        const transTitle = await autoTranslateText(title, targetLang, defaultLanguage);
        const transDesc = description.trim() ? await autoTranslateText(description, targetLang, defaultLanguage) : '';
        const transWelcome = welcomeMessage.trim() ? await autoTranslateText(welcomeMessage, targetLang, defaultLanguage) : '';
        const transEnd = endMessage.trim() ? await autoTranslateText(endMessage, targetLang, defaultLanguage) : '';

        setSurveyTranslations((prev) => ({
          ...prev,
          [targetLang]: {
            title: transTitle,
            description: transDesc,
            welcomeMessage: transWelcome,
            endMessage: transEnd,
          },
        }));
      }

      const updatedQuestions = await Promise.all(
        questions.map(async (q) => {
          if (!q.text || !q.text.trim()) return q;
          const translatedQ = await autoTranslateQuestion(q, targetLang, defaultLanguage);
          if (translatedQ) {
            const curTrans = q.settings?.translations || {};
            return {
              ...q,
              settings: {
                ...(q.settings || {}),
                translations: {
                  ...curTrans,
                  [targetLang]: {
                    text: translatedQ.text || q.text,
                    helpText: translatedQ.helpText !== undefined ? translatedQ.helpText : q.helpText,
                    options: translatedQ.options || {},
                    rows: translatedQ.rows || q.settings?.rows,
                    columns: translatedQ.columns || q.settings?.columns,
                  },
                },
              },
            };
          }
          return q;
        })
      );

      setQuestions(updatedQuestions);
      const targetLangName = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang)?.name || targetLang;
      showToast(`All survey questions translated to ${targetLangName}!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Translation error occurred.', 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  const handlePreviewLangChange = async (newLang) => {
    setPreviewLang(newLang);
    if (newLang === defaultLanguage) return;

    // Auto-translate questions missing newLang translation for preview
    const missing = questions.filter(
      (q) => q.text?.trim() && !q.settings?.translations?.[newLang]?.text?.trim()
    );

    if (missing.length > 0) {
      try {
        const updatedQuestions = await Promise.all(
          questions.map(async (q) => {
            const curTrans = q.settings?.translations || {};
            if (curTrans[newLang]?.text?.trim() || !q.text?.trim()) {
              return q;
            }
            const translatedQ = await autoTranslateQuestion(q, newLang, defaultLanguage);
            if (translatedQ) {
              return {
                ...q,
                settings: {
                  ...(q.settings || {}),
                  translations: {
                    ...curTrans,
                    [newLang]: {
                      ...(curTrans[newLang] || {}),
                      text: translatedQ.text || q.text,
                      helpText: translatedQ.helpText !== undefined ? translatedQ.helpText : q.helpText,
                      options: translatedQ.options || {},
                      rows: translatedQ.rows || q.settings?.rows,
                      columns: translatedQ.columns || q.settings?.columns,
                    },
                  },
                },
              };
            }
            return q;
          })
        );
        setQuestions(updatedQuestions);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Dynamic Questions List
  const [questions, setQuestions] = useState([
    {
      id: 'temp-1',
      code: 'Q1',
      text: '',
      type: 'single_choice',
      mandatory: false,
      helpText: '',
      options: [
        { code: 'AO1', text: 'Option 1' },
        { code: 'AO2', text: 'Option 2' },
      ],
      settings: null,
    },
  ]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Floating Toolbar Position Tracking
  const questionCardRefs = useRef([]);
  const questionsContainerRef = useRef(null);
  const [toolbarOffsetTop, setToolbarOffsetTop] = useState(0);

  const updateToolbarPosition = () => {
    const cardEl = questionCardRefs.current[activeQuestionIndex];
    const containerEl = questionsContainerRef.current;
    if (cardEl && containerEl) {
      const cardRect = cardEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();
      const relativeTop = cardRect.top - containerRect.top;
      setToolbarOffsetTop(Math.max(0, relativeTop));
    } else if (cardEl) {
      setToolbarOffsetTop(cardEl.offsetTop || 0);
    }
  };

  useEffect(() => {
    updateToolbarPosition();
    const frameId = requestAnimationFrame(updateToolbarPosition);
    const timer = setTimeout(updateToolbarPosition, 60);
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timer);
    };
  }, [activeQuestionIndex, questions]);

  useEffect(() => {
    const handleResize = () => updateToolbarPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeQuestionIndex]);

  // Voters / Token Management (for existing surveys)
  const [voters, setVoters] = useState([]);
  const [newVoterEmail, setNewVoterEmail] = useState('');
  const [newVoterToken, setNewVoterToken] = useState('');
  const [isUniversalCode, setIsUniversalCode] = useState(false);

  // Batch Member Generation Modal
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchMemberCount, setBatchMemberCount] = useState(10);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isBatchModalOpen && !isGeneratingBatch) {
        setIsBatchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBatchModalOpen, isGeneratingBatch]);

  // Fetch Existing Survey Data
  const fetchSurvey = async () => {
    try {
      const res = await apiClient.get(`/surveys/${id}`);
      if (res.success && res.data.survey) {
        const s = res.data.survey;
        setTitle(s.title || '');
        setDescription(s.description || '');
        setWelcomeMessage(s.welcomeMessage || '');
        setEndMessage(s.endMessage || '');
        setActive(Boolean(s.active));
        setZeroKnowledgeEnabled(
          Boolean(s.zeroKnowledgeEnabled ?? s.zero_knowledge_enabled ?? false)
        );

        if (s.welcomeMessage || s.endMessage) {
          setShowWelcomeCompletion(true);
        }

        const sSettings = s.settings || {};
        if (Array.isArray(sSettings.supportedLanguages) && sSettings.supportedLanguages.length > 0) {
          setSupportedLanguages(sSettings.supportedLanguages);
        }
        if (sSettings.defaultLanguage) {
          setDefaultLanguage(sSettings.defaultLanguage);
        }
        if (sSettings.translations) {
          setSurveyTranslations(sSettings.translations);
        }

        const allQ = [
          ...(s.questions || []),
          ...((s.groups || []).flatMap((g) => g.questions || [])),
        ];

        if (allQ.length > 0) {
          setQuestions(
            allQ.map((q, idx) => ({
              id: q.id,
              code: q.code || `Q${idx + 1}`,
              text: q.text || '',
              type: q.type || 'single_choice',
              mandatory: Boolean(q.mandatory),
              helpText: q.helpText || '',
              options:
                q.options && q.options.length > 0
                  ? q.options.map((o, oIdx) => ({
                      code: o.code || `AO${oIdx + 1}`,
                      text: o.text || '',
                    }))
                  : [
                      { code: 'AO1', text: 'Option 1' },
                      { code: 'AO2', text: 'Option 2' },
                    ],
              settings: q.settings || null,
            }))
          );
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to load survey', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVoters = async () => {
    if (isNew) return;
    try {
      const res = await apiClient.get(`/surveys/${id}/voters`);
      if (res.success) {
        setVoters(res.data.voters || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isNew) {
      fetchSurvey();
      fetchVoters();
    }
  }, [id, isNew]);

  // Question manipulation helpers
  const updateQuestion = (index, updates) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleAddQuestion = (afterIndex = null) => {
    const newIdx = questions.length + 1;
    const newQ = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: `Q${newIdx}`,
      text: '',
      type: 'single_choice',
      mandatory: false,
      helpText: '',
      options: [
        { code: 'AO1', text: 'Option 1' },
        { code: 'AO2', text: 'Option 2' },
      ],
      settings: null,
    };

    setQuestions((prev) => {
      const insertAt =
        afterIndex !== null && afterIndex >= 0 ? afterIndex + 1 : prev.length;
      const copy = [...prev];
      copy.splice(insertAt, 0, newQ);
      return copy;
    });

    const targetIndex =
      afterIndex !== null && afterIndex >= 0
        ? afterIndex + 1
        : questions.length;
    setActiveQuestionIndex(targetIndex);
  };

  const handleDuplicateQuestion = (index) => {
    const source = questions[index];
    const duplicated = {
      ...source,
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: `${source.code}_copy`,
      text: source.text ? `${source.text} (Copy)` : '',
      options: source.options ? source.options.map((o) => ({ ...o })) : [],
      settings: source.settings ? JSON.parse(JSON.stringify(source.settings)) : null,
    };

    setQuestions((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, duplicated);
      return copy;
    });
    setActiveQuestionIndex(index + 1);
    showToast('Question duplicated', 'success');
  };

  const handleDeleteQuestion = (index) => {
    if (questions.length <= 1) {
      showToast('A survey must have at least one question.', 'info');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    setActiveQuestionIndex((prev) => Math.max(0, Math.min(prev, questions.length - 2)));
    showToast('Question removed', 'info');
  };

  const handleMoveQuestion = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    setQuestions((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
    setActiveQuestionIndex(target);
  };

  // Option manipulation helpers for choice questions
  const handleUpdateOption = (qIndex, optIndex, newText) => {
    const q = questions[qIndex];
    const currentOptions = q.options ? [...q.options] : [];
    if (currentOptions[optIndex]) {
      currentOptions[optIndex] = { ...currentOptions[optIndex], text: newText };
      updateQuestion(qIndex, { options: currentOptions });
    }
  };

  const handleAddOption = (qIndex) => {
    const q = questions[qIndex];
    const currentOptions = q.options ? [...q.options] : [];
    const nextNum = currentOptions.length + 1;
    currentOptions.push({
      code: `AO${nextNum}`,
      text: `Option ${nextNum}`,
    });
    updateQuestion(qIndex, { options: currentOptions });
  };

  const handleRemoveOption = (qIndex, optIndex) => {
    const q = questions[qIndex];
    const currentOptions = q.options ? [...q.options] : [];
    if (currentOptions.length <= 1) {
      showToast('Choice questions require at least one option.', 'info');
      return;
    }
    currentOptions.splice(optIndex, 1);
    updateQuestion(qIndex, { options: currentOptions });
  };

  const handleMoveOption = (qIndex, optIndex, direction) => {
    const q = questions[qIndex];
    const currentOptions = q.options ? [...q.options] : [];
    const target = optIndex + direction;
    if (target < 0 || target >= currentOptions.length) return;
    const temp = currentOptions[optIndex];
    currentOptions[optIndex] = currentOptions[target];
    currentOptions[target] = temp;
    updateQuestion(qIndex, { options: currentOptions });
  };

  // Matrix helpers
  const handleUpdateMatrixSettings = (qIndex, rowOrCol, index, value) => {
    const q = questions[qIndex];
    const currentSettings = q.settings || {
      rows: ['Row 1', 'Row 2'],
      columns: ['Column 1', 'Column 2', 'Column 3'],
    };
    const list = [...(currentSettings[rowOrCol] || [])];
    list[index] = value;
    updateQuestion(qIndex, {
      settings: { ...currentSettings, [rowOrCol]: list },
    });
  };

  const handleAddMatrixItem = (qIndex, rowOrCol) => {
    const q = questions[qIndex];
    const currentSettings = q.settings || {
      rows: ['Row 1', 'Row 2'],
      columns: ['Column 1', 'Column 2', 'Column 3'],
    };
    const list = [...(currentSettings[rowOrCol] || [])];
    const label = rowOrCol === 'rows' ? `Row ${list.length + 1}` : `Column ${list.length + 1}`;
    list.push(label);
    updateQuestion(qIndex, {
      settings: { ...currentSettings, [rowOrCol]: list },
    });
  };

  const handleRemoveMatrixItem = (qIndex, rowOrCol, index) => {
    const q = questions[qIndex];
    const currentSettings = q.settings || {
      rows: ['Row 1', 'Row 2'],
      columns: ['Column 1', 'Column 2', 'Column 3'],
    };
    const list = [...(currentSettings[rowOrCol] || [])];
    if (list.length <= 1) {
      showToast(`Matrix must have at least one ${rowOrCol.slice(0, -1)}.`, 'info');
      return;
    }
    list.splice(index, 1);
    updateQuestion(qIndex, {
      settings: { ...currentSettings, [rowOrCol]: list },
    });
  };

  // Single-Step Unified Save
  const handleSaveSurvey = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!title.trim()) {
      showToast('Survey Title is required before saving.', 'error');
      return;
    }

    // Validate that questions have non-empty text
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        showToast(`Question #${i + 1} is missing question text.`, 'error');
        setActiveQuestionIndex(i);
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        welcomeMessage: welcomeMessage.trim(),
        endMessage: endMessage.trim(),
        active,
        zeroKnowledgeEnabled,
        zero_knowledge_enabled: zeroKnowledgeEnabled,
        settings: {
          supportedLanguages,
          defaultLanguage,
          translations: surveyTranslations,
        },
        questions: questions.map((q, idx) => ({
          id: q.id && !String(q.id).startsWith('temp-') ? q.id : undefined,
          code: q.code ? q.code.trim() : `Q${idx + 1}`,
          text: q.text.trim(),
          type: q.type,
          mandatory: Boolean(q.mandatory),
          helpText: q.helpText ? q.helpText.trim() : '',
          sortOrder: idx + 1,
          options: ['single_choice', 'multiple_choice', 'ranking'].includes(q.type)
            ? (q.options || []).map((opt, oIdx) => ({
                code: opt.code || `AO${oIdx + 1}`,
                text: opt.text.trim(),
                sortOrder: oIdx + 1,
              }))
            : [],
          settings: q.settings || null,
        })),
      };

      if (isNew) {
        const res = await apiClient.post('/surveys', payload);
        showToast('Survey and questions created successfully!', 'success');
        navigate(`/admin/surveys/${res.data.survey.id}/edit`);
      } else {
        await apiClient.put(`/surveys/${id}`, payload);
        showToast('Survey and questions successfully updated!', 'success');
        fetchSurvey();
      }
    } catch (err) {
      showToast(err.message || 'Failed to save survey', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Voter management handlers
  const handleAddVoter = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/surveys/${id}/voters`, {
        email: newVoterEmail.trim() || undefined,
        token: newVoterToken.trim() || undefined,
        isUniversal: isUniversalCode,
      });
      showToast(
        isUniversalCode
          ? 'Universal access code created for all participants!'
          : 'Voter access code created!',
        'success'
      );
      setNewVoterEmail('');
      setNewVoterToken('');
      setIsUniversalCode(false);
      fetchVoters();
    } catch (err) {
      showToast(err.message || 'Failed to add access code', 'error');
    }
  };

  const handleGenerateUniversalCode = async () => {
    try {
      await apiClient.post(`/surveys/${id}/voters/universal`, {
        token: newVoterToken.trim() || undefined,
      });
      showToast('Universal access code generated for all participants!', 'success');
      setNewVoterToken('');
      setIsUniversalCode(false);
      fetchVoters();
    } catch (err) {
      showToast(err.message || 'Failed to generate universal access code', 'error');
    }
  };

  const handleOpenBatchModal = () => {
    setBatchMemberCount(10);
    setIsBatchModalOpen(true);
  };

  const handleCloseBatchModal = () => {
    if (!isGeneratingBatch) {
      setIsBatchModalOpen(false);
    }
  };

  const handleConfirmBatchGenerate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const count = parseInt(batchMemberCount, 10);
    if (isNaN(count) || count < 1) {
      showToast('Please enter a valid number of members (at least 1).', 'error');
      return;
    }
    if (count > 500) {
      showToast('Please specify 500 or fewer members per batch.', 'error');
      return;
    }

    setIsGeneratingBatch(true);
    try {
      await apiClient.post(`/surveys/${id}/voters/batch`, { count });
      showToast(
        `Generated ${count} single-use access code${count === 1 ? '' : 's'} for members!`,
        'success'
      );
      setIsBatchModalOpen(false);
      fetchVoters();
    } catch (err) {
      showToast(err.message || 'Failed to generate batch codes', 'error');
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const handleDeleteVoter = async (voterId) => {
    try {
      setVoters((prev) => prev.filter((v) => v.id !== voterId && v.voterId !== voterId));
      await apiClient.delete(`/voters/${voterId}`);
      showToast('Access code removed successfully', 'info');
      fetchVoters();
    } catch (err) {
      showToast(err.message || 'Failed to delete access code', 'error');
      fetchVoters();
    }
  };

  const handleCopyText = (text, label) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`Copied ${label} to clipboard!`, 'success');
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 16px' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div className="ls-card" style={{ padding: '32px' }}>
            <div className="ls-skeleton" style={{ width: '40%', marginBottom: '20px' }} />
            <div className="ls-skeleton" style={{ width: '90%', marginBottom: '14px' }} />
            <div className="ls-skeleton" style={{ width: '70%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '32px 16px 90px 16px',
      }}
    >
      <div style={{ maxWidth: '820px', margin: '0 auto', position: 'relative' }}>
        {/* Sticky Action Bar */}
        <div
          style={{
            position: 'sticky',
            top: '0px',
            zIndex: 40,
            backgroundColor: 'rgba(248, 250, 252, 0.95)',
            backdropFilter: 'blur(8px)',
            padding: '12px 0 16px 0',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              to="/admin/surveys"
              className="ls-btn ls-btn-outline ls-btn-sm"
              style={{ color: '#475569', borderColor: '#cbd5e1' }}
              title="Return to Surveys Management"
            >
              <i className="ri-arrow-left-line" /> Surveys
            </Link>
            <h1
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isNew ? 'Create New Survey' : 'Edit Survey'}
            </h1>
            <span
              className="ls-badge"
              style={{
                backgroundColor: '#e2e8f0',
                color: '#334155',
                fontWeight: 600,
                fontSize: '12px',
                padding: '3px 8px',
              }}
            >
              {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isNew && (
              <div
                style={{
                  display: 'inline-flex',
                  backgroundColor: '#e2e8f0',
                  padding: '2px',
                  borderRadius: '6px',
                  marginRight: '6px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('builder')}
                  style={{
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '5px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'builder' ? '#ffffff' : 'transparent',
                    color: activeTab === 'builder' ? '#0f172a' : '#64748b',
                    boxShadow: activeTab === 'builder' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <i className="ri-survey-line" /> Form Builder
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('voters')}
                  style={{
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '5px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'voters' ? '#ffffff' : 'transparent',
                    color: activeTab === 'voters' ? '#0f172a' : '#64748b',
                    boxShadow: activeTab === 'voters' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <i className="ri-group-line" /> Access Codes ({voters.length})
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="ls-btn ls-btn-outline ls-btn-sm"
              title="Preview Questionnaire"
              style={{ color: '#334155', borderColor: '#cbd5e1' }}
            >
              <i className="ri-eye-line" /> Preview
            </button>

            <Link
              to="/admin/surveys"
              className="ls-btn ls-btn-outline ls-btn-sm"
              style={{ color: '#64748b', borderColor: '#cbd5e1' }}
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={handleSaveSurvey}
              disabled={isSaving}
              className="ls-btn ls-btn-primary ls-btn-sm"
              style={{
                backgroundColor: '#10b981',
                borderColor: '#10b981',
                color: '#ffffff',
                fontWeight: 600,
                minWidth: '150px',
              }}
            >
              {isSaving ? (
                <>
                  <i className="ri-loader-4-line ri-spin" /> Saving...
                </>
              ) : (
                <>
                  <i className="ri-check-line" /> {active ? 'Save & Deploy Survey' : 'Save Survey'}
                </>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'builder' ? (
          <>
            {/* Multilingual Translation Bar */}
            <div
              className="ls-card"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 18px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="ri-translate-2" style={{ color: '#10b981', fontSize: '17px' }} />
                  Survey Language:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {supportedLanguages.map((lCode) => {
                    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === lCode) || {
                      code: lCode,
                      name: lCode.toUpperCase(),
                    };
                    const isSelected = editingLanguage === lCode;
                    return (
                      <button
                        key={lCode}
                        type="button"
                        onClick={() => handleSelectLanguage(lCode)}
                        className={`ls-btn ls-btn-sm ${isSelected ? 'ls-btn-primary' : 'ls-btn-outline'}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          padding: '4px 10px',
                          fontWeight: isSelected ? 700 : 500,
                          borderRadius: '6px',
                        }}
                      >
                        <i className="ri-global-line" style={{ fontSize: '13px', opacity: 0.8 }} />
                        <span>{langObj.name}</span>
                        {lCode === defaultLanguage && (
                          <span style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase' }}>(Default)</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsLanguageModalOpen(true)}
                  className="ls-btn ls-btn-outline ls-btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0f172a',
                    borderColor: '#cbd5e1',
                  }}
                >
                  <i className="ri-settings-3-line" /> Manage Languages ({supportedLanguages.length})
                </button>
              </div>
            </div>

            {/* Translation Mode Banner */}
            {editingLanguage !== defaultLanguage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  padding: '10px 16px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: '#1e40af',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ri-translate-2" style={{ fontSize: '16px' }} />
                  <span>
                    Editing <strong>{SUPPORTED_LANGUAGES.find((l) => l.code === editingLanguage)?.name} ({SUPPORTED_LANGUAGES.find((l) => l.code === editingLanguage)?.nativeName})</strong>. Questions are automatically translated from {SUPPORTED_LANGUAGES.find((l) => l.code === defaultLanguage)?.name}.
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isTranslating ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#1e40af', fontWeight: 600 }}>
                      <i className="ri-loader-4-line ri-spin" /> Translating...
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleForceTranslateAll(editingLanguage)}
                        className="ls-btn ls-btn-outline ls-btn-sm"
                        style={{ fontSize: '12px', padding: '3px 8px', borderColor: '#93c5fd', color: '#1e40af' }}
                        title="Auto-translate all questions and options from base language"
                      >
                        <i className="ri-sparkling-fill" style={{ marginRight: '4px', color: '#3b82f6' }} /> Re-translate All
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyAllFromEnglish}
                        className="ls-btn ls-btn-outline ls-btn-sm"
                        style={{ fontSize: '12px', padding: '3px 8px', borderColor: '#93c5fd', color: '#1e40af' }}
                      >
                        <i className="ri-file-copy-line" style={{ marginRight: '4px' }} /> Copy Base
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Google Forms Header Card */}
            <div
              className="ls-card"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderTop: '5px solid #10b981',
                borderRadius: '8px',
                padding: '28px 32px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                marginBottom: '20px',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                type="text"
                placeholder={
                  editingLanguage === defaultLanguage
                    ? 'Survey Title (e.g. Employee Engagement Q3 2026)'
                    : (title ? `Translate: ${title}` : 'Translated Survey Title')
                }
                value={getSurveyTitleForEdit()}
                onChange={(e) => setSurveyTitleForEdit(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#0f172a',
                  border: 'none',
                  borderBottom: '2px solid #e2e8f0',
                  padding: '6px 0',
                  outline: 'none',
                  background: 'transparent',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => (e.target.style.borderBottomColor = '#10b981')}
                onBlur={(e) => (e.target.style.borderBottomColor = '#e2e8f0')}
              />

              <textarea
                placeholder={
                  editingLanguage === defaultLanguage
                    ? 'Survey description or instructions for participants...'
                    : (description ? `Translate: ${description}` : 'Translated survey description...')
                }
                rows={2}
                value={getSurveyDescForEdit()}
                onChange={(e) => setSurveyDescForEdit(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '14px',
                  color: '#475569',
                  border: 'none',
                  borderBottom: '1px solid #e2e8f0',
                  padding: '10px 0',
                  outline: 'none',
                  marginTop: '12px',
                  resize: 'vertical',
                  background: 'transparent',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => (e.target.style.borderBottomColor = '#10b981')}
                onBlur={(e) => (e.target.style.borderBottomColor = '#e2e8f0')}
              />

              {/* Collapsible Accordion Toggle for Welcome & Completion Messages */}
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setShowWelcomeCompletion(!showWelcomeCompletion)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#10b981',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 0',
                  }}
                >
                  <i className={showWelcomeCompletion ? 'ri-subtract-line' : 'ri-add-line'} />
                  {showWelcomeCompletion
                    ? 'Hide Welcome & Completion Messages'
                    : '+ Configure Welcome & Completion Messages'}
                </button>

                {showWelcomeCompletion && (
                  <div
                    style={{
                      marginTop: '16px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '16px',
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#334155',
                          display: 'block',
                          marginBottom: '6px',
                        }}
                      >
                        Welcome Message
                      </label>
                      <textarea
                        rows={2}
                        className="ls-textarea"
                        placeholder={
                          editingLanguage === defaultLanguage
                            ? 'Displayed before participants start answering...'
                            : (welcomeMessage ? `Translate: ${welcomeMessage}` : 'Translated welcome message...')
                        }
                        value={getSurveyWelcomeForEdit()}
                        onChange={(e) => setSurveyWelcomeForEdit(e.target.value)}
                        style={{ fontSize: '13px', backgroundColor: '#ffffff' }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#334155',
                          display: 'block',
                          marginBottom: '6px',
                        }}
                      >
                        End / Completion Message
                      </label>
                      <textarea
                        rows={2}
                        className="ls-textarea"
                        placeholder={
                          editingLanguage === defaultLanguage
                            ? 'Thank you message upon questionnaire submission...'
                            : (endMessage ? `Translate: ${endMessage}` : 'Translated end message...')
                        }
                        value={getSurveyEndForEdit()}
                        onChange={(e) => setSurveyEndForEdit(e.target.value)}
                        style={{ fontSize: '13px', backgroundColor: '#ffffff' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Questions Canvas & Floating Toolbar */}
            <div ref={questionsContainerRef} style={{ position: 'relative' }}>
              {/* Floating Quick Action Toolbar (Tracks Active Card) */}
              <div
                style={{
                  position: 'absolute',
                  left: 'calc(100% + 14px)',
                  top: '0px',
                  transform: `translateY(${toolbarOffsetTop}px)`,
                  transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '9999px',
                  padding: '6px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
                  zIndex: 25,
                }}
              >
                <button
                  type="button"
                  onClick={() => handleAddQuestion(activeQuestionIndex)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '18px',
                    transition: 'all 0.15s ease',
                  }}
                  title="Add Question Below Selected"
                >
                  <i className="ri-add-line" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const q = questions[activeQuestionIndex];
                    if (q) {
                      const newHelp = q.helpText ? '' : 'Add guidance or note for this question...';
                      updateQuestion(activeQuestionIndex, { helpText: newHelp });
                      showToast(q.helpText ? 'Section note removed' : 'Section note added', 'info');
                    }
                  }}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 700,
                  }}
                  title="Toggle Section Note / Description"
                >
                  Tt
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                  }}
                  title="Preview Survey Modal"
                >
                  <i className="ri-eye-line" />
                </button>
              </div>

              {/* Questions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {questions.map((q, idx) => {
                  const isActive = activeQuestionIndex === idx;

                  return (
                    <div
                      key={q.id || idx}
                      ref={(el) => (questionCardRefs.current[idx] = el)}
                      onClick={() => setActiveQuestionIndex(idx)}
                      onFocusCapture={() => setActiveQuestionIndex(idx)}
                      className="ls-card"
                      style={{
                        position: 'relative',
                        backgroundColor: '#ffffff',
                        border: '1px solid',
                        borderColor: isActive ? '#cbd5e1' : '#e2e8f0',
                        borderLeft: isActive ? '5px solid #10b981' : '5px solid transparent',
                        borderRadius: '8px',
                        padding: '24px',
                        boxShadow: isActive
                          ? '0 6px 16px rgba(16, 185, 129, 0.12)'
                          : '0 1px 3px rgba(0, 0, 0, 0.04)',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, border-left-color 0.2s ease',
                        cursor: 'pointer',
                      }}
                    >
                      {/* Question Top Row: Text (70%) & Type Selector (30%) */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '16px',
                          marginBottom: '16px',
                        }}
                      >
                        <div style={{ flex: '1 1 70%', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#10b981',
                              paddingTop: '10px',
                              flexShrink: 0,
                            }}
                          >
                            {idx + 1}.
                          </span>

                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                            <input
                              type="text"
                              placeholder={
                                editingLanguage === defaultLanguage
                                  ? 'Question text (e.g. How satisfied are you with team communication?)'
                                  : (q.text ? `Translate: ${q.text}` : 'Question translation...')
                              }
                              value={getQuestionTextForEdit(q)}
                              onChange={(e) => setQuestionTextForEdit(idx, e.target.value)}
                              style={{
                                width: '100%',
                                fontSize: '16px',
                                fontWeight: 600,
                                color: '#0f172a',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '10px 12px',
                                outline: 'none',
                                fontFamily: 'inherit',
                                transition: 'border-color 0.15s ease',
                              }}
                              onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                              onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                            />

                            {/* Base question preview & auto-translate button when in translation mode */}
                            {editingLanguage !== defaultLanguage && q.text && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '10px',
                                  fontSize: '12px',
                                  backgroundColor: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  color: '#475569',
                                }}
                              >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <strong style={{ color: '#0f172a' }}>Original ({SUPPORTED_LANGUAGES.find((l) => l.code === defaultLanguage)?.name}):</strong> {q.text}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleTranslateSingleQuestion(idx, editingLanguage)}
                                  disabled={translatingQIdx === idx || isTranslating}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    color: '#059669',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    flexShrink: 0,
                                    padding: '2px 4px',
                                  }}
                                  title={`Auto-translate into ${SUPPORTED_LANGUAGES.find((l) => l.code === editingLanguage)?.name}`}
                                >
                                  {translatingQIdx === idx ? (
                                    <>
                                      <i className="ri-loader-4-line ri-spin" /> Translating...
                                    </>
                                  ) : (
                                    <>
                                      <i className="ri-sparkling-fill" style={{ color: '#10b981' }} /> Auto-Translate
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            {q.helpText !== undefined && (
                              <input
                                type="text"
                                placeholder={
                                  editingLanguage === defaultLanguage
                                    ? 'Optional description / helper instructions...'
                                    : (q.helpText ? `Translate: ${q.helpText}` : 'Help text translation...')
                                }
                                value={getQuestionHelpForEdit(q)}
                                onChange={(e) => setQuestionHelpForEdit(idx, e.target.value)}
                                style={{
                                  width: '100%',
                                  fontSize: '13px',
                                  color: '#64748b',
                                  border: '1px dashed #cbd5e1',
                                  borderRadius: '4px',
                                  padding: '6px 10px',
                                  outline: 'none',
                                  background: '#f8fafc',
                                  boxSizing: 'border-box',
                                }}
                              />
                            )}

                            {zeroKnowledgeEnabled && q.type === 'long_text' && (
                              <div
                                style={{
                                  marginTop: '2px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  backgroundColor: '#ecfdf5',
                                  color: '#047857',
                                  border: '1px solid #a7f3d0',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  alignSelf: 'flex-start',
                                }}
                              >
                                <i className="ri-shield-keyhole-line" />
                                ZK Ghost Comment: voter profile decoupled on submission
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Question Type Selector */}
                        <div style={{ flex: '0 0 28%', minWidth: '180px' }}>
                          <div style={{ position: 'relative', width: '100%' }}>
                            <select
                              className="ls-select"
                              value={q.type}
                              onChange={(e) => {
                                const newType = e.target.value;
                                const isMulti = newType === 'multiple_choice';
                                let options = q.options;
                                if (newType === 'ranking' && (!options || options.length < 2)) {
                                  options = [
                                    { code: 'AO1', text: 'Option 1' },
                                    { code: 'AO2', text: 'Option 2' },
                                    { code: 'AO3', text: 'Option 3' },
                                  ];
                                }
                                let newSettings = q.settings;
                                if (newType === 'file_upload') {
                                  newSettings = {
                                    ...(q.settings || {}),
                                    allowedTypes: q.settings?.allowedTypes || 'all',
                                    maxFileSize: q.settings?.maxFileSize || 10,
                                    maxFiles: q.settings?.maxFiles || 3,
                                  };
                                } else if (['single_choice', 'multiple_choice'].includes(newType)) {
                                  newSettings = { ...(q.settings || {}), allowMultiple: isMulti };
                                }
                                updateQuestion(idx, {
                                  type: newType,
                                  options,
                                  settings: newSettings,
                                });
                              }}
                              style={{
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                MozAppearance: 'none',
                                width: '100%',
                                padding: '10px 36px 10px 12px',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#1e293b',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                backgroundColor: '#ffffff',
                                cursor: 'pointer',
                                outline: 'none',
                                transition: 'border-color 0.15s ease',
                              }}
                              onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                              onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                            >
                              <option value="short_text">Short Answer</option>
                              <option value="long_text">Paragraph / Comment</option>
                              <option value="single_choice">Multiple Choice (Radio)</option>
                              <option value="multiple_choice">Checkboxes (Multi-select)</option>
                              <option value="ranking">Ranking / Preference (1st to Nth)</option>
                              <option value="rating">Linear Scale / Rating (1-5)</option>
                              <option value="matrix">Matrix / Grid</option>
                              <option value="file_upload">File Upload / Media Attachments</option>
                            </select>
                            <i
                              className="ri-arrow-down-s-line"
                              style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none',
                                color: '#64748b',
                                fontSize: '18px',
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Interactive Options Preview & Builder */}
                      <div style={{ padding: '8px 0 16px 24px' }}>
                        {/* 1. Short Text Preview */}
                        {q.type === 'short_text' && (
                          <div
                            style={{
                              width: '60%',
                              padding: '8px 0',
                              borderBottom: '1px dashed #94a3b8',
                              color: '#94a3b8',
                              fontSize: '14px',
                            }}
                          >
                            Short answer text preview
                          </div>
                        )}

                        {/* 2. Long Text / Comment Preview */}
                        {q.type === 'long_text' && (
                          <div
                            style={{
                              width: '85%',
                              height: '60px',
                              border: '1px dashed #cbd5e1',
                              borderRadius: '4px',
                              padding: '10px',
                              color: '#94a3b8',
                              fontSize: '13px',
                              backgroundColor: '#f8fafc',
                            }}
                          >
                            Long feedback / commentary text preview...
                          </div>
                        )}

                        {/* 3 & 4. Multiple Choice & Checkboxes Options Builder */}
                        {['single_choice', 'multiple_choice'].includes(q.type) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Selection Mode Control (Single vs Multiple) */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '10px',
                                padding: '8px 12px',
                                backgroundColor: '#f8fafc',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                width: 'fit-content',
                                marginBottom: '2px',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: '#475569',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}
                              >
                                <i className="ri-list-check-2" style={{ color: '#10b981', fontSize: '15px' }} />
                                Selection Mode:
                              </span>
                              <div
                                style={{
                                  display: 'inline-flex',
                                  gap: '2px',
                                  backgroundColor: '#e2e8f0',
                                  padding: '2px',
                                  borderRadius: '6px',
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQuestion(idx, {
                                      type: 'single_choice',
                                      settings: { ...(q.settings || {}), allowMultiple: false },
                                    })
                                  }
                                  style={{
                                    padding: '5px 12px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    borderRadius: '4px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor:
                                      !(q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple))
                                        ? '#ffffff'
                                        : 'transparent',
                                    color:
                                      !(q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple))
                                        ? '#0f172a'
                                        : '#64748b',
                                    boxShadow:
                                      !(q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple))
                                        ? '0 1px 3px rgba(0,0,0,0.08)'
                                        : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <i
                                    className="ri-radio-button-line"
                                    style={{
                                      color:
                                        !(q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple))
                                          ? '#10b981'
                                          : '#94a3b8',
                                    }}
                                  />
                                  Single selection (Radio)
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQuestion(idx, {
                                      type: 'multiple_choice',
                                      settings: { ...(q.settings || {}), allowMultiple: true },
                                    })
                                  }
                                  style={{
                                    padding: '5px 12px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    borderRadius: '4px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor:
                                      q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple)
                                        ? '#ffffff'
                                        : 'transparent',
                                    color:
                                      q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple)
                                        ? '#0f172a'
                                        : '#64748b',
                                    boxShadow:
                                      q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple)
                                        ? '0 1px 3px rgba(0,0,0,0.08)'
                                        : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <i
                                    className="ri-checkbox-line"
                                    style={{
                                      color:
                                        q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple)
                                          ? '#10b981'
                                          : '#94a3b8',
                                    }}
                                  />
                                  Multiple selections (Checkboxes)
                                </button>
                              </div>
                              <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>
                                {q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple)
                                  ? '• Voters can select multiple options'
                                  : '• Voters can select only one option'}
                              </span>
                            </div>

                            {(q.options || []).map((opt, oIdx) => {
                              const isMulti = q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple);
                              return (
                                <div
                                  key={oIdx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                  }}
                                >
                                  {isMulti ? (
                                    <i
                                      className="ri-checkbox-blank-line"
                                      style={{ color: '#94a3b8', fontSize: '18px' }}
                                    />
                                  ) : (
                                    <i
                                      className="ri-radio-button-line"
                                      style={{ color: '#94a3b8', fontSize: '18px' }}
                                    />
                                  )}
                                  <input
                                    type="text"
                                    value={getOptionTextForEdit(q, opt)}
                                    onChange={(e) => setOptionTextForEdit(idx, oIdx, e.target.value)}
                                    placeholder={
                                      editingLanguage === defaultLanguage
                                        ? `Option ${oIdx + 1}`
                                        : (opt.text ? `Translate: ${opt.text}` : `Option ${oIdx + 1} translation`)
                                    }
                                    style={{
                                      flex: 1,
                                      maxWidth: '460px',
                                      padding: '6px 10px',
                                      fontSize: '14px',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: '4px',
                                      outline: 'none',
                                      fontFamily: 'inherit',
                                    }}
                                    onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                                    onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                                  />
                                  {(q.options || []).length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOption(idx, oIdx)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                        fontSize: '18px',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                      }}
                                      title="Remove Option"
                                    >
                                      <i className="ri-close-line" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}

                            <div style={{ marginTop: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleAddOption(idx)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#10b981',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <i className="ri-add-line" /> Add Option
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 4.5 Ranking / Preference Options Builder */}
                        {q.type === 'ranking' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                backgroundColor: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: '#166534',
                                width: 'fit-content',
                                marginBottom: '4px',
                              }}
                            >
                              <i className="ri-arrow-up-down-line" style={{ fontSize: '15px', color: '#10b981' }} />
                              <span>
                                <strong>Ranked-Choice Voting:</strong> Voters will rank these items (1st to {Math.max(1, (q.options || []).length)}) via drag &amp; drop or number selectors.
                              </span>
                            </div>

                            {(q.options || []).map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                }}
                              >
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '32px',
                                    height: '28px',
                                    borderRadius: '5px',
                                    backgroundColor: oIdx === 0 ? '#10b981' : '#f1f5f9',
                                    color: oIdx === 0 ? '#ffffff' : '#475569',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    flexShrink: 0,
                                    border: oIdx === 0 ? '1px solid #059669' : '1px solid #cbd5e1',
                                  }}
                                  title={`Default position #${oIdx + 1}`}
                                >
                                  #{oIdx + 1}
                                </span>
                                <i
                                  className="ri-draggable"
                                  style={{ color: '#94a3b8', fontSize: '18px', cursor: 'grab' }}
                                  title="Drag handle"
                                />
                                <input
                                  type="text"
                                  value={getOptionTextForEdit(q, opt)}
                                  onChange={(e) => setOptionTextForEdit(idx, oIdx, e.target.value)}
                                  placeholder={
                                    editingLanguage === defaultLanguage
                                      ? `Item ${oIdx + 1} to rank...`
                                      : (opt.text ? `Translate: ${opt.text}` : `Item ${oIdx + 1} translation`)
                                  }
                                  style={{
                                    flex: 1,
                                    maxWidth: '460px',
                                    padding: '6px 10px',
                                    fontSize: '14px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '4px',
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                  }}
                                  onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                                  onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                                />
                                <div style={{ display: 'inline-flex', gap: '2px' }}>
                                  <button
                                    type="button"
                                    disabled={oIdx === 0}
                                    onClick={() => handleMoveOption(idx, oIdx, -1)}
                                    style={{
                                      width: '26px',
                                      height: '26px',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: '4px',
                                      backgroundColor: oIdx === 0 ? '#f8fafc' : '#ffffff',
                                      color: oIdx === 0 ? '#cbd5e1' : '#64748b',
                                      cursor: oIdx === 0 ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '14px',
                                    }}
                                    title="Move Item Up"
                                  >
                                    <i className="ri-arrow-up-s-line" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={oIdx === (q.options || []).length - 1}
                                    onClick={() => handleMoveOption(idx, oIdx, 1)}
                                    style={{
                                      width: '26px',
                                      height: '26px',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: '4px',
                                      backgroundColor: oIdx === (q.options || []).length - 1 ? '#f8fafc' : '#ffffff',
                                      color: oIdx === (q.options || []).length - 1 ? '#cbd5e1' : '#64748b',
                                      cursor: oIdx === (q.options || []).length - 1 ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '14px',
                                    }}
                                    title="Move Item Down"
                                  >
                                    <i className="ri-arrow-down-s-line" />
                                  </button>
                                </div>
                                {(q.options || []).length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(idx, oIdx)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#94a3b8',
                                      cursor: 'pointer',
                                      fontSize: '18px',
                                      padding: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                    }}
                                    title="Remove Item"
                                  >
                                    <i className="ri-close-line" />
                                  </button>
                                )}
                              </div>
                            ))}

                            <div style={{ marginTop: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleAddOption(idx)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#10b981',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <i className="ri-add-line" /> Add Item to Rank
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 5. Rating (1-5) Scale Preview */}
                        {q.type === 'rating' && (
                          <div>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                              {[1, 2, 3, 4, 5].map((num) => (
                                <div
                                  key={num}
                                  style={{
                                    width: '46px',
                                    height: '38px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    backgroundColor: '#f8fafc',
                                    color: '#334155',
                                  }}
                                >
                                  {num}
                                </div>
                              ))}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                width: '270px',
                                fontSize: '12px',
                                color: '#64748b',
                              }}
                            >
                              <span>1 = Poor</span>
                              <span>5 = Excellent</span>
                            </div>
                          </div>
                        )}

                        {/* 6. Matrix / Grid Builder */}
                        {q.type === 'matrix' && (
                          <div
                            style={{
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              padding: '14px',
                              maxWidth: '620px',
                            }}
                          >
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              {/* Rows */}
                              <div>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '8px' }}>
                                  Rows (Statements)
                                </span>
                                {(q.settings?.rows || ['Row 1', 'Row 2']).map((row, rIdx) => (
                                  <div key={rIdx} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                                    <input
                                      type="text"
                                      value={getMatrixItemForEdit(q, 'rows', rIdx, row)}
                                      onChange={(e) => setMatrixItemForEdit(idx, 'rows', rIdx, e.target.value)}
                                      placeholder={editingLanguage === defaultLanguage ? 'Statement label' : `Translate: ${row}`}
                                      style={{ flex: 1, padding: '4px 8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMatrixItem(idx, 'rows', rIdx)}
                                      style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
                                    >
                                      &times;
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => handleAddMatrixItem(idx, 'rows')}
                                  style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                  + Add Row
                                </button>
                              </div>

                              {/* Columns */}
                              <div>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '8px' }}>
                                  Columns (Scale Labels)
                                </span>
                                {(q.settings?.columns || ['Column 1', 'Column 2', 'Column 3']).map((col, cIdx) => (
                                  <div key={cIdx} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                                    <input
                                      type="text"
                                      value={getMatrixItemForEdit(q, 'columns', cIdx, col)}
                                      onChange={(e) => setMatrixItemForEdit(idx, 'columns', cIdx, e.target.value)}
                                      placeholder={editingLanguage === defaultLanguage ? 'Scale label' : `Translate: ${col}`}
                                      style={{ flex: 1, padding: '4px 8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMatrixItem(idx, 'columns', cIdx)}
                                      style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
                                    >
                                      &times;
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => handleAddMatrixItem(idx, 'columns')}
                                  style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                  + Add Column
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 7. File Upload / Media Attachments Builder */}
                        {q.type === 'file_upload' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Visual Preview Box */}
                            <div
                              style={{
                                border: '2px dashed #cbd5e1',
                                borderRadius: '8px',
                                padding: '20px 16px',
                                textAlign: 'center',
                                backgroundColor: '#f8fafc',
                                maxWidth: '640px',
                              }}
                            >
                              <div
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '50%',
                                  backgroundColor: '#ecfdf5',
                                  color: '#10b981',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '22px',
                                  margin: '0 auto 8px auto',
                                }}
                              >
                                <i className="ri-upload-cloud-2-line" />
                              </div>
                              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b' }}>
                                Drag &amp; drop media files here, or click to browse
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                {(q.settings?.allowedTypes || 'all') === 'images' && 'Images only (PNG, JPG, WebP, SVG, GIF)'}
                                {(q.settings?.allowedTypes || 'all') === 'documents' && 'Documents (PDF, DOCX, XLSX, TXT)'}
                                {(q.settings?.allowedTypes || 'all') === 'media' && 'Media (MP3, WAV, MP4, WebM)'}
                                {(q.settings?.allowedTypes || 'all') === 'all' && 'All formats accepted (Images, PDFs, Documents, Media)'}
                                {` • Max ${q.settings?.maxFileSize || 10} MB • Up to ${q.settings?.maxFiles || 3} file${(q.settings?.maxFiles || 3) > 1 ? 's' : ''}`}
                              </div>
                            </div>

                            {/* Configuration Toolbar */}
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                padding: '12px 14px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                maxWidth: '640px',
                              }}
                            >
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <i className="ri-settings-4-line" style={{ color: '#10b981', marginRight: '5px' }} />
                                File Upload Configuration
                              </div>

                              {/* Allowed Types */}
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                  Allowed File Types:
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {[
                                    { id: 'all', label: 'All Formats', icon: 'ri-file-line' },
                                    { id: 'images', label: 'Images Only', icon: 'ri-image-line' },
                                    { id: 'documents', label: 'Documents & PDFs', icon: 'ri-file-text-line' },
                                    { id: 'media', label: 'Audio & Video', icon: 'ri-film-line' },
                                  ].map((cat) => {
                                    const isSelected = (q.settings?.allowedTypes || 'all') === cat.id;
                                    return (
                                      <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() =>
                                          updateQuestion(idx, {
                                            settings: { ...(q.settings || {}), allowedTypes: cat.id },
                                          })
                                        }
                                        style={{
                                          padding: '5px 10px',
                                          fontSize: '12px',
                                          fontWeight: 600,
                                          borderRadius: '6px',
                                          border: isSelected ? '1px solid #10b981' : '1px solid #cbd5e1',
                                          backgroundColor: isSelected ? '#ecfdf5' : '#f8fafc',
                                          color: isSelected ? '#065f46' : '#475569',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          transition: 'all 0.15s ease',
                                        }}
                                      >
                                        <i className={cat.icon} />
                                        {cat.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Limits: Max Size & Max Files */}
                              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
                                <div style={{ flex: '1 1 180px' }}>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                    Max Size per File:
                                  </label>
                                  <select
                                    className="ls-select"
                                    value={q.settings?.maxFileSize || 10}
                                    onChange={(e) =>
                                      updateQuestion(idx, {
                                        settings: { ...(q.settings || {}), maxFileSize: parseInt(e.target.value, 10) },
                                      })
                                    }
                                    style={{ padding: '6px 10px', fontSize: '13px' }}
                                  >
                                    <option value="5">5 MB</option>
                                    <option value="10">10 MB (Recommended)</option>
                                    <option value="25">25 MB</option>
                                    <option value="50">50 MB</option>
                                  </select>
                                </div>

                                <div style={{ flex: '1 1 180px' }}>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                    Max Number of Files:
                                  </label>
                                  <select
                                    className="ls-select"
                                    value={q.settings?.maxFiles || 3}
                                    onChange={(e) =>
                                      updateQuestion(idx, {
                                        settings: { ...(q.settings || {}), maxFiles: parseInt(e.target.value, 10) },
                                      })
                                    }
                                    style={{ padding: '6px 10px', fontSize: '13px' }}
                                  >
                                    <option value="1">1 File (Single attachment)</option>
                                    <option value="3">Up to 3 Files</option>
                                    <option value="5">Up to 5 Files</option>
                                    <option value="10">Up to 10 Files</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Question Card Footer Toolbar */}
                      <div
                        style={{
                          borderTop: '1px solid #f1f5f9',
                          paddingTop: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '12px',
                        }}
                      >
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveQuestion(idx, -1);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: idx === 0 ? '#cbd5e1' : '#64748b',
                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '18px',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Move Question Up"
                        >
                          <i className="ri-arrow-up-s-line" />
                        </button>

                        <button
                          type="button"
                          disabled={idx === questions.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveQuestion(idx, 1);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: idx === questions.length - 1 ? '#cbd5e1' : '#64748b',
                            cursor: idx === questions.length - 1 ? 'not-allowed' : 'pointer',
                            fontSize: '18px',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Move Question Down"
                        >
                          <i className="ri-arrow-down-s-line" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateQuestion(idx);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            fontSize: '18px',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Duplicate Question"
                        >
                          <i className="ri-file-copy-line" />
                        </button>

                        <button
                          type="button"
                          disabled={questions.length <= 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuestion(idx);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: questions.length <= 1 ? '#cbd5e1' : '#ef4444',
                            cursor: questions.length <= 1 ? 'not-allowed' : 'pointer',
                            fontSize: '18px',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Delete Question"
                        >
                          <i className="ri-delete-bin-line" />
                        </button>

                        <span style={{ height: '20px', width: '1px', backgroundColor: '#cbd5e1' }} />

                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#475569',
                            userSelect: 'none',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>Required</span>
                          <input
                            type="checkbox"
                            checked={Boolean(q.mandatory)}
                            onChange={(e) => updateQuestion(idx, { mandatory: e.target.checked })}
                            style={{
                              width: '16px',
                              height: '16px',
                              accentColor: '#10b981',
                              cursor: 'pointer',
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Big Bottom Add Question Button */}
              <button
                type="button"
                onClick={() => handleAddQuestion()}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '2px dashed #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#10b981',
                  fontWeight: 600,
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '16px',
                  marginBottom: '24px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.backgroundColor = '#ecfdf5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <i className="ri-add-line" style={{ fontSize: '18px' }} /> Add Question
              </button>
            </div>

            {/* Unified Deployment & Privacy Settings Card (Bottom of Canvas) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
              {/* Card 1: Activate & Publish Survey */}
              <div
                className="ls-card"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '18px 24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <input
                  id="survey-active-toggle"
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  style={{
                    width: '20px',
                    height: '20px',
                    accentColor: '#10b981',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    backgroundColor: active ? '#ecfdf5' : '#f1f5f9',
                    color: active ? '#10b981' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    flexShrink: 0,
                  }}
                >
                  <i className="ri-broadcast-line" />
                </div>
                <div>
                  <label
                    htmlFor="survey-active-toggle"
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#0f172a',
                      cursor: 'pointer',
                      display: 'block',
                    }}
                  >
                    Activate & Publish Survey
                  </label>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                    Allows participants to access and submit survey responses when checked.
                  </div>
                </div>
              </div>

              {/* Card 2: Enable Zero Knowledge Protocol */}
              <div
                className="ls-card"
                style={{
                  backgroundColor: zeroKnowledgeEnabled ? '#ecfdf5' : '#ffffff',
                  border: zeroKnowledgeEnabled ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '18px 24px',
                  boxShadow: zeroKnowledgeEnabled
                    ? '0 4px 12px rgba(16, 185, 129, 0.12)'
                    : '0 1px 3px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  id="zero-knowledge-toggle"
                  type="checkbox"
                  checked={zeroKnowledgeEnabled}
                  onChange={(e) => setZeroKnowledgeEnabled(e.target.checked)}
                  style={{
                    width: '20px',
                    height: '20px',
                    accentColor: '#10b981',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    backgroundColor: zeroKnowledgeEnabled ? '#10b981' : '#f1f5f9',
                    color: zeroKnowledgeEnabled ? '#ffffff' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    flexShrink: 0,
                  }}
                >
                  <i className="ri-shield-keyhole-line" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <label
                      htmlFor="zero-knowledge-toggle"
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: '#0f172a',
                        cursor: 'pointer',
                        margin: 0,
                      }}
                    >
                      Enable Zero Knowledge Protocol
                    </label>
                    <span
                      className="ls-badge"
                      style={{
                        backgroundColor: zeroKnowledgeEnabled ? '#10b981' : '#e2e8f0',
                        color: zeroKnowledgeEnabled ? '#ffffff' : '#475569',
                        fontSize: '10px',
                        letterSpacing: '0.5px',
                        padding: '2px 7px',
                        fontWeight: 700,
                      }}
                    >
                      ZK PROTOCOL
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                    Enforces strict secret-ballot privacy. Voter profiles and feedback comments will be decoupled and cannot be viewed together.
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* TAB 2: PARTICIPANTS & ACCESS CODES (FOR EXISTING SURVEYS) */
          <div className="ls-card" style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                  Participant Tokens & Access Codes
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', margin: 0 }}>
                  Manage single-use participant invites or open universal participation links.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleGenerateUniversalCode}
                  className="ls-btn ls-btn-outline ls-btn-sm"
                  title="Generate a universal token for open voting"
                >
                  <i className="ri-link" /> Universal Code
                </button>
                <button
                  type="button"
                  onClick={handleOpenBatchModal}
                  className="ls-btn ls-btn-outline ls-btn-sm"
                  title="Generate single-use access codes for members"
                >
                  <i className="ri-magic-line" /> Batch
                </button>
              </div>
            </div>

            {/* Manual Invite Creation Form */}
            <form onSubmit={handleAddVoter} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <input
                type="email"
                placeholder="Participant Email (optional)"
                className="ls-input"
                value={newVoterEmail}
                onChange={(e) => setNewVoterEmail(e.target.value)}
                style={{ flex: 1, minWidth: '200px' }}
              />
              <input
                type="text"
                placeholder="Custom Access Code (e.g. VOTE-2026)"
                className="ls-input"
                value={newVoterToken}
                onChange={(e) => setNewVoterToken(e.target.value)}
                style={{ flex: 1, minWidth: '180px' }}
              />
              <button type="submit" className="ls-btn ls-btn-primary ls-btn-sm">
                <i className="ri-user-add-line" /> Add Access Code
              </button>
            </form>

            {/* Voters List */}
            {voters.length === 0 ? (
              <div className="ls-empty-state" style={{ padding: '30px 0' }}>
                <i className="ri-group-line ls-empty-icon" style={{ fontSize: '36px' }} />
                <h3>No access codes created yet</h3>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>Use the buttons above to generate participant codes.</p>
              </div>
            ) : (
              <div className="ls-table-container">
                <table className="ls-table">
                  <thead>
                    <tr>
                      <th>Token / Access Code</th>
                      <th>Participant Email</th>
                      <th>Completed</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voters.map((v) => (
                      <tr key={v.id || v.token}>
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <code style={{ fontWeight: 600, color: '#0f172a' }}>{v.token}</code>
                            <button
                              type="button"
                              onClick={() => handleCopyText(v.token, 'Access Code')}
                              style={{ border: 'none', background: 'none', color: '#10b981', cursor: 'pointer', padding: '2px' }}
                              title="Copy Access Code"
                            >
                              <i className="ri-file-copy-line" />
                            </button>
                          </div>
                        </td>
                        <td>{v.email || <span style={{ color: '#94a3b8' }}>Universal Access Code</span>}</td>
                        <td>
                          <span className={`ls-badge ${v.completed ? 'ls-badge-success' : 'ls-badge-secondary'}`}>
                            {v.completed ? 'Completed' : 'Pending'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteVoter(v.id || v.voterId)}
                            className="ls-btn ls-btn-outline ls-btn-sm"
                            style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                            title="Remove Access Code"
                          >
                            <i className="ri-delete-bin-line" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full Preview Survey Modal */}
      {isPreviewOpen && (
        <div
          className="ls-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPreviewOpen(false);
          }}
        >
          <div
            className="ls-modal"
            style={{ maxWidth: '780px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="ls-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <div className="ls-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  <i className="ri-eye-line" style={{ color: '#10b981' }} /> Live Survey Preview
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                  Fill out and test your questionnaire below exactly as voters will experience it.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {supportedLanguages.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label htmlFor="preview-lang-select" style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                      <i className="ri-translate-2" style={{ marginRight: '3px', color: '#10b981' }} />
                      Language:
                    </label>
                    <select
                      id="preview-lang-select"
                      value={previewLang}
                      onChange={(e) => handlePreviewLangChange(e.target.value)}
                      className="ls-select"
                      style={{ padding: '4px 8px', fontSize: '12px', height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      {supportedLanguages.map((code) => {
                        const lObj = SUPPORTED_LANGUAGES.find((l) => l.code === code);
                        return (
                          <option key={code} value={code}>
                            {lObj?.name} ({lObj?.nativeName})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleResetPreviewAnswers}
                  className="ls-btn ls-btn-outline ls-btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                  title="Clear all preview inputs"
                >
                  <i className="ri-refresh-line" /> {getUiText('clear_answers', previewLang)}
                </button>
                <button
                  type="button"
                  className="ls-modal-close"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  &times;
                </button>
              </div>
            </div>

            {(() => {
              const previewSurvey = getLocalizedSurvey(
                {
                  title,
                  description,
                  welcomeMessage,
                  endMessage,
                  settings: { translations: surveyTranslations },
                },
                previewLang
              );

              return (
                <div style={{ padding: '20px' }}>
                  <div
                    className="ls-card"
                    style={{
                      borderTop: '6px solid #10b981',
                      marginBottom: '20px',
                      borderRadius: '8px',
                    }}
                  >
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                      {previewSurvey.title || 'Untitled Survey'}
                    </h1>
                    {previewSurvey.description && <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '14px' }}>{previewSurvey.description}</p>}
                    {previewSurvey.welcomeMessage && (
                      <div style={{ padding: '12px 14px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '13px', color: '#334155' }}>
                        {previewSurvey.welcomeMessage}
                      </div>
                    )}
                    {zeroKnowledgeEnabled && (
                      <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#047857' }}>
                        <i className="ri-shield-keyhole-line" /> Zero Knowledge Secret Ballot Active
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {questions.map((rawQ, idx) => {
                      const q = getLocalizedQuestion(rawQ, previewLang, { translations: surveyTranslations });
                      const qKey = q.code || `Q_${idx}`;
                      const currentAnswer = previewAnswers[qKey];

                  return (
                    <div key={idx} className="ls-card" style={{ borderRadius: '8px' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ fontWeight: 700, color: '#10b981', marginRight: '6px' }}>{idx + 1}.</span>
                        <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                          {q.text || `Question ${idx + 1}`}
                        </strong>
                        {q.mandatory && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                        {q.helpText && <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{q.helpText}</p>}
                      </div>

                      {/* 1. Short Text Input */}
                      {q.type === 'short_text' && (
                        <input
                          type="text"
                          className="ls-input"
                          placeholder="Type your answer here..."
                          value={currentAnswer || ''}
                          onChange={(e) => handlePreviewAnswerChange(qKey, e.target.value)}
                        />
                      )}

                      {/* 2. Long Text / Comment Input */}
                      {q.type === 'long_text' && (
                        <textarea
                          className="ls-textarea"
                          rows={3}
                          placeholder="Type your comment / feedback here..."
                          value={currentAnswer || ''}
                          onChange={(e) => handlePreviewAnswerChange(qKey, e.target.value)}
                        />
                      )}

                      {/* 3. Single Choice (Radio) */}
                      {['single_choice', 'multiple_choice'].includes(q.type) && !(q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple)) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(q.options || []).map((o, oIdx) => {
                            const isChecked = currentAnswer === o.code;
                            return (
                              <label
                                key={oIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '9px 12px',
                                  borderRadius: '6px',
                                  backgroundColor: isChecked ? '#ecfdf5' : '#f8fafc',
                                  border: isChecked ? '1px solid #10b981' : '1px solid #e2e8f0',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`preview_${idx}`}
                                  checked={isChecked}
                                  onChange={() => handlePreviewAnswerChange(qKey, o.code)}
                                  style={{ accentColor: '#10b981', width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <span style={{ color: isChecked ? '#065f46' : '#1e293b', fontWeight: isChecked ? 600 : 400 }}>
                                  {o.text}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* 4. Multiple Choice (Checkboxes) */}
                      {['single_choice', 'multiple_choice'].includes(q.type) && (q.type === 'multiple_choice' || Boolean(q.settings?.allowMultiple)) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(q.options || []).map((o, oIdx) => {
                            const selectedArray = Array.isArray(currentAnswer) ? currentAnswer : [];
                            const isChecked = selectedArray.includes(o.code);
                            return (
                              <label
                                key={oIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '9px 12px',
                                  borderRadius: '6px',
                                  backgroundColor: isChecked ? '#ecfdf5' : '#f8fafc',
                                  border: isChecked ? '1px solid #10b981' : '1px solid #e2e8f0',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const updated = isChecked
                                      ? selectedArray.filter((c) => c !== o.code)
                                      : [...selectedArray, o.code];
                                    handlePreviewAnswerChange(qKey, updated);
                                  }}
                                  style={{ accentColor: '#10b981', width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <span style={{ color: isChecked ? '#065f46' : '#1e293b', fontWeight: isChecked ? 600 : 400 }}>
                                  {o.text}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* 5. Ranking / Preference (Interactive Drag & Drop + Number Selector) */}
                      {q.type === 'ranking' && (
                        <PreviewRankingQuestion
                          question={q}
                          value={currentAnswer}
                          onChange={(rankedCodes) => handlePreviewAnswerChange(qKey, rankedCodes)}
                        />
                      )}

                      {/* 6. Linear Scale / Rating (1-5) */}
                      {q.type === 'rating' && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isSelected = String(currentAnswer) === String(star);
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => handlePreviewAnswerChange(qKey, String(star))}
                                className="ls-btn"
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: isSelected ? '#fef3c7' : '#ffffff',
                                  color: isSelected ? '#92400e' : '#334155',
                                  border: isSelected ? '1px solid #f59e0b' : '1px solid #cbd5e1',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <i className={isSelected ? 'ri-star-fill' : 'ri-star-line'} style={{ color: '#f59e0b' }} />
                                {star}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* 7. Matrix / Grid */}
                      {q.type === 'matrix' && (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b' }}>Statement</th>
                                {(q.settings?.columns || ['Col 1', 'Col 2', 'Col 3']).map((c, cIdx) => (
                                  <th key={cIdx} style={{ textAlign: 'center', padding: '8px 12px', color: '#64748b' }}>{c}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(q.settings?.rows || ['Row 1', 'Row 2']).map((r, rIdx) => {
                                const matrixMap = (typeof currentAnswer === 'object' && currentAnswer !== null) ? currentAnswer : {};
                                const selectedCol = matrixMap[r];
                                return (
                                  <tr key={rIdx} style={{ borderTop: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '10px 12px', fontWeight: 500, color: '#0f172a' }}>{r}</td>
                                    {(q.settings?.columns || ['Col 1', 'Col 2', 'Col 3']).map((c, cIdx) => (
                                      <td key={cIdx} style={{ textAlign: 'center', padding: '10px 12px' }}>
                                        <input
                                          type="radio"
                                          name={`preview_m_${idx}_${rIdx}`}
                                          checked={selectedCol === c}
                                          onChange={() => {
                                            const updated = { ...matrixMap, [r]: c };
                                            handlePreviewAnswerChange(qKey, updated);
                                          }}
                                          style={{ accentColor: '#10b981', cursor: 'pointer', width: '16px', height: '16px' }}
                                        />
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* 8. File Upload / Media Attachments Preview */}
                      {q.type === 'file_upload' && (
                        <PreviewFileUploadQuestion
                          question={q}
                          value={currentAnswer}
                          onChange={(files) => handlePreviewAnswerChange(qKey, files)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

            <div className="ls-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                <i className="ri-information-line" /> {getUiText('preview_test_note', previewLang)}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="ls-btn ls-btn-outline"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  Close Preview
                </button>
                <button
                  type="button"
                  className="ls-btn ls-btn-primary"
                  onClick={handleTestSubmitPreview}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <i className="ri-check-line" /> {getUiText('submit', previewLang)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Member Access Codes Modal */}
      {isBatchModalOpen && (
        <div
          className="ls-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isGeneratingBatch) {
              handleCloseBatchModal();
            }
          }}
        >
          <div
            className="ls-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="batch-modal-title"
            style={{ maxWidth: '460px' }}
          >
            <div className="ls-modal-header">
              <div className="ls-modal-title" id="batch-modal-title">
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--ls-color-primary-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ls-color-primary)',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}
                >
                  <i className="ri-magic-line" />
                </div>
                <span>Batch Member Access Codes</span>
              </div>
              <button
                type="button"
                className="ls-modal-close-btn"
                onClick={handleCloseBatchModal}
                disabled={isGeneratingBatch}
                aria-label="Close modal"
              >
                <i className="ri-close-line" />
              </button>
            </div>

            <form onSubmit={handleConfirmBatchGenerate}>
              <div className="ls-modal-body">
                <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--ls-color-g-700)', lineHeight: 1.5 }}>
                  Generate unique, single-use access codes for members. Each generated code is assigned to one person and can be used only once to submit a survey response.
                </p>

                <div className="ls-form-group" style={{ marginBottom: '4px' }}>
                  <label
                    htmlFor="batch-member-count"
                    className="ls-label"
                    style={{ fontWeight: 600, color: 'var(--ls-color-g-900)', marginBottom: '8px' }}
                  >
                    Number of members:
                  </label>
                  <input
                    id="batch-member-count"
                    type="number"
                    min="1"
                    max="500"
                    className="ls-input"
                    placeholder="e.g. 10"
                    value={batchMemberCount}
                    onChange={(e) => setBatchMemberCount(e.target.value)}
                    autoFocus
                    required
                    disabled={isGeneratingBatch}
                    style={{ fontSize: '15px' }}
                  />
                  <div className="ls-helper-text" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="ri-shield-user-line" style={{ color: 'var(--ls-color-primary)' }} />
                    <span>Each code is valid for exactly 1 person and 1 completion.</span>
                  </div>
                </div>
              </div>

              <div className="ls-modal-footer">
                <button
                  type="button"
                  className="ls-btn ls-btn-outline"
                  onClick={handleCloseBatchModal}
                  disabled={isGeneratingBatch}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ls-btn ls-btn-primary"
                  disabled={isGeneratingBatch}
                >
                  {isGeneratingBatch ? (
                    <>
                      <i className="ri-loader-4-line ri-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <i className="ri-magic-line" /> Generate Codes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multilingual Survey Settings Modal */}
      {isLanguageModalOpen && (
        <div
          className="ls-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLanguageModalOpen(false);
          }}
        >
          <div
            className="ls-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="language-modal-title"
            style={{ maxWidth: '620px', width: '90%' }}
          >
            <div className="ls-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <div className="ls-modal-title" id="language-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#ecfdf5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}
                >
                  <i className="ri-translate-2" />
                </div>
                <span>Survey Languages & Localization</span>
              </div>
              <button
                type="button"
                className="ls-modal-close"
                onClick={() => setIsLanguageModalOpen(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className="ls-modal-body" style={{ padding: '20px' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>
                Enable translations in any of the 10 supported languages. Switch languages using the top toolbar tabs to translate survey title, questions, help text, option labels, and matrix columns.
              </p>

              <div style={{ marginBottom: '20px', padding: '14px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label
                  htmlFor="default-lang-select"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}
                >
                  Default Survey Language:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <select
                    id="default-lang-select"
                    value={defaultLanguage}
                    onChange={(e) => {
                      const newDef = e.target.value;
                      setDefaultLanguage(newDef);
                      if (!supportedLanguages.includes(newDef)) {
                        setSupportedLanguages([...supportedLanguages, newDef]);
                      }
                    }}
                    className="ls-select"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    {supportedLanguages.map((code) => {
                      const lObj = SUPPORTED_LANGUAGES.find((l) => l.code === code);
                      return (
                        <option key={code} value={code}>
                          {lObj?.name} ({lObj?.nativeName})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                  This is the default questionnaire language shown to respondents if their preferred language is not selected.
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    Available Survey Languages ({supportedLanguages.length} of {SUPPORTED_LANGUAGES.length} selected):
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setSupportedLanguages(SUPPORTED_LANGUAGES.map((l) => l.code))}
                      style={{ border: 'none', background: 'none', color: '#10b981', cursor: 'pointer', fontSize: '12px', fontWeight: 600, textDecoration: 'underline' }}
                    >
                      Select All
                    </button>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSupportedLanguages(['en']);
                        setDefaultLanguage('en');
                        setEditingLanguage('en');
                      }}
                      style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
                    >
                      Reset to English
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '10px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    padding: '4px',
                  }}
                >
                  {SUPPORTED_LANGUAGES.map((l) => {
                    const isSelected = supportedLanguages.includes(l.code);
                    const isDefault = defaultLanguage === l.code;

                    return (
                      <label
                        key={l.code}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: isSelected ? '1px solid #10b981' : '1px solid #e2e8f0',
                          backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                          cursor: isDefault ? 'default' : 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isDefault}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSupportedLanguages([...supportedLanguages, l.code]);
                            } else {
                              if (supportedLanguages.length > 1 && !isDefault) {
                                setSupportedLanguages(supportedLanguages.filter((c) => c !== l.code));
                                if (editingLanguage === l.code) {
                                  setEditingLanguage(defaultLanguage);
                                }
                              }
                            }
                          }}
                          style={{ accentColor: '#10b981', width: '16px', height: '16px', cursor: isDefault ? 'default' : 'pointer' }}
                        />
                        <i className="ri-global-line" style={{ fontSize: '18px', color: isSelected ? '#10b981' : '#94a3b8' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '13px', fontWeight: isSelected ? 600 : 500, color: '#0f172a' }}>
                            {l.name}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {l.nativeName}
                          </span>
                        </div>
                        {isDefault && (
                          <span
                            style={{
                              marginLeft: 'auto',
                              fontSize: '10px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            Default
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="ls-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <button
                type="button"
                className="ls-btn ls-btn-primary"
                onClick={() => setIsLanguageModalOpen(false)}
                style={{ minWidth: '100px' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
