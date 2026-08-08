import { Link } from 'react-router-dom';
import { formatMinutes } from '../utils/format.js';

export default function CourseProgressList({ courses, linkable = true }) {
  if (!courses.length) {
    return <div className="empty">You haven&apos;t enrolled in any courses yet.</div>;
  }

  return (
    <div>
      {courses.map((c) => {
        const Title = linkable ? Link : 'span';
        const titleProps = linkable ? { to: `/courses/${c.courseId}` } : {};
        return (
          <div className="course-row" key={c.courseId}>
            <span className="course-dot" style={{ background: c.color }} />
            <div className="course-main">
              <div className="course-name">
                <Title {...titleProps} style={{ color: 'var(--text)' }}>
                  {c.title}
                </Title>
                <span className={`badge badge-${c.status}`}>{c.status}</span>
              </div>
              <div className="course-meta">
                {c.completedLessons}/{c.totalLessons} lessons · {formatMinutes(c.timeMinutes)}
                {c.category ? ` · ${c.category}` : ''}
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${c.progress}%`, background: c.color }}
                />
              </div>
            </div>
            <div className="course-pct">{c.progress}%</div>
          </div>
        );
      })}
    </div>
  );
}
