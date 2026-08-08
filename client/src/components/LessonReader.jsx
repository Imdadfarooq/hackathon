import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import api from '../api/client.js';
import { formatMinutes } from '../utils/format.js';

/**
 * Modal that fetches a lesson's full content and renders it as markdown.
 * Students can mark the lesson complete from inside the reader.
 */
export default function LessonReader({ courseId, lesson, isMentor, onClose, onComplete }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(lesson.completed);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get(`/courses/${courseId}/lessons/${lesson.id}`)
      .then((res) => {
        if (!active) return;
        setContent(res.data.lesson.content);
        setCompleted(res.data.lesson.completed);
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [courseId, lesson.id]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleComplete = async () => {
    setSaving(true);
    try {
      await onComplete(lesson);
      setCompleted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={lesson.title}
      >
        <div className="modal-header">
          <div style={{ minWidth: 0 }}>
            <div className="modal-eyebrow">Lesson {lesson.order}</div>
            <h2 className="modal-title">{lesson.title}</h2>
            <div className="muted" style={{ fontSize: '0.82rem' }}>
              {formatMinutes(lesson.estimatedMinutes)} · {lesson.difficulty}
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="center-msg">Loading lesson…</div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : (
            <div className="lesson-content">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {completed ? (
            <span className="badge badge-completed">Completed ✓</span>
          ) : isMentor ? (
            <span className="muted" style={{ fontSize: '0.85rem' }}>Mentor preview</span>
          ) : (
            <button className="btn btn-primary" onClick={handleComplete} disabled={saving}>
              {saving ? 'Saving…' : 'Mark complete'}
            </button>
          )}
          <button className="btn btn-outline" onClick={onClose}>
            Done reading
          </button>
        </div>
      </div>
    </div>
  );
}
