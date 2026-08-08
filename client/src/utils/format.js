// Formatting helpers shared across the UI.

export function formatMinutes(min) {
  if (!min) return '0m';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatDate(iso, opts = { month: 'short', day: 'numeric' }) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, opts);
}

export function relativeTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export function initials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Human-friendly labels for activity event types.
export const EVENT_LABELS = {
  lesson_started: 'Started a lesson',
  lesson_completed: 'Completed a lesson',
  quiz_attempt: 'Attempted a quiz',
  quiz_passed: 'Passed a quiz',
  video_watched: 'Watched a video',
  login: 'Logged in',
};

export const EVENT_ICONS = {
  lesson_started: '▶',
  lesson_completed: '✓',
  quiz_attempt: '✎',
  quiz_passed: '★',
  video_watched: '🎬',
  login: '→',
};
