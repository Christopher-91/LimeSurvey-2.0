import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/apiClient.js';
import { useToast } from '../context/ToastContext.jsx';

export const SurveyBuilder = () => {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'questions' | 'voters'
  const [isLoading, setIsLoading] = useState(!isNew);

  // Survey Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [endMessage, setEndMessage] = useState('');
  const [active, setActive] = useState(false);

  // Questions & Groups
  const [questions, setQuestions] = useState([]);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQCode, setNewQCode] = useState('');
  const [newQText, setNewQText] = useState('');
  const [newQType, setNewQType] = useState('single_choice');
  const [newQMandatory, setNewQMandatory] = useState(false);
  const [optionsText, setOptionsText] = useState('Option 1\nOption 2\nOption 3');

  // Editing Question
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editQCode, setEditQCode] = useState('');
  const [editQText, setEditQText] = useState('');
  const [editQType, setEditQType] = useState('single_choice');
  const [editQMandatory, setEditQMandatory] = useState(false);
  const [editOptionsText, setEditOptionsText] = useState('');

  // Voters
  const [voters, setVoters] = useState([]);
  const [newVoterEmail, setNewVoterEmail] = useState('');
  const [newVoterToken, setNewVoterToken] = useState('');

  const fetchSurvey = async () => {
    try {
      const res = await apiClient.get(`/surveys/${id}`);
      if (res.success && res.data.survey) {
        const s = res.data.survey;
        setTitle(s.title || '');
        setDescription(s.description || '');
        setWelcomeMessage(s.welcomeMessage || '');
        setEndMessage(s.endMessage || '');
        setActive(s.active || false);

        // Gather all questions
        const allQ = [
          ...(s.questions || []),
          ...((s.groups || []).flatMap((g) => g.questions || [])),
        ];
        setQuestions(allQ);
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

  const handleSaveSurvey = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Survey Title is required', 'error');
      return;
    }

    try {
      if (isNew) {
        const res = await apiClient.post('/surveys', {
          title,
          description,
          welcomeMessage,
          endMessage,
          active,
        });
        showToast('Survey created successfully!', 'success');
        navigate(`/admin/surveys/${res.data.survey.id}/edit`);
      } else {
        await apiClient.put(`/surveys/${id}`, {
          title,
          description,
          welcomeMessage,
          endMessage,
          active,
        });
        showToast('Survey settings updated!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to save survey', 'error');
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQText.trim()) {
      showToast('Question text is required', 'error');
      return;
    }

    // Parse options from textarea
    const options = ['single_choice', 'multiple_choice'].includes(newQType)
      ? optionsText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line, idx) => ({
            code: `AO${idx + 1}`,
            text: line,
            sortOrder: idx + 1,
          }))
      : [];

    try {
      const res = await apiClient.post(`/surveys/${id}/questions`, {
        code: newQCode.trim() || `Q${questions.length + 1}`,
        text: newQText.trim(),
        type: newQType,
        mandatory: newQMandatory,
        sortOrder: questions.length + 1,
        options,
      });

      if (res.success) {
        showToast('Question added!', 'success');
        setIsAddingQuestion(false);
        setNewQCode('');
        setNewQText('');
        setOptionsText('Option 1\nOption 2\nOption 3');
        fetchSurvey();
      }
    } catch (err) {
      showToast(err.message || 'Failed to add question', 'error');
    }
  };

  const handleStartEditQuestion = (q) => {
    setIsAddingQuestion(false);
    setEditingQuestionId(q.id);
    setEditQCode(q.code || '');
    setEditQText(q.text || '');
    setEditQType(q.type || 'single_choice');
    setEditQMandatory(Boolean(q.mandatory));
    const opts = (q.options || []).map((o) => o.text).join('\n');
    setEditOptionsText(opts || 'Option 1\nOption 2\nOption 3');
  };

  const handleCancelEditQuestion = () => {
    setEditingQuestionId(null);
    setEditQCode('');
    setEditQText('');
    setEditQType('single_choice');
    setEditQMandatory(false);
    setEditOptionsText('');
  };

  const handleSaveEditQuestion = async (e) => {
    e.preventDefault();
    if (!editQText.trim()) {
      showToast('Question text is required', 'error');
      return;
    }

    // Parse options from textarea
    const options = ['single_choice', 'multiple_choice'].includes(editQType)
      ? editOptionsText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line, idx) => ({
            code: `AO${idx + 1}`,
            text: line,
            sortOrder: idx + 1,
          }))
      : [];

    try {
      const res = await apiClient.put(`/questions/${editingQuestionId}`, {
        code: editQCode.trim() || undefined,
        text: editQText.trim(),
        type: editQType,
        mandatory: editQMandatory,
        options,
      });

      if (res.success) {
        showToast('Question updated successfully!', 'success');
        handleCancelEditQuestion();
        fetchSurvey();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update question', 'error');
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await apiClient.delete(`/questions/${qId}`);
      showToast('Question removed', 'info');
      if (editingQuestionId === qId) {
        handleCancelEditQuestion();
      }
      fetchSurvey();
    } catch (err) {
      showToast(err.message || 'Failed to delete question', 'error');
    }
  };

  const handleAddVoter = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/surveys/${id}/voters`, {
        email: newVoterEmail.trim(),
        token: newVoterToken.trim() || undefined,
      });
      showToast('Voter access code created!', 'success');
      setNewVoterEmail('');
      setNewVoterToken('');
      fetchVoters();
    } catch (err) {
      showToast(err.message || 'Failed to add voter', 'error');
    }
  };

  const handleGenerateBatchVoters = async () => {
    try {
      await apiClient.post(`/surveys/${id}/voters/batch`, { count: 5 });
      showToast('Generated 5 voter access tokens!', 'success');
      fetchVoters();
    } catch (err) {
      showToast(err.message || 'Failed to generate batch tokens', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="ls-container">
        <div className="ls-card">
          <div className="ls-skeleton" style={{ width: '40%', marginBottom: '20px' }} />
          <div className="ls-skeleton" style={{ width: '80%', marginBottom: '14px' }} />
          <div className="ls-skeleton" style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="ls-container">
      <div className="ls-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link to="/admin/surveys" style={{ fontSize: '14px' }}>
              ← Back to Surveys
            </Link>
          </div>
          <h1 className="ls-page-title">
            {isNew ? 'Create New Survey' : `Survey Editor: ${title}`}
          </h1>
        </div>

        {!isNew && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to={`/admin/surveys/${id}/statistics`} className="ls-btn ls-btn-outline">
              <i className="ri-bar-chart-2-line" /> Results & Stats
            </Link>
            <Link to={`/surveys/${id}/take`} target="_blank" className="ls-btn ls-btn-primary">
              <i className="ri-external-link-line" /> Preview Survey
            </Link>
          </div>
        )}
      </div>

      {/* Tabs */}
      {!isNew && (
        <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--ls-space-6)', borderBottom: '1px solid var(--ls-color-g-400)' }}>
          <button
            type="button"
            className={`ls-btn ${activeTab === 'settings' ? 'ls-btn-primary' : 'ls-btn-outline'}`}
            style={{ borderRadius: '4px 4px 0 0', borderBottom: 'none' }}
            onClick={() => setActiveTab('settings')}
          >
            <i className="ri-settings-line" /> Survey Settings
          </button>
          <button
            type="button"
            className={`ls-btn ${activeTab === 'questions' ? 'ls-btn-primary' : 'ls-btn-outline'}`}
            style={{ borderRadius: '4px 4px 0 0', borderBottom: 'none' }}
            onClick={() => setActiveTab('questions')}
          >
            <i className="ri-questionnaire-line" /> Questions ({questions.length})
          </button>
          <button
            type="button"
            className={`ls-btn ${activeTab === 'voters' ? 'ls-btn-primary' : 'ls-btn-outline'}`}
            style={{ borderRadius: '4px 4px 0 0', borderBottom: 'none' }}
            onClick={() => setActiveTab('voters')}
          >
            <i className="ri-group-line" /> Participants & Tokens ({voters.length})
          </button>
        </div>
      )}

      {/* TAB 1: SETTINGS */}
      {(isNew || activeTab === 'settings') && (
        <div className="ls-card">
          <h2 className="ls-card-title" style={{ marginBottom: 'var(--ls-space-5)' }}>
            General Survey Settings
          </h2>
          <form onSubmit={handleSaveSurvey}>
            <div className="ls-form-group">
              <label className="ls-label" htmlFor="survey-title">
                Survey Title *
              </label>
              <input
                id="survey-title"
                type="text"
                className="ls-input"
                placeholder="e.g. Employee Engagement Q3 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="ls-form-group">
              <label className="ls-label" htmlFor="survey-desc">
                Description
              </label>
              <textarea
                id="survey-desc"
                className="ls-textarea"
                rows="3"
                placeholder="Brief summary explaining the questionnaire purpose..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div className="ls-form-group">
                <label className="ls-label" htmlFor="welcome-msg">
                  Welcome Message
                </label>
                <textarea
                  id="welcome-msg"
                  className="ls-textarea"
                  rows="3"
                  placeholder="Displayed before starting the questions..."
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                />
              </div>

              <div className="ls-form-group">
                <label className="ls-label" htmlFor="end-msg">
                  End / Completion Message
                </label>
                <textarea
                  id="end-msg"
                  className="ls-textarea"
                  rows="3"
                  placeholder="Thank you message upon final submission..."
                  value={endMessage}
                  onChange={(e) => setEndMessage(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', margin: 'var(--ls-space-4) 0 var(--ls-space-6) 0' }}>
              <input
                id="survey-active"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--ls-color-primary)', marginRight: '10px' }}
              />
              <label htmlFor="survey-active" style={{ fontSize: '15px', fontWeight: 500, cursor: 'pointer' }}>
                Activate & Publish Survey (Allows responses to be submitted)
              </label>
            </div>

            <button type="submit" className="ls-btn ls-btn-primary ls-btn-lg">
              <i className="ri-save-line" /> {isNew ? 'Create & Continue to Questions' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: QUESTIONS */}
      {!isNew && activeTab === 'questions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--ls-space-4)' }}>
            <h2 style={{ fontSize: 'var(--ls-font-size-lg)' }}>Survey Questions</h2>
            <button
              type="button"
              className="ls-btn ls-btn-primary"
              onClick={() => {
                handleCancelEditQuestion();
                setIsAddingQuestion(true);
              }}
            >
              <i className="ri-add-line" /> Add Question
            </button>
          </div>

          {/* Add Question Modal / Form */}
          {isAddingQuestion && (
            <div className="ls-card" style={{ marginBottom: 'var(--ls-space-6)', border: '2px solid var(--ls-color-action)' }}>
              <div className="ls-card-header">
                <h3 className="ls-card-title">New Question</h3>
                <button
                  type="button"
                  className="ls-btn ls-btn-outline ls-btn-sm"
                  onClick={() => setIsAddingQuestion(false)}
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleAddQuestion}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                  <div className="ls-form-group">
                    <label className="ls-label">Question Code</label>
                    <input
                      type="text"
                      className="ls-input"
                      placeholder={`Q${questions.length + 1}`}
                      value={newQCode}
                      onChange={(e) => setNewQCode(e.target.value)}
                    />
                  </div>

                  <div className="ls-form-group">
                    <label className="ls-label">Question Type</label>
                    <select
                      className="ls-select"
                      value={newQType}
                      onChange={(e) => setNewQType(e.target.value)}
                    >
                      <option value="single_choice">Single Choice (Radio Buttons)</option>
                      <option value="multiple_choice">Multiple Choice (Checkboxes)</option>
                      <option value="rating">Rating (1 to 5 Stars)</option>
                      <option value="short_text">Short Free Text (Single Line)</option>
                      <option value="long_text">Long Free Text (Multi-line Paragraph)</option>
                      <option value="number">Number / Numeric Input</option>
                      <option value="yes_no">Yes / No Switch</option>
                      <option value="date">Date Selection</option>
                    </select>
                  </div>
                </div>

                <div className="ls-form-group">
                  <label className="ls-label">Question Text *</label>
                  <input
                    type="text"
                    className="ls-input"
                    placeholder="Enter the question shown to participants..."
                    value={newQText}
                    onChange={(e) => setNewQText(e.target.value)}
                    required
                  />
                </div>

                {['single_choice', 'multiple_choice'].includes(newQType) && (
                  <div className="ls-form-group">
                    <label className="ls-label">Answer Options (One per line)</label>
                    <textarea
                      className="ls-textarea"
                      rows="4"
                      value={optionsText}
                      onChange={(e) => setOptionsText(e.target.value)}
                    />
                    <p className="ls-helper-text">Enter each selectable answer choice on a new line.</p>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--ls-space-4)' }}>
                  <input
                    id="q-mandatory"
                    type="checkbox"
                    checked={newQMandatory}
                    onChange={(e) => setNewQMandatory(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--ls-color-primary)', marginRight: '8px' }}
                  />
                  <label htmlFor="q-mandatory" style={{ fontSize: '14px', cursor: 'pointer' }}>
                    Mandatory Question (Participants must answer to submit)
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" className="ls-btn ls-btn-primary">
                    <i className="ri-check-line" /> Save Question
                  </button>
                  <button
                    type="button"
                    className="ls-btn ls-btn-outline"
                    onClick={() => setIsAddingQuestion(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Question List */}
          {questions.length === 0 ? (
            <div className="ls-card ls-empty-state">
              <i className="ri-question-line ls-empty-icon" />
              <h3>No questions added yet</h3>
              <p style={{ margin: '8px 0 16px 0' }}>Add questions to start collecting answers.</p>
              <button
                type="button"
                className="ls-btn ls-btn-primary"
                onClick={() => setIsAddingQuestion(true)}
              >
                <i className="ri-add-line" /> Add First Question
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {questions.map((q, idx) => {
                if (editingQuestionId === q.id) {
                  return (
                    <div
                      key={q.id}
                      className="ls-card"
                      style={{ border: '2px solid var(--ls-color-primary)', backgroundColor: 'var(--ls-color-surface)' }}
                    >
                      <div className="ls-card-header" style={{ marginBottom: '16px' }}>
                        <h3 className="ls-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="ri-pencil-line" style={{ color: 'var(--ls-color-primary)' }} />
                          Edit Question #{idx + 1}
                        </h3>
                        <button
                          type="button"
                          className="ls-btn ls-btn-outline ls-btn-sm"
                          onClick={handleCancelEditQuestion}
                        >
                          Cancel
                        </button>
                      </div>

                      <form onSubmit={handleSaveEditQuestion}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                          <div className="ls-form-group">
                            <label className="ls-label" htmlFor={`edit-code-${q.id}`}>
                              Question Code / Title
                            </label>
                            <input
                              id={`edit-code-${q.id}`}
                              type="text"
                              className="ls-input"
                              placeholder={`e.g. Q${idx + 1}`}
                              value={editQCode}
                              onChange={(e) => setEditQCode(e.target.value)}
                            />
                          </div>

                          <div className="ls-form-group">
                            <label className="ls-label" htmlFor={`edit-type-${q.id}`}>
                              Question Type
                            </label>
                            <select
                              id={`edit-type-${q.id}`}
                              className="ls-select"
                              value={editQType}
                              onChange={(e) => setEditQType(e.target.value)}
                            >
                              <option value="single_choice">Single Choice (Radio Buttons)</option>
                              <option value="multiple_choice">Multiple Choice (Checkboxes)</option>
                              <option value="rating">Rating (1 to 5 Stars)</option>
                              <option value="short_text">Short Free Text (Single Line)</option>
                              <option value="long_text">Long Free Text (Multi-line Paragraph)</option>
                              <option value="number">Number / Numeric Input</option>
                              <option value="yes_no">Yes / No Switch</option>
                              <option value="date">Date Selection</option>
                            </select>
                          </div>
                        </div>

                        <div className="ls-form-group">
                          <label className="ls-label" htmlFor={`edit-text-${q.id}`}>
                            Question Text *
                          </label>
                          <input
                            id={`edit-text-${q.id}`}
                            type="text"
                            className="ls-input"
                            placeholder="Enter the question shown to participants..."
                            value={editQText}
                            onChange={(e) => setEditQText(e.target.value)}
                            required
                          />
                        </div>

                        {['single_choice', 'multiple_choice'].includes(editQType) && (
                          <div className="ls-form-group">
                            <label className="ls-label" htmlFor={`edit-options-${q.id}`}>
                              Answer Options (One per line)
                            </label>
                            <textarea
                              id={`edit-options-${q.id}`}
                              className="ls-textarea"
                              rows="4"
                              value={editOptionsText}
                              onChange={(e) => setEditOptionsText(e.target.value)}
                              placeholder="Option 1&#10;Option 2&#10;Option 3"
                            />
                            <p className="ls-helper-text">Enter each selectable answer choice on a new line.</p>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--ls-space-4)' }}>
                          <input
                            id={`edit-mandatory-${q.id}`}
                            type="checkbox"
                            checked={editQMandatory}
                            onChange={(e) => setEditQMandatory(e.target.checked)}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--ls-color-primary)', marginRight: '8px', cursor: 'pointer' }}
                          />
                          <label htmlFor={`edit-mandatory-${q.id}`} style={{ fontSize: '14px', cursor: 'pointer' }}>
                            Mandatory Question (Participants must answer to submit)
                          </label>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="submit" className="ls-btn ls-btn-primary">
                            <i className="ri-check-line" /> Save Changes
                          </button>
                          <button
                            type="button"
                            className="ls-btn ls-btn-outline"
                            onClick={handleCancelEditQuestion}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  );
                }

                return (
                  <div key={q.id} className="ls-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--ls-color-g-600)', minWidth: '40px' }}>
                          #{idx + 1}
                        </span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600, fontSize: '16px' }}>{q.text}</span>
                            {q.mandatory ? (
                              <span className="ls-badge" style={{ backgroundColor: '#feecee', color: 'var(--ls-color-danger)' }}>
                                Required
                              </span>
                            ) : (
                              <span className="ls-badge" style={{ backgroundColor: 'var(--ls-color-g-200)', color: 'var(--ls-color-g-700)' }}>
                                Not Required
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--ls-color-g-600)' }}>
                            Code: <code>{q.code}</code> | Type: <strong>{q.type.replace('_', ' ')}</strong>
                          </span>

                          {q.options && q.options.length > 0 && (
                            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {q.options.map((opt) => (
                                <span key={opt.id || opt.code} className="ls-badge ls-badge-secondary">
                                  {opt.text}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleStartEditQuestion(q)}
                          className="ls-btn ls-btn-outline ls-btn-sm"
                          title="Edit Question"
                        >
                          <i className="ri-pencil-line" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="ls-btn ls-btn-outline ls-btn-sm"
                          style={{ color: 'var(--ls-color-danger)' }}
                          title="Delete Question"
                        >
                          <i className="ri-delete-bin-line" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VOTERS & PARTICIPANTS */}
      {!isNew && activeTab === 'voters' && (
        <div>
          <div className="ls-card" style={{ marginBottom: 'var(--ls-space-6)' }}>
            <div className="ls-card-header">
              <h2 className="ls-card-title">Generate Access Codes</h2>
              <button
                type="button"
                className="ls-btn ls-btn-outline ls-btn-sm"
                onClick={handleGenerateBatchVoters}
              >
                <i className="ri-magic-line" /> Quick Generate 5 Random Tokens
              </button>
            </div>

            <form onSubmit={handleAddVoter} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label className="ls-label">Participant Email</label>
                <input
                  type="email"
                  className="ls-input"
                  placeholder="voter@company.com"
                  value={newVoterEmail}
                  onChange={(e) => setNewVoterEmail(e.target.value)}
                />
              </div>
              <div style={{ flex: '1', minWidth: '180px' }}>
                <label className="ls-label">Custom Access Token (Optional)</label>
                <input
                  type="text"
                  className="ls-input"
                  placeholder="e.g. VIP-ACCESS-2026"
                  value={newVoterToken}
                  onChange={(e) => setNewVoterToken(e.target.value)}
                />
              </div>
              <button type="submit" className="ls-btn ls-btn-primary">
                <i className="ri-add-line" /> Add Participant
              </button>
            </form>
          </div>

          <div className="ls-card">
            <h2 className="ls-card-title" style={{ marginBottom: 'var(--ls-space-4)' }}>
              Registered Participants ({voters.length})
            </h2>

            {voters.length === 0 ? (
              <div className="ls-empty-state">
                <i className="ri-user-unfollow-line ls-empty-icon" />
                <h3>No private access codes generated</h3>
                <p>Anyone can answer if the survey is set to public, or you can generate closed tokens above.</p>
              </div>
            ) : (
              <div className="ls-table-container">
                <table className="ls-table">
                  <thead>
                    <tr>
                      <th>Voter ID</th>
                      <th>Access Code (Token)</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Direct Invitation Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voters.map((v) => (
                      <tr key={v.id}>
                        <td style={{ fontWeight: 600 }}>{v.voterId}</td>
                        <td>
                          <code>{v.token}</code>
                        </td>
                        <td>{v.email || '—'}</td>
                        <td>
                          <span className={`ls-badge ${v.completed ? 'ls-badge-success' : 'ls-badge-secondary'}`}>
                            {v.completed ? 'Completed' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          <a
                            href={`/surveys/${id}/take?token=${v.token}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '13px' }}
                          >
                            Open Survey Link →
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
