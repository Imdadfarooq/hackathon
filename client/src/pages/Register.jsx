import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [details, setDetails] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDetails([]);
    setSubmitting(true);
    try {
      const user = await register(form);
      navigate(user.role === 'mentor' ? '/mentor' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      setDetails(err.details || []);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card card card-pad">
        <div className="auth-head">
          <h1>Create your account</h1>
          <p>Start tracking your learning journey</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
            {details.length > 0 && (
              <ul style={{ margin: '6px 0 0 18px' }}>
                {details.map((d) => (
                  <li key={d.field}>{d.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">I am a…</label>
            <div className="role-toggle">
              {['student', 'mentor'].map((r) => (
                <div
                  key={r}
                  className={`role-option ${form.role === r ? 'selected' : ''}`}
                  onClick={() => setForm((f) => ({ ...f, role: r }))}
                  role="button"
                  tabIndex={0}
                >
                  {r === 'student' ? '🎓 Student' : '🧭 Mentor'}
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="name">Full name</label>
            <input id="name" className="input" value={form.name} onChange={update('name')} required minLength={2} />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="email">Email</label>
            <input id="email" className="input" type="email" value={form.email} onChange={update('email')} required />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              value={form.password}
              onChange={update('password')}
              required
              minLength={6}
              placeholder="At least 6 characters"
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="muted mt" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
