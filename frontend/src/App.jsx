import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Spinner from './components/Spinner';

// Landing page
import Landing from './pages/Landing';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';

// Dashboards
import AdminDashboard from './pages/dashboards/AdminDashboard';
import TeacherDashboard from './pages/dashboards/TeacherDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import BranchAdminDashboard from './pages/dashboards/BranchAdminDashboard';

// Main pages
import Users from './pages/Users';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Results from './pages/Results';
import Notices from './pages/Notices';
import Analytics from './pages/Analytics';

function DashboardLayout({ children }) {
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="layout">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      {isSidebarOpen && (
        <button
          type="button"
          className="layout__overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation menu"
        />
      )}
      <div className="layout__main">
        <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="layout__content">{children}</main>
      </div>
    </div>
  );
}

function Dashboard() {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <Spinner size="large" />
      </div>
    );
  }

  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'branch_admin':
      return <BranchAdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
    default:
      return <StudentDashboard />;
  }
}

function Unauthorized() {
  return (
    <div className="error-page">
      <h1>403</h1>
      <p>You don't have permission to access this page.</p>
      <a href="/dashboard" className="btn btn--primary">Go to Dashboard</a>
    </div>
  );
}

function NotFound() {
  return (
    <div className="error-page">
      <h1>404</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/dashboard" className="btn btn--primary">Go to Dashboard</a>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Landing page */}
      <Route path="/" element={<Landing />} />

      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <Users />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/students"
        element={
          <ProtectedRoute allowedRoles={['admin', 'branch_admin']}>
            <DashboardLayout>
              <Students />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/attendance"
        element={
          <ProtectedRoute allowedRoles={['admin', 'branch_admin', 'teacher', 'student']}>
            <DashboardLayout>
              <Attendance />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/results"
        element={
          <ProtectedRoute allowedRoles={['admin', 'branch_admin', 'teacher', 'student']}>
            <DashboardLayout>
              <Results />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/notices"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Notices />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute allowedRoles={['admin', 'branch_admin']}>
            <DashboardLayout>
              <Analytics />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Error pages */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
