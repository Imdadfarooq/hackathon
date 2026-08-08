import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { formatMinutes } from '../utils/format.js';

const STATUS_COLORS = {
  active: '#6366f1',
  completed: '#10b981',
  paused: '#f59e0b',
};

/**
 * Donut chart. In "time" mode shows minutes per course; in "status" mode
 * shows enrollment status distribution.
 */
export default function DistributionChart({ data, mode = 'time' }) {
  const chartData =
    mode === 'time'
      ? data.map((d) => ({
          name: d.title,
          value: d.minutes,
          color: d.color || '#6366f1',
        }))
      : data
          .filter((d) => d.count > 0)
          .map((d) => ({
            name: d.status,
            value: d.count,
            color: STATUS_COLORS[d.status] || '#94a3b8',
          }));

  const total = chartData.reduce((s, d) => s + d.value, 0);

  if (!total) {
    return <div className="empty">No data to visualize yet.</div>;
  }

  const renderTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const p = payload[0].payload;
    const pct = Math.round((p.value / total) * 100);
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '8px 12px',
          boxShadow: 'var(--shadow-md)',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{p.name}</div>
        <div className="muted">
          {mode === 'time' ? formatMinutes(p.value) : `${p.value} course${p.value > 1 ? 's' : ''}`}{' '}
          · {pct}%
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={2}
            stroke="var(--surface)"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={renderTooltip} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{ fontSize: '0.8rem', textTransform: 'capitalize' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
