import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import Spinner from '../components/Spinner.jsx';
import StatCard from '../components/StatCard.jsx';
import { initials, formatMinutes, relativeTime } from '../utils/format.js';

export default function MentorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/mentor/students')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading your cohort…" />;
  if (error) return <div className="alert alert-error">{error}</div>;

  const { students, cohort } = data;

  return (
    <div>
      <h1 className="page-title">Mentor cohort</h1>
      <p className="page-subtitle">Track progress across your {cohort.studentCount} students.</p>

      <div className="grid stat-grid">
        <StatCard label="Students" value={cohort.studentCount} icon="👥" color="#6366f1" />
        <StatCard
          label="Avg progress"
          value={`${cohort.avgProgress}%`}
          hint="across cohort"
          icon="📊"
          color="#10b981"
        />
        <StatCard
          label="Lessons completed"
          value={cohort.completedLessons}
          hint="cohort total"
          icon="✅"
          color="#06b6d4"
        />
        <StatCard
          label="Time invested"
          value={`${cohort.totalTimeHours}h`}
          hint="cohort total"
          icon="⏱"
          color="#f59e0b"
        />
      </div>

      <div className="card card-pad section-gap">
        <div className="card-header">
          <div className="card-title">Students</div>
          <span className="card-subtitle">Click a student for a detailed view</span>
        </div>

        {!students.length ? (
          <div className="empty">No students are assigned to you yet.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Progress</th>
                  <th>Lessons</th>
                  <th>Time</th>
                  <th>Active courses</th>
                  <th>Last seen</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex">
                        <div className="avatar" style={{ background: s.avatarColor }}>
                          {initials(s.name)}
                        </div>
                        <div>
                          <Link to={`/mentor/students/${s.id}`} style={{ fontWeight: 600, color: 'var(--text)' }}>
                            {s.name}
                          </Link>
                          <div className="muted" style={{ fontSize: '0.8rem' }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ minWidth: 140 }}>
                      <div className="row-between" style={{ marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{s.overallProgress}%</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${s.overallProgress}%` }} />
                      </div>
                    </td>
                    <td>{s.completedLessons}</td>
                    <td>{formatMinutes(s.totalTimeMinutes)}</td>
                    <td>{s.activeCourses}</td>
                    <td className="muted">{relativeTime(s.lastLoginAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
