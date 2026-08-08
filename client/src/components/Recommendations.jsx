import { Link } from 'react-router-dom';
import { formatMinutes } from '../utils/format.js';

const TAG_CLASS = {
  continue: 'rec-continue',
  revisit: 'rec-revisit',
  explore: 'rec-explore',
};

export default function Recommendations({ data }) {
  if (!data) return null;
  const { recommendations, adaptiveSignal } = data;

  return (
    <div className="card card-pad">
      <div className="card-header">
        <div>
          <div className="card-title">Recommended next steps</div>
          <div className="card-subtitle">Adaptive suggestions based on your activity</div>
        </div>
      </div>

      {adaptiveSignal?.targetDifficulty && (
        <div className="alert" style={{ background: 'var(--primary-soft)', color: 'var(--primary-dark)' }}>
          Your average quiz score is <strong>{adaptiveSignal.avgQuizScore}%</strong> — new-course
          suggestions are tuned to the <strong>{adaptiveSignal.targetDifficulty}</strong> level.
        </div>
      )}

      {!recommendations.length ? (
        <div className="empty">No recommendations right now — enroll in a course to get started.</div>
      ) : (
        recommendations.map((r, i) => (
          <div className="rec-item" key={`${r.type}-${r.course.id}-${i}`}>
            <span className={`rec-tag ${TAG_CLASS[r.type]}`}>{r.type}</span>
            <div className="rec-body">
              <div className="rec-title">
                {r.lesson ? `${r.course.title}: ${r.lesson.title}` : r.course.title}
              </div>
              <div className="rec-reason">{r.reason}</div>
              {r.lesson && (
                <div className="muted" style={{ fontSize: '0.8rem', marginTop: 4 }}>
                  Lesson {r.lesson.order} · {formatMinutes(r.lesson.estimatedMinutes)}
                </div>
              )}
            </div>
            <Link to={`/courses/${r.course.id}`} className="btn btn-outline btn-sm" style={{ alignSelf: 'center' }}>
              {r.type === 'continue' ? 'Resume' : r.type === 'explore' ? 'View' : 'Review'}
            </Link>
          </div>
        ))
      )}
    </div>
  );
}
