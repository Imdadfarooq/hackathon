import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client.js';
import Spinner from '../components/Spinner.jsx';
import StatCard from '../components/StatCard.jsx';
import TrendChart from '../components/TrendChart.jsx';
import DistributionChart from '../components/DistributionChart.jsx';
import CourseProgressList from '../components/CourseProgressList.jsx';
import { initials, formatMinutes } from '../utils/format.js';

export default function MentorStudentDetail() {
  const { studentId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/mentor/students/${studentId}?days=30`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  const handleExport = async () => {
    try {
      const res = await api.get(`/mentor/students/${studentId}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.student.name.replace(/\s+/g, '-').toLowerCase()}-progress.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Spinner label="Loading student…" />;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return null;

  const { student, summary, courses, timeSeries, distribution } = data;

  return (
    <div>
      <Link to="/mentor" className="muted" style={{ fontSize: '0.9rem' }}>
        ← Back to cohort
      </Link>

      <div className="row-between mt" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="flex">
          <div className="avatar" style={{ background: student.avatarColor, width: 46, height: 46, fontSize: '1.1rem' }}>
            {initials(student.name)}
          </div>
          <div>
            <h1 className="page-title" style={{ marginBottom: 0 }}>{student.name}</h1>
            <span className="muted">{student.email}</span>
          </div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={handleExport}>
          ⬇ Export CSV
        </button>
      </div>

      <div className="grid stat-grid section-gap">
        <StatCard label="Overall progress" value={`${summary.overallProgress}%`} icon="📈" color="#6366f1" />
        <StatCard label="Time invested" value={formatMinutes(summary.totalTimeMinutes)} icon="⏱" color="#06b6d4" />
        <StatCard label="Lessons done" value={summary.completedLessons} icon="✅" color="#10b981" />
        <StatCard label="Active days" value={summary.activeDays} icon="🔥" color="#f59e0b" />
      </div>

      <div className="grid two-col section-gap">
        <div className="card card-pad">
          <div className="card-header">
            <div className="card-title">Study trend (30d)</div>
          </div>
          <TrendChart data={timeSeries} />
        </div>
        <div className="card card-pad">
          <div className="card-header">
            <div className="card-title">Time by course</div>
          </div>
          <DistributionChart data={distribution} mode="time" />
        </div>
      </div>

      <div className="card card-pad section-gap">
        <div className="card-header">
          <div className="card-title">Course progress</div>
          <span className="card-subtitle">{courses.length} enrolled</span>
        </div>
        <CourseProgressList courses={courses} linkable={false} />
      </div>
    </div>
  );
}
