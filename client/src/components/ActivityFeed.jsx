import { EVENT_LABELS, EVENT_ICONS, relativeTime } from '../utils/format.js';

const ICON_COLORS = {
  lesson_completed: 'var(--success)',
  quiz_passed: 'var(--warning)',
  quiz_attempt: 'var(--info)',
  lesson_started: 'var(--primary)',
  login: 'var(--text-muted)',
  video_watched: 'var(--info)',
};

export default function ActivityFeed({ activities }) {
  if (!activities.length) {
    return <div className="empty">No recent activity.</div>;
  }
  return (
    <div>
      {activities.map((a) => {
        const color = ICON_COLORS[a.type] || 'var(--primary)';
        return (
          <div className="feed-item" key={a.id}>
            <div
              className="feed-icon"
              style={{ background: `${color}1f`, color }}
              aria-hidden="true"
            >
              {EVENT_ICONS[a.type] || '•'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{EVENT_LABELS[a.type] || a.type}</div>
              <div className="muted" style={{ fontSize: '0.82rem' }}>
                {a.lesson ? a.lesson.title : a.course ? a.course.title : '—'}
                {a.score != null ? ` · ${a.score}%` : ''}
              </div>
            </div>
            <span className="feed-time">{relativeTime(a.occurredAt)}</span>
          </div>
        );
      })}
    </div>
  );
}
