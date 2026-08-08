import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import Spinner from './components/Spinner.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Courses from './pages/Courses.jsx';
import CourseDetail from './pages/CourseDetail.jsx';
import MentorDashboard from './pages/MentorDashboard.jsx';
import MentorStudentDetail from './pages/MentorStudentDetail.jsx';

// Sends an authenticated user to the right home based on role.
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Loading…" />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'mentor' ? '/mentor' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="student">
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* Course catalog & detail are available to students and mentors.
          Mentors use the detail page to upload/manage PDF materials. */}
      <Route
        path="/courses"
        element={
          <ProtectedRoute>
            <Layout>
              <Courses />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <CourseDetail />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/mentor"
        element={
          <ProtectedRoute role="mentor">
            <Layout>
              <MentorDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/mentor/students/:studentId"
        element={
          <ProtectedRoute role="mentor">
            <Layout>
              <MentorStudentDetail />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
