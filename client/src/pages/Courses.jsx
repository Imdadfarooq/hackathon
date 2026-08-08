import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import Spinner from '../components/Spinner.jsx';
import { formatMinutes } from '../utils/format.js';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/courses')
      .then((res) => setCourses(res.data.courses))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading courses…" />;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <h1 className="page-title">Course catalog</h1>
      <p className="page-subtitle">Browse and continue your courses.</p>

      <div className="grid courses-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {courses.map((c) => {
          const pct = c.totalLessons ? Math.round((c.completedLessons / c.totalLessons) * 100) : 0;
          return (
            <Link
              to={`/courses/${c.id}`}
              key={c.id}
              className="card card-pad"
              style={{ color: 'var(--text)' }}
            >
              <div className="row-between" style={{ marginBottom: 10 }}>
                <span className={`badge badge-${c.difficulty}`}>{c.difficulty}</span>
                {c.enrolled ? (
                  <span className={`badge badge-${c.status}`}>{c.status}</span>
                ) : (
                  <span className="chip">Not enrolled</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <span className="course-dot" style={{ background: c.color }} />
                <h3 style={{ fontSize: '1.05rem' }}>{c.title}</h3>
              </div>
              <p className="muted" style={{ fontSize: '0.87rem', minHeight: 40 }}>
                {c.description}
              </p>
              <div className="course-meta" style={{ marginTop: 10 }}>
                {c.category} · {c.totalLessons} lessons · {formatMinutes(c.estimatedMinutes)}
              </div>
              {c.enrolled && (
                <div className="progress-track" style={{ marginTop: 6 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: c.color }} />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
