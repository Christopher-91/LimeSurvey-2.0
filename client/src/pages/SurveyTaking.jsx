import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/apiClient.js';
import { useToast } from '../context/ToastContext.jsx';

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

  useEffect(() => {
    const fetchSurveyToTake = async () => {
      try {
        const res = await apiClient.get(`/surveys/${id}/take`);
        if (res.success && res.data.survey) {
          const s = res.data.survey;
          setSurvey(s);

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
      showToast('Please fill out all required questions highlighted in red.', 'error');
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
        showToast('Thank you! Your response has been submitted.', 'success');
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

          <h1 style={{ fontSize: 'var(--ls-font-size-2xl)', marginBottom: '12px' }}>Response Recorded</h1>
          <p style={{ color: 'var(--ls-color-g-600)', fontSize: '16px', lineHeight: 1.6, marginBottom: 'var(--ls-space-8)' }}>
            {survey.endMessage || 'Thank you for taking the time to complete this questionnaire. Your answers have been securely submitted.'}
          </p>

          <Link to="/" className="ls-btn ls-btn-primary">
            Return to LimeSurvey Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ls-container" style={{ maxWidth: '780px' }}>
      {/* Survey Title & Welcome Card */}
      <div className="ls-card" style={{ marginBottom: 'var(--ls-space-6)', borderTop: '6px solid var(--ls-color-primary)' }}>
        <h1 style={{ fontSize: 'var(--ls-font-size-2xl)', fontWeight: 700, marginBottom: '8px' }}>
          {survey.title}
        </h1>
        {survey.description && (
          <p style={{ color: 'var(--ls-color-g-600)', fontSize: '15px', marginBottom: '16px' }}>
            {survey.description}
          </p>
        )}
        {survey.welcomeMessage && (
          <div style={{ backgroundColor: 'var(--ls-color-g-100)', padding: '14px 18px', borderRadius: 'var(--ls-radius-sm)', fontSize: '14px', borderLeft: '3px solid var(--ls-color-action)' }}>
            {survey.welcomeMessage}
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
          {questions.map((q, idx) => (
            <div
              key={q.id}
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
              {q.type === 'single_choice' && (
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
              {q.type === 'multiple_choice' && (
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
                    <i className="ri-check-line" /> Yes
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
                    <i className="ri-close-line" /> No
                  </button>
                </div>
              )}

              {/* 5. Short Free Text */}
              {q.type === 'short_text' && (
                <input
                  type="text"
                  className={`ls-input ${errors[q.code] ? 'error' : ''}`}
                  placeholder="Type your answer here..."
                  value={answers[q.code] || ''}
                  onChange={(e) => handleAnswerChange(q.code, e.target.value)}
                />
              )}

              {/* 6. Long Free Text */}
              {q.type === 'long_text' && (
                <textarea
                  className={`ls-textarea ${errors[q.code] ? 'error' : ''}`}
                  rows="4"
                  placeholder="Write your detailed feedback here..."
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

              {/* Validation error */}
              {errors[q.code] && (
                <p className="ls-error-text" style={{ marginTop: '8px' }}>
                  <i className="ri-alert-line" /> {errors[q.code]}
                </p>
              )}
            </div>
          ))}
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
                <i className="ri-loader-4-line ri-spin" /> Submitting Answers...
              </>
            ) : (
              <>
                <i className="ri-send-plane-fill" /> Submit Questionnaire
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
