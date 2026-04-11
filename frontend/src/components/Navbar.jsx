import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/users': 'User Access',
  '/students': 'Students',
  '/attendance': 'Attendance',
  '/results': 'Results',
  '/notices': 'Notices',
  '/analytics': 'Analytics',
  '/chat': 'Chat Assistant',
};

function Navbar({ onToggleSidebar = () => {} }) {
  const { user } = useAuth();
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <header className="navbar">
      <div className="navbar__left">
        <button
          type="button"
          className="navbar__menu-toggle"
          onClick={onToggleSidebar}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="navbar__title">{title}</h1>
      </div>
      <div className="navbar__right">
        <div className="navbar__user">
          <span className="navbar__user-name">{user?.name || 'User'}</span>
          <div className="navbar__avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
