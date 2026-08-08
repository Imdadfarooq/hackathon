import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { initials } from '../utils/format.js';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  const isMentor = user.role === 'mentor';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to={isMentor ? '/mentor' : '/dashboard'} className="brand">
          <span className="brand-mark">P</span>
          <span>ProgressBoard</span>
        </Link>

        <div className="nav-links">
          {isMentor ? (
            <NavLink to="/mentor">Cohort</NavLink>
          ) : (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/courses">Courses</NavLink>
            </>
          )}
        </div>

        <div className="nav-spacer" />

        <div className="nav-user">
          <span className="chip">{isMentor ? 'Mentor' : 'Student'}</span>
          <div className="avatar" style={{ background: user.avatarColor || 'var(--primary)' }}>
            {initials(user.name)}
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
