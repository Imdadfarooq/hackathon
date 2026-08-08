import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { formatDate, formatMinutes } from '../utils/format.js';

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
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
      <div style={{ fontWeight: 700, marginBottom: 4 }}>
        {formatDate(label, { weekday: 'short', month: 'short', day: 'numeric' })}
      </div>
      <div>{formatMinutes(point.minutes)} studied</div>
      <div className="muted">{point.lessonsCompleted} lessons completed</div>
    </div>
  );
}

/**
 * Time-series area chart of minutes studied per day.
 */
export default function TrendChart({ data }) {
  const hasData = data.some((d) => d.minutes > 0);

  return (
    <div style={{ width: '100%', height: 260 }}>
      {!hasData ? (
        <div className="empty">No study activity in this period yet.</div>
      ) : (
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => formatDate(d)}
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              minTickGap={24}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
              width={34}
              allowDecimals={false}
            />
            <Tooltip content={<TrendTooltip />} />
            <Area
              type="monotone"
              dataKey="minutes"
              stroke="var(--primary)"
              strokeWidth={2.5}
              fill="url(#trendFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
