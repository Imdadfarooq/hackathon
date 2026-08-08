import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client.js';
import Spinner from '../components/Spinner.jsx';
import { formatMinutes } from '../utils/format.js';

export default function CourseDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyLesson, setBusyLesson] = useState(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/courses/${id}`);
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const enroll = async () => {
    try {
      await api.post(`/courses/${id}/enroll`);
      setNotice('Enrolled! You can start completing lessons.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  // Mark a lesson complete by recording an activity event. The backend keeps
  // enrollment progress and analytics in sync from this single write.
  const completeLesson = async (lesson) => {
    setBusyLesson(lesson.id);
    setError('');
    try {
      await api.post('/activities', {
        type: 'lesson_completed',
        courseId: id,
        lessonId: lesson.id,
        durationMinutes: lesson.estimatedMinutes,
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyLesson(null);
    }
  };

  if (loading) return <Spinner label="Loading course…" />;
  if (error && !data) return <div className="alert alert-error">{error}</div>;
  if (!data) return null;

  const { course, enrollment, lessons } = data;
  const completedCount = lessons.filter((l) => l.completed).length;
  const pct = course.totalLessons ? Math.round((completedCount / course.totalLessons) * 100) : 0;

  return (
    <div>
      <Link to="/courses" className="muted" style={{ fontSize: '0.9rem' }}>
        ← Back to courses
      </Link>

      {notice && <div className="alert alert-success mt">{notice}</div>}
      {error && <div className="alert alert-error mt">{error}</div>}

      <div className="card card-pad mt">
        <div className="row-between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span className="course-dot" style={{ background: course.color, width: 16, height: 16 }} />
            <div>
              <h1 className="page-title" style={{ marginBottom: 2 }}>{course.title}</h1>
              <div className="flex gap-sm">
                <span className={`badge badge-${course.difficulty}`}>{course.difficulty}</span>
                <span className="chip">{course.category}</span>
                <span className="chip">{formatMinutes(course.estimatedMinutes)}</span>
              </div>
            </div>
          </div>
          {!enrollment && (
            <button className="btn btn-primary" onClick={enroll}>
              Enroll
            </button>
          )}
        </div>

        <p className="muted mt">{course.description}</p>

        {enrollment && (
          <div className="mt">
            <div className="row-between" style={{ marginBottom: 6 }}>
              <span className="muted" style={{ fontSize: '0.85rem' }}>
                {completedCount}/{course.totalLessons} lessons · {pct}% complete
              </span>
              <span className={`badge badge-${enrollment.status}`}>{enrollment.status}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%`, background: course.color }} />
            </div>
          </div>
        )}
      </div>

      <h2 style={{ fontSize: '1.15rem', margin: '22px 0 12px' }}>Lessons</h2>
      {lessons.map((lesson) => (
        <div className="lesson-item" key={lesson.id}>
          <span className={`lesson-check ${lesson.completed ? 'done' : ''}`}>
            {lesson.completed ? '✓' : lesson.order}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{lesson.title}</div>
            <div className="muted" style={{ fontSize: '0.82rem' }}>
              {lesson.summary} · {formatMinutes(lesson.estimatedMinutes)}
            </div>
          </div>
          {enrollment ? (
            lesson.completed ? (
              <span className="badge badge-completed">Done</span>
            ) : (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => completeLesson(lesson)}
                disabled={busyLesson === lesson.id}
              >
                {busyLesson === lesson.id ? 'Saving…' : 'Mark complete'}
              </button>
            )
          ) : (
            <span className="chip">Enroll to start</span>
          )}
        </div>
      ))}
    </div>
  );
}
