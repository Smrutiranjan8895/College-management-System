import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCog,
  Users,
  CalendarCheck,
  FileText,
  Bell,
  BarChart3,
  MessageSquare,
  LogOut,
  GraduationCap,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';

const navItems = {
  admin: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/users', label: 'User Access', icon: UserCog },
    { path: '/students', label: 'Students', icon: Users },
    { path: '/attendance', label: 'Attendance', icon: CalendarCheck },
    { path: '/results', label: 'Results', icon: FileText },
    { path: '/notices', label: 'Notices', icon: Bell },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/chat', label: 'Chat Assistant', icon: MessageSquare },
  ],
  branch_admin: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/students', label: 'Students', icon: Users },
    { path: '/attendance', label: 'Attendance', icon: CalendarCheck },
    { path: '/results', label: 'Results', icon: FileText },
    { path: '/notices', label: 'Notices', icon: Bell },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/chat', label: 'Chat Assistant', icon: MessageSquare },
  ],
  teacher: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/attendance', label: 'Attendance', icon: CalendarCheck },
    { path: '/results', label: 'Results', icon: FileText },
    { path: '/notices', label: 'Notices', icon: Bell },
    { path: '/chat', label: 'Chat Assistant', icon: MessageSquare },
  ],
  student: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/attendance', label: 'My Attendance', icon: CalendarCheck },
    { path: '/results', label: 'My Results', icon: FileText },
    { path: '/notices', label: 'Notices', icon: Bell },
    { path: '/chat', label: 'Chat Assistant', icon: MessageSquare },
  ],
};

function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { user, role, branch, signOut } = useAuth();
  const items = navItems[role] || navItems.student;

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <GraduationCap size={32} />
          <div className="sidebar__brand">
            <span className="sidebar__title">GCEK Central</span>
            <span className="sidebar__subtitle">College Management</span>
          </div>
        </div>
      </div>

      <nav className="sidebar__nav">
        {items.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
            onClick={onClose}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="sidebar__user-info">
            <span className="sidebar__user-name">{user?.name || 'User'}</span>
            <span className="sidebar__user-role">
              {role?.replace('_', ' ')} {branch && `• ${branch}`}
            </span>
          </div>
        </div>
        <button
          className="sidebar__logout"
          onClick={() => {
            onClose();
            signOut();
          }}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
