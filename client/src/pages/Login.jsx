import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const DEMO_ACCOUNTS = [
  { label: 'Student demo', email: 'student@demo.io' },
  { label: 'Mentor demo', email: 'mentor@demo.io' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectByRole = (user) => {
    const dest = location.state?.from?.pathname;
    if (dest) return navigate(dest, { replace: true });
    return navigate(user.role === 'mentor' ? '/mentor' : '/dashboard', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      redirectByRole(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123');
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card card card-pad">
        <div className="auth-head">
          <h1>Welcome back</h1>
          <p>Sign in to ProgressBoard</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt" style={{ textAlign: 'center' }}>
          <span className="muted" style={{ fontSize: '0.85rem' }}>Try a demo account:</span>
          <div className="flex" style={{ justifyContent: 'center', marginTop: 8 }}>
            {DEMO_ACCOUNTS.map((d) => (
              <button
                key={d.email}
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fillDemo(d.email)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <p className="muted mt" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
          No account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
