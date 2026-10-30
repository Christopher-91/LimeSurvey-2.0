import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/apiClient.js';
import { useToast } from '../context/ToastContext.jsx';

export const SurveyBuilder = () => {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('builder'); // 'builder' | 'voters'
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Survey Header Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [endMessage, setEndMessage] = useState('');
  const [showWelcomeCompletion, setShowWelcomeCompletion] = useState(false);

  // Deployment & Privacy Settings
  const [active, setActive] = useState(false);
  const [zeroKnowledgeEnabled, setZeroKnowledgeEnabled] = useState(false);

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
        questions: questions.map((q, idx) => ({
          id: q.id && !String(q.id).startsWith('temp-') ? q.id : undefined,
          code: q.code ? q.code.trim() : `Q${idx + 1}`,
          text: q.text.trim(),
          type: q.type,
          mandatory: Boolean(q.mandatory),
          helpText: q.helpText ? q.helpText.trim() : '',
          sortOrder: idx + 1,
          options: ['single_choice', 'multiple_choice'].includes(q.type)
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

  const handleGenerateBatchVoters = async () => {
    try {
      await apiClient.post(`/surveys/${id}/voters/batch`, { count: 5 });
      showToast('Generated 5 single-use voter tokens!', 'success');
      fetchVoters();
    } catch (err) {
      showToast(err.message || 'Failed to generate batch tokens', 'error');
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
                placeholder="Survey Title (e.g. Employee Engagement Q3 2026)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                placeholder="Survey description or instructions for participants..."
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                        placeholder="Displayed before participants start answering..."
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
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
                        placeholder="Thank you message upon questionnaire submission..."
                        value={endMessage}
                        onChange={(e) => setEndMessage(e.target.value)}
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
                        <div style={{ flex: '1 1 70%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#10b981',
                              }}
                            >
                              {idx + 1}.
                            </span>
                            <input
                              type="text"
                              placeholder="Question text (e.g. How satisfied are you with team communication?)"
                              value={q.text}
                              onChange={(e) => updateQuestion(idx, { text: e.target.value })}
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
                          </div>

                          {q.helpText !== undefined && (
                            <input
                              type="text"
                              placeholder="Optional description / helper instructions..."
                              value={q.helpText}
                              onChange={(e) => updateQuestion(idx, { helpText: e.target.value })}
                              style={{
                                width: '100%',
                                fontSize: '13px',
                                color: '#64748b',
                                border: '1px dashed #cbd5e1',
                                borderRadius: '4px',
                                padding: '6px 10px',
                                marginTop: '4px',
                                outline: 'none',
                                background: '#f8fafc',
                              }}
                            />
                          )}

                          {zeroKnowledgeEnabled && q.type === 'long_text' && (
                            <div
                              style={{
                                marginTop: '8px',
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
                              }}
                            >
                              <i className="ri-shield-keyhole-line" />
                              ZK Ghost Comment: voter profile decoupled on submission
                            </div>
                          )}
                        </div>

                        {/* Question Type Selector */}
                        <div style={{ flex: '0 0 28%', minWidth: '170px' }}>
                          <select
                            className="ls-select"
                            value={q.type}
                            onChange={(e) => updateQuestion(idx, { type: e.target.value })}
                            style={{
                              padding: '10px 12px',
                              fontSize: '14px',
                              fontWeight: 500,
                              color: '#1e293b',
                              borderColor: '#cbd5e1',
                              backgroundColor: '#ffffff',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="short_text">Short Answer</option>
                            <option value="long_text">Paragraph / Comment</option>
                            <option value="single_choice">Multiple Choice (Radio)</option>
                            <option value="multiple_choice">Checkboxes (Multi-select)</option>
                            <option value="rating">Linear Scale / Rating (1-5)</option>
                            <option value="matrix">Matrix / Grid</option>
                          </select>
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
                            {(q.options || []).map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                }}
                              >
                                {q.type === 'single_choice' ? (
                                  <i
                                    className="ri-radio-button-line"
                                    style={{ color: '#94a3b8', fontSize: '18px' }}
                                  />
                                ) : (
                                  <i
                                    className="ri-checkbox-blank-line"
                                    style={{ color: '#94a3b8', fontSize: '18px' }}
                                  />
                                )}
                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) => handleUpdateOption(idx, oIdx, e.target.value)}
                                  placeholder={`Option ${oIdx + 1}`}
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
                                <i className="ri-add-line" /> Add Option
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
                                      value={row}
                                      onChange={(e) => handleUpdateMatrixSettings(idx, 'rows', rIdx, e.target.value)}
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
                                      value={col}
                                      onChange={(e) => handleUpdateMatrixSettings(idx, 'columns', cIdx, e.target.value)}
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
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                  }}
                />
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
                  justifyContent: 'space-between',
                  gap: '16px',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                  }}
                />
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
                  onClick={handleGenerateBatchVoters}
                  className="ls-btn ls-btn-outline ls-btn-sm"
                  title="Generate 5 single-use tokens"
                >
                  <i className="ri-magic-line" /> Batch (5 Codes)
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
            <div className="ls-modal-header">
              <div className="ls-modal-title">
                <i className="ri-eye-line" style={{ color: '#10b981' }} /> Survey Preview
              </div>
              <button
                type="button"
                className="ls-modal-close"
                onClick={() => setIsPreviewOpen(false)}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: '20px 0' }}>
              <div
                className="ls-card"
                style={{
                  borderTop: '6px solid #10b981',
                  marginBottom: '20px',
                  borderRadius: '8px',
                }}
              >
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  {title || 'Untitled Survey'}
                </h1>
                {description && <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '14px' }}>{description}</p>}
                {welcomeMessage && (
                  <div style={{ padding: '12px 14px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '13px', color: '#334155' }}>
                    {welcomeMessage}
                  </div>
                )}
                {zeroKnowledgeEnabled && (
                  <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#047857' }}>
                    <i className="ri-shield-keyhole-line" /> Zero Knowledge Secret Ballot Active
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {questions.map((q, idx) => (
                  <div key={idx} className="ls-card" style={{ borderRadius: '8px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontWeight: 700, color: '#10b981', marginRight: '6px' }}>{idx + 1}.</span>
                      <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                        {q.text || `Question ${idx + 1}`}
                      </strong>
                      {q.mandatory && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                      {q.helpText && <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{q.helpText}</p>}
                    </div>

                    {/* Preview Inputs */}
                    {q.type === 'short_text' && (
                      <input type="text" className="ls-input" disabled placeholder="Your answer..." />
                    )}
                    {q.type === 'long_text' && (
                      <textarea className="ls-textarea" disabled rows={3} placeholder="Your comment / feedback..." />
                    )}
                    {q.type === 'single_choice' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(q.options || []).map((o, oIdx) => (
                          <label key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                            <input type="radio" disabled name={`preview_${idx}`} /> {o.text}
                          </label>
                        ))}
                      </div>
                    )}
                    {q.type === 'multiple_choice' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(q.options || []).map((o, oIdx) => (
                          <label key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                            <input type="checkbox" disabled /> {o.text}
                          </label>
                        ))}
                      </div>
                    )}
                    {q.type === 'rating' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" className="ls-btn ls-btn-outline ls-btn-sm" disabled>
                            ★ {star}
                          </button>
                        ))}
                      </div>
                    )}
                    {q.type === 'matrix' && (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: '13px' }}>
                          <thead>
                            <tr>
                              <th></th>
                              {(q.settings?.columns || ['Col 1', 'Col 2', 'Col 3']).map((c, cIdx) => (
                                <th key={cIdx} style={{ textAlign: 'center', padding: '6px' }}>{c}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(q.settings?.rows || ['Row 1', 'Row 2']).map((r, rIdx) => (
                              <tr key={rIdx} style={{ borderTop: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '8px 4px', fontWeight: 500 }}>{r}</td>
                                {(q.settings?.columns || ['Col 1', 'Col 2', 'Col 3']).map((_, cIdx) => (
                                  <td key={cIdx} style={{ textAlign: 'center' }}>
                                    <input type="radio" disabled name={`preview_m_${idx}_${rIdx}`} />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="ls-modal-footer">
              <button
                type="button"
                className="ls-btn ls-btn-primary"
                onClick={() => setIsPreviewOpen(false)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
