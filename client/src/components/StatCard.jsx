export default function StatCard({ label, value, hint, icon, color = 'var(--primary)' }) {
  return (
    <div className="card stat">
      <div
        className="stat-icon"
        style={{ background: `${color}1f`, color }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}
