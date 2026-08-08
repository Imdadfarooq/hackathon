import { useEffect, useState, useCallback } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/Spinner.jsx';
import StatCard from '../components/StatCard.jsx';
import TrendChart from '../components/TrendChart.jsx';
import DistributionChart from '../components/DistributionChart.jsx';
import CourseProgressList from '../components/CourseProgressList.jsx';
import Recommendations from '../components/Recommendations.jsx';
import ActivityFeed from '../components/ActivityFeed.jsx';
import { formatMinutes } from '../utils/format.js';

const RANGES = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [courses, setCourses] = useState([]);
  const [series, setSeries] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [activities, setActivities] = useState([]);
  const [range, setRange] = useState(30);
  const [distMode, setDistMode] = useState('time');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, cp, ts, distTime, distStatus, rec, act] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/course-progress'),
        api.get(`/dashboard/time-series?days=${range}`),
        api.get('/dashboard/distribution?by=time'),
        api.get('/dashboard/distribution?by=status'),
        api.get('/recommendations?limit=5'),
        api.get('/activities?limit=8'),
      ]);
      setSummary(s.data);
      setCourses(cp.data.courses);
      setSeries(ts.data.series);
      setDistribution(distTime.data.data);
      setStatusDistribution(distStatus.data.data);
      setRecommendations(rec.data);
      setActivities(act.data.activities);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Reload just the time-series when the range changes (after first load).
  const changeRange = async (value) => {
    setRange(value);
    try {
      const ts = await api.get(`/dashboard/time-series?days=${value}`);
      setSeries(ts.data.series);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExport = async (type) => {
    try {
      const res = await api.get(`/dashboard/export?type=${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'timeseries' ? 'time-series.csv' : 'course-progress.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Spinner label="Loading your dashboard…" />;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 22 }}>
        <div>
          <h1 className="page-title">Hi, {user.name.split(' ')[0]} 👋</h1>
          <p className="muted">Here&apos;s how your learning is going.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => handleExport('progress')}>
          ⬇ Export progress (CSV)
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid stat-grid">
        <StatCard
          label="Overall progress"
          value={`${summary.overallProgress}%`}
          hint={`${summary.completedLessons} lessons completed`}
          icon="📈"
          color="#6366f1"
        />
        <StatCard
          label="Time invested"
          value={formatMinutes(summary.totalTimeMinutes)}
          hint={`across ${summary.totalCourses} courses`}
          icon="⏱"
          color="#06b6d4"
        />
        <StatCard
          label="Active courses"
          value={summary.activeCourses}
          hint={`${summary.completedCourses} completed`}
          icon="📚"
          color="#10b981"
        />
        <StatCard
          label="Active days"
          value={summary.activeDays}
          hint="days with activity"
          icon="🔥"
          color="#f59e0b"
        />
      </div>

      {/* Charts */}
      <div className="grid two-col section-gap">
        <div className="card card-pad">
          <div className="card-header">
            <div>
              <div className="card-title">Study trend</div>
              <div className="card-subtitle">Minutes studied per day</div>
            </div>
            <div className="flex gap-sm">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  className={`btn btn-sm ${range === r.value ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => changeRange(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <TrendChart data={series} />
        </div>

        <div className="card card-pad">
          <div className="card-header">
            <div>
              <div className="card-title">Distribution</div>
              <div className="card-subtitle">
                {distMode === 'time' ? 'Time spent by course' : 'Courses by status'}
              </div>
            </div>
            <div className="flex gap-sm">
              <button
                className={`btn btn-sm ${distMode === 'time' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setDistMode('time')}
              >
                Time
              </button>
              <button
                className={`btn btn-sm ${distMode === 'status' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setDistMode('status')}
              >
                Status
              </button>
            </div>
          </div>
          <DistributionChart
            data={distMode === 'time' ? distribution : statusDistribution}
            mode={distMode}
          />
        </div>
      </div>

      {/* Recommendations */}
      <div className="section-gap">
        <Recommendations data={recommendations} />
      </div>

      {/* Course progress + activity feed */}
      <div className="grid two-col section-gap">
        <div className="card card-pad">
          <div className="card-header">
            <div className="card-title">Course progress</div>
            <span className="card-subtitle">{courses.length} enrolled</span>
          </div>
          <CourseProgressList courses={courses} />
        </div>

        <div className="card card-pad">
          <div className="card-header">
            <div className="card-title">Recent activity</div>
          </div>
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}
