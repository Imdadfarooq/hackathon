import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { initials } from '../utils/format.js';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  const isMentor = user.role === 'mentor';
  const home = isMentor ? '/mentor' : '/dashboard';

  const navLinks = isMentor ? (
    <>
      <NavLink to="/mentor">Cohort</NavLink>
      <NavLink to="/courses">Content</NavLink>
    </>
  ) : (
    <>
      <NavLink to="/dashboard">Dashboard</NavLink>
      <NavLink to="/courses">Courses</NavLink>
    </>
  );

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to={home} className="brand">
          <span className="brand-mark">P</span>
          <span>ProgressBoard</span>
        </Link>

        {/* Desktop navigation */}
        <div className="nav-links nav-desktop">{navLinks}</div>

        <div className="nav-spacer" />

        {/* Desktop user area */}
        <div className="nav-user nav-desktop">
          <span className="chip">{isMentor ? 'Mentor' : 'Student'}</span>
          <div className="avatar" style={{ background: user.avatarColor || 'var(--primary)' }}>
            {initials(user.name)}
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            Sign out
          </button>
        </div>

        {/* Mobile hamburger toggle */}
        <button
          className={`nav-toggle nav-mobile ${menuOpen ? 'is-open' : ''}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile dropdown panel */}
      <div className={`nav-panel nav-mobile ${menuOpen ? 'open' : ''}`}>
        <div className="nav-panel-user">
          <div className="avatar" style={{ background: user.avatarColor || 'var(--primary)' }}>
            {initials(user.name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700 }}>{user.name}</div>
            <div className="muted" style={{ fontSize: '0.8rem' }}>
              {user.email} · {isMentor ? 'Mentor' : 'Student'}
            </div>
          </div>
        </div>
        <div className="nav-panel-links">{navLinks}</div>
        <button className="btn btn-outline btn-block" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </nav>
  );
}
