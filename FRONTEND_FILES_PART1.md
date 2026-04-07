# GCEK Central Frontend Implementation

## Setup Instructions

1. Run these commands in the `gcek-central` directory:
```cmd
npm create vite@latest frontend -- --template react
cd frontend
npm install aws-amplify @aws-amplify/ui-react react-router-dom axios recharts react-hot-toast lucide-react
```

2. Replace the generated files with the ones below.

3. Create a `.env` file in the frontend folder:
```
VITE_API_URL=https://your-api-gateway-id.execute-api.ap-south-1.amazonaws.com/prod
VITE_COGNITO_REGION=ap-south-1
VITE_COGNITO_USER_POOL_ID=ap-south-1_XXXXXXXXX
VITE_COGNITO_APP_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## File: index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="GCEK Central - College Management System" />
    <meta name="theme-color" content="#0F172A" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <title>GCEK Central</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

## File: src/aws-exports.js

```javascript
const awsExports = {
  Auth: {
    Cognito: {
      region: import.meta.env.VITE_COGNITO_REGION || 'ap-south-1',
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
      signUpVerificationMethod: 'code'
    }
  }
};

export default awsExports;
```

---

## File: src/main.jsx

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { Toaster } from 'react-hot-toast';
import App from './App';
import awsExports from './aws-exports';
import './App.css';

Amplify.configure(awsExports);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1E293B',
            color: '#F8FAFC',
            borderRadius: '12px',
          },
          success: {
            iconTheme: { primary: '#10B981', secondary: '#F8FAFC' }
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#F8FAFC' }
          }
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
```

---

## File: src/utils/api.js

```javascript
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error fetching auth session:', error);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## File: src/utils/gpa.js

```javascript
// GPA Scale (10-point) as per CLAUDE.md
const GRADE_SCALE = [
  { min: 90, max: 100, grade: 'O', points: 10, color: '#10B981' },
  { min: 80, max: 89, grade: 'A+', points: 9, color: '#22C55E' },
  { min: 70, max: 79, grade: 'A', points: 8, color: '#84CC16' },
  { min: 60, max: 69, grade: 'B+', points: 7, color: '#EAB308' },
  { min: 50, max: 59, grade: 'B', points: 6, color: '#F97316' },
  { min: 40, max: 49, grade: 'C', points: 5, color: '#FB923C' },
  { min: 0, max: 39, grade: 'F', points: 0, color: '#EF4444' }
];

export function calculateGrade(marks, maxMarks) {
  const percentage = (marks / maxMarks) * 100;
  
  for (const scale of GRADE_SCALE) {
    if (percentage >= scale.min && percentage <= scale.max) {
      return {
        percentage: parseFloat(percentage.toFixed(2)),
        grade: scale.grade,
        gradePoints: scale.points,
        color: scale.color
      };
    }
  }
  
  return { percentage: 0, grade: 'F', gradePoints: 0, color: '#EF4444' };
}

export function calculateCGPA(results) {
  if (!results || results.length === 0) return 0;
  
  const validResults = results.filter(r => r.gradePoints !== undefined);
  if (validResults.length === 0) return 0;
  
  const totalPoints = validResults.reduce((sum, r) => sum + r.gradePoints, 0);
  return parseFloat((totalPoints / validResults.length).toFixed(2));
}

export function calculateSGPA(semesterResults) {
  return calculateCGPA(semesterResults);
}

export function getGradeColor(grade) {
  const scale = GRADE_SCALE.find(s => s.grade === grade);
  return scale ? scale.color : '#6B7280';
}

export { GRADE_SCALE };
```

---

## File: src/hooks/useAuth.js

```javascript
import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, fetchUserAttributes, signOut as amplifySignOut, fetchAuthSession } from 'aws-amplify/auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const session = await fetchAuthSession();
      
      // Extract custom attributes from ID token claims
      const idToken = session.tokens?.idToken;
      const claims = idToken?.payload || {};
      
      setUser({
        userId: currentUser.userId,
        username: currentUser.username,
        email: attributes.email,
        name: attributes.name || attributes.email?.split('@')[0]
      });
      
      setRole(claims['custom:role'] || attributes['custom:role'] || 'student');
      setBranch(claims['custom:branch'] || attributes['custom:branch'] || null);
    } catch (error) {
      setUser(null);
      setRole(null);
      setBranch(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const signOut = useCallback(async () => {
    try {
      await amplifySignOut();
      setUser(null);
      setRole(null);
      setBranch(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  const refreshUser = useCallback(() => {
    setLoading(true);
    loadUser();
  }, [loadUser]);

  return { user, role, branch, loading, signOut, refreshUser };
}

export default useAuth;
```

---

## File: src/components/ProtectedRoute.jsx

```javascript
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Spinner from './Spinner';

function ProtectedRoute({ children, roles = [] }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <Spinner size="large" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !roles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default ProtectedRoute;
```

---

## File: src/components/Spinner.jsx

```javascript
function Spinner({ size = 'medium' }) {
  const sizeClass = `spinner spinner-${size}`;
  
  return (
    <div className={sizeClass}>
      <div className="spinner-circle"></div>
    </div>
  );
}

export default Spinner;
```

---

## File: src/components/Sidebar.jsx

```javascript
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FileText,
  Bell,
  BarChart3,
  LogOut,
  GraduationCap
} from 'lucide-react';

function Sidebar() {
  const { user, role, signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'branch_admin', 'teacher', 'student']
    },
    {
      path: '/students',
      label: 'Students',
      icon: Users,
      roles: ['admin', 'branch_admin', 'teacher']
    },
    {
      path: '/attendance',
      label: 'Attendance',
      icon: CalendarCheck,
      roles: ['admin', 'branch_admin', 'teacher', 'student']
    },
    {
      path: '/results',
      label: 'Results',
      icon: FileText,
      roles: ['admin', 'branch_admin', 'teacher', 'student']
    },
    {
      path: '/notices',
      label: 'Notices',
      icon: Bell,
      roles: ['admin', 'branch_admin', 'teacher', 'student']
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
      roles: ['admin', 'branch_admin']
    }
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <GraduationCap size={32} />
          <div className="sidebar-logo-text">
            <span className="sidebar-title">GCEK</span>
            <span className="sidebar-subtitle">Central</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name || 'User'}</span>
            <span className="sidebar-user-role">{role?.replace('_', ' ')}</span>
          </div>
        </div>
        <button className="sidebar-logout" onClick={signOut}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
```

---

## File: src/components/Navbar.jsx

```javascript
import { useAuth } from '../hooks/useAuth';
import { Bell, Search } from 'lucide-react';

function Navbar({ title }) {
  const { user } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h1 className="navbar-title">{title}</h1>
      </div>

      <div className="navbar-right">
        <div className="navbar-search">
          <Search size={18} />
          <input type="text" placeholder="Search..." />
        </div>

        <button className="navbar-notification">
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>

        <div className="navbar-user">
          <div className="navbar-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
```

---

## File: src/components/Modal.jsx

```javascript
import { useEffect } from 'react';
import { X } from 'lucide-react';

function Modal({ isOpen, onClose, title, children, size = 'medium' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal modal-${size}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
```

---

## File: src/components/EmptyState.jsx

```javascript
import { FileX } from 'lucide-react';

function EmptyState({ message = 'No data found', icon: Icon = FileX }) {
  return (
    <div className="empty-state">
      <Icon size={64} strokeWidth={1} />
      <p>{message}</p>
    </div>
  );
}

export default EmptyState;
```

---

## File: src/pages/Login.jsx

```javascript
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn } from 'aws-amplify/auth';
import toast from 'react-hot-toast';
import { GraduationCap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Spinner from '../components/Spinner';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { isSignedIn, nextStep } = await signIn({ username: email, password });
      
      if (nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        navigate('/verify-email', { state: { email } });
        return;
      }
      
      if (isSignedIn) {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.name === 'UserNotConfirmedException') {
        navigate('/verify-email', { state: { email } });
      } else if (error.name === 'NotAuthorizedException') {
        toast.error('Incorrect email or password');
      } else {
        toast.error(error.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <GraduationCap size={48} />
            </div>
            <h1>Welcome Back</h1>
            <p>Sign in to GCEK Central</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock size={18} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-footer">
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <Spinner size="small" /> : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider">
            <span>Don't have an account?</span>
          </div>

          <Link to="/register" className="btn btn-secondary btn-full">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
```

---

## File: src/pages/Register.jsx

```javascript
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from 'aws-amplify/auth';
import toast from 'react-hot-toast';
import { GraduationCap, Mail, Lock, User, Building, Eye, EyeOff } from 'lucide-react';
import Spinner from '../components/Spinner';

const BRANCHES = [
  { value: 'CS', label: 'Computer Science' },
  { value: 'EC', label: 'Electronics & Communication' },
  { value: 'ME', label: 'Mechanical Engineering' },
  { value: 'CE', label: 'Civil Engineering' },
  { value: 'EE', label: 'Electrical Engineering' }
];

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' }
];

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    branch: 'CS'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Please enter your email');
      return false;
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signUp({
        username: formData.email,
        password: formData.password,
        options: {
          userAttributes: {
            email: formData.email,
            name: formData.name,
            'custom:role': formData.role,
            'custom:branch': formData.branch
          }
        }
      });

      toast.success('Registration successful! Please verify your email.');
      navigate('/verify-email', { state: { email: formData.email } });
    } catch (error) {
      console.error('Registration error:', error);
      if (error.name === 'UsernameExistsException') {
        toast.error('An account with this email already exists');
      } else {
        toast.error(error.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card auth-card-wide">
          <div className="auth-header">
            <div className="auth-logo">
              <GraduationCap size={48} />
            </div>
            <h1>Create Account</h1>
            <p>Join GCEK Central</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <div className="input-wrapper">
                  <User size={18} />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <Mail size={18} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <div className="input-wrapper">
                  <User size={18} />
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    {ROLES.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="branch">Branch</label>
                <div className="input-wrapper">
                  <Building size={18} />
                  <select
                    id="branch"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                  >
                    {BRANCHES.map(branch => (
                      <option key={branch.value} value={branch.value}>
                        {branch.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <Lock size={18} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <Lock size={18} />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <Spinner size="small" /> : 'Create Account'}
            </button>
          </form>

          <div className="auth-divider">
            <span>Already have an account?</span>
          </div>

          <Link to="/login" className="btn btn-secondary btn-full">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
```

---

## File: src/pages/VerifyEmail.jsx

```javascript
import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import toast from 'react-hot-toast';
import { GraduationCap, Mail, ArrowLeft } from 'lucide-react';
import Spinner from '../components/Spinner';

function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
    inputRefs.current[0]?.focus();
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await confirmSignUp({ username: email, confirmationCode: verificationCode });
      toast.success('Email verified successfully!');
      navigate('/login');
    } catch (error) {
      console.error('Verification error:', error);
      if (error.name === 'CodeMismatchException') {
        toast.error('Invalid verification code');
      } else if (error.name === 'ExpiredCodeException') {
        toast.error('Code has expired. Please request a new one.');
      } else {
        toast.error(error.message || 'Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    try {
      await resendSignUpCode({ username: email });
      toast.success('New code sent to your email');
      setResendCooldown(60);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error('Resend error:', error);
      toast.error(error.message || 'Failed to resend code');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <Link to="/login" className="back-link">
            <ArrowLeft size={18} />
            <span>Back to Login</span>
          </Link>

          <div className="auth-header">
            <div className="auth-logo">
              <Mail size={48} />
            </div>
            <h1>Verify Your Email</h1>
            <p>We've sent a 6-digit code to</p>
            <p className="email-display">{email}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="otp-container">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="otp-input"
                />
              ))}
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <Spinner size="small" /> : 'Verify Email'}
            </button>
          </form>

          <div className="resend-section">
            <p>Didn't receive the code?</p>
            <button
              type="button"
              className="resend-btn"
              onClick={handleResend}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
```

---

## File: src/pages/dashboards/AdminDashboard.jsx

```javascript
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, Building, Bell, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import api from '../../utils/api';
import Spinner from '../../components/Spinner';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalBranches: 5,
    totalNotices: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load stats from API
      // For now, using placeholder data
      setStats({
        totalStudents: 1250,
        totalTeachers: 85,
        totalBranches: 5,
        totalNotices: 12
      });

      setRecentActivity([
        { id: 1, type: 'student', message: 'New student registered: John Doe', time: '2 hours ago' },
        { id: 2, type: 'attendance', message: 'Attendance marked for CS-2024', time: '3 hours ago' },
        { id: 3, type: 'result', message: 'Results uploaded for SEM-3 Mathematics', time: '5 hours ago' },
        { id: 4, type: 'notice', message: 'New notice posted: Exam Schedule', time: '1 day ago' }
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size="large" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: Users, color: '#6366F1' },
    { label: 'Total Teachers', value: stats.totalTeachers, icon: GraduationCap, color: '#10B981' },
    { label: 'Branches', value: stats.totalBranches, icon: Building, color: '#F59E0B' },
    { label: 'Active Notices', value: stats.totalNotices, icon: Bell, color: '#EF4444' }
  ];

  const quickActions = [
    { label: 'Add Student', path: '/students', icon: Users },
    { label: 'Mark Attendance', path: '/attendance', icon: TrendingUp },
    { label: 'Post Notice', path: '/notices', icon: Bell },
    { label: 'View Analytics', path: '/analytics', icon: TrendingUp }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Welcome back, Admin!</h2>
        <p>Here's what's happening at GCEK Central today.</p>
      </div>

      <div className="stat-cards">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-card-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-card-content">
              <span className="stat-card-value">{stat.value.toLocaleString()}</span>
              <span className="stat-card-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.path} className="quick-action-card">
                <action.icon size={24} />
                <span>{action.label}</span>
                <ArrowRight size={18} />
              </Link>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h3>Recent Activity</h3>
            <Link to="/analytics" className="view-all">View All</Link>
          </div>
          <div className="activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-dot"></div>
                <div className="activity-content">
                  <p>{activity.message}</p>
                  <span>{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
```

---

## File: src/pages/dashboards/TeacherDashboard.jsx

```javascript
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { CalendarCheck, FileText, Users, Clock, ArrowRight } from 'lucide-react';
import api from '../../utils/api';
import Spinner from '../../components/Spinner';

function TeacherDashboard() {
  const { user, branch } = useAuth();
  const [stats, setStats] = useState({
    todayClasses: 4,
    pendingAttendance: 2,
    studentsCount: 120,
    recentResults: 15
  });
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setTodaySchedule([
        { id: 1, subject: 'Data Structures', time: '9:00 AM - 10:00 AM', class: 'CS-2024', marked: true },
        { id: 2, subject: 'Algorithms', time: '10:00 AM - 11:00 AM', class: 'CS-2024', marked: true },
        { id: 3, subject: 'Database Systems', time: '2:00 PM - 3:00 PM', class: 'CS-2023', marked: false },
        { id: 4, subject: 'Computer Networks', time: '3:00 PM - 4:00 PM', class: 'CS-2023', marked: false }
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size="large" />
      </div>
    );
  }

  const statCards = [
    { label: "Today's Classes", value: stats.todayClasses, icon: Clock, color: '#6366F1' },
    { label: 'Pending Attendance', value: stats.pendingAttendance, icon: CalendarCheck, color: '#F59E0B' },
    { label: 'Students in Branch', value: stats.studentsCount, icon: Users, color: '#10B981' },
    { label: 'Results Entered', value: stats.recentResults, icon: FileText, color: '#8B5CF6' }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Good Morning, {user?.name?.split(' ')[0]}!</h2>
        <p>You have {stats.pendingAttendance} pending attendance to mark today.</p>
      </div>

      <div className="stat-cards">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-card-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-card-content">
              <span className="stat-card-value">{stat.value}</span>
              <span className="stat-card-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Today's Schedule</h3>
            <span className="branch-badge">{branch}</span>
          </div>
          <div className="schedule-list">
            {todaySchedule.map((item) => (
              <div key={item.id} className={`schedule-item ${item.marked ? 'completed' : ''}`}>
                <div className="schedule-time">
                  <Clock size={16} />
                  <span>{item.time}</span>
                </div>
                <div className="schedule-details">
                  <h4>{item.subject}</h4>
                  <span>{item.class}</span>
                </div>
                <div className="schedule-status">
                  {item.marked ? (
                    <span className="badge badge-success">Marked</span>
                  ) : (
                    <Link to="/attendance" className="btn btn-sm btn-primary">
                      Mark Attendance
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions-vertical">
            <Link to="/attendance" className="quick-action-card">
              <CalendarCheck size={24} />
              <div>
                <span className="action-title">Mark Attendance</span>
                <span className="action-desc">Record student attendance for today</span>
              </div>
              <ArrowRight size={18} />
            </Link>
            <Link to="/results" className="quick-action-card">
              <FileText size={24} />
              <div>
                <span className="action-title">Enter Results</span>
                <span className="action-desc">Add or update student results</span>
              </div>
              <ArrowRight size={18} />
            </Link>
            <Link to="/students" className="quick-action-card">
              <Users size={24} />
              <div>
                <span className="action-title">View Students</span>
                <span className="action-desc">Browse students in your branch</span>
              </div>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
```

---

## File: src/pages/dashboards/StudentDashboard.jsx

```javascript
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { CalendarCheck, FileText, Bell, TrendingUp } from 'lucide-react';
import { calculateCGPA, getGradeColor } from '../../utils/gpa';
import api from '../../utils/api';
import Spinner from '../../components/Spinner';

function StudentDashboard() {
  const { user, branch } = useAuth();
  const [attendanceStats, setAttendanceStats] = useState({ percentage: 85, present: 170, total: 200 });
  const [latestResults, setLatestResults] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Placeholder data
      setLatestResults([
        { subject: 'Data Structures', grade: 'A+', gradePoints: 9, marks: 85, maxMarks: 100 },
        { subject: 'Algorithms', grade: 'O', gradePoints: 10, marks: 92, maxMarks: 100 },
        { subject: 'Database Systems', grade: 'A', gradePoints: 8, marks: 78, maxMarks: 100 },
        { subject: 'Computer Networks', grade: 'B+', gradePoints: 7, marks: 65, maxMarks: 100 }
      ]);

      setNotices([
        { id: 1, title: 'End Semester Exam Schedule', priority: 'HIGH', date: '2 days ago' },
        { id: 2, title: 'Library Books Return Notice', priority: 'MEDIUM', date: '1 week ago' },
        { id: 3, title: 'Sports Day Announcement', priority: 'LOW', date: '2 weeks ago' }
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size="large" />
      </div>
    );
  }

  const cgpa = calculateCGPA(latestResults);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Hello, {user?.name?.split(' ')[0]}!</h2>
        <p>Branch: {branch} | Keep up the great work!</p>
      </div>

      <div className="dashboard-grid student-grid">
        <div className="attendance-card">
          <div className="attendance-header">
            <h3>Attendance Overview</h3>
            <Link to="/attendance" className="view-all">View Details</Link>
          </div>
          <div className="attendance-circle">
            <svg viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="12"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={attendanceStats.percentage >= 75 ? '#10B981' : '#EF4444'}
                strokeWidth="12"
                strokeDasharray={`${attendanceStats.percentage * 2.51} 251`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="attendance-percentage">
              <span className="percentage-value">{attendanceStats.percentage}%</span>
              <span className="percentage-label">Attendance</span>
            </div>
          </div>
          <div className="attendance-summary">
            <div className="summary-item">
              <span className="summary-value">{attendanceStats.present}</span>
              <span className="summary-label">Present</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{attendanceStats.total - attendanceStats.present}</span>
              <span className="summary-label">Absent</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{attendanceStats.total}</span>
              <span className="summary-label">Total</span>
            </div>
          </div>
        </div>

        <div className="results-card">
          <div className="results-header">
            <h3>Latest Results</h3>
            <div className="cgpa-badge">
              <TrendingUp size={16} />
              <span>CGPA: {cgpa}</span>
            </div>
          </div>
          <div className="results-list">
            {latestResults.map((result, index) => (
              <div key={index} className="result-item">
                <div className="result-subject">{result.subject}</div>
                <div className="result-marks">{result.marks}/{result.maxMarks}</div>
                <div 
                  className="result-grade"
                  style={{ backgroundColor: `${getGradeColor(result.grade)}20`, color: getGradeColor(result.grade) }}
                >
                  {result.grade}
                </div>
              </div>
            ))}
          </div>
          <Link to="/results" className="btn btn-secondary btn-full">
            View All Results
          </Link>
        </div>

        <div className="notices-card">
          <div className="notices-header">
            <h3>Recent Notices</h3>
            <Link to="/notices" className="view-all">View All</Link>
          </div>
          <div className="notices-list">
            {notices.map((notice) => (
              <div key={notice.id} className="notice-item">
                <div className={`notice-priority priority-${notice.priority.toLowerCase()}`}>
                  {notice.priority}
                </div>
                <div className="notice-content">
                  <h4>{notice.title}</h4>
                  <span>{notice.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
```

---

## File: src/pages/dashboards/BranchAdminDashboard.jsx

```javascript
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Users, CalendarCheck, FileText, TrendingUp, ArrowRight, Building } from 'lucide-react';
import api from '../../utils/api';
import Spinner from '../../components/Spinner';

function BranchAdminDashboard() {
  const { user, branch } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    attendanceRate: 0,
    avgCGPA: 0
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setStats({
        totalStudents: 245,
        totalTeachers: 18,
        attendanceRate: 87.5,
        avgCGPA: 7.8
      });

      setRecentStudents([
        { id: 1, name: 'Rahul Kumar', email: 'rahul@gcek.ac.in', year: '3rd Year' },
        { id: 2, name: 'Priya Sharma', email: 'priya@gcek.ac.in', year: '2nd Year' },
        { id: 3, name: 'Amit Patel', email: 'amit@gcek.ac.in', year: '4th Year' },
        { id: 4, name: 'Sneha Gupta', email: 'sneha@gcek.ac.in', year: '1st Year' }
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner size="large" />
      </div>
    );
  }

  const statCards = [
    { label: 'Students', value: stats.totalStudents, icon: Users, color: '#6366F1' },
    { label: 'Teachers', value: stats.totalTeachers, icon: Users, color: '#10B981' },
    { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, icon: CalendarCheck, color: '#F59E0B' },
    { label: 'Avg CGPA', value: stats.avgCGPA.toFixed(1), icon: TrendingUp, color: '#8B5CF6' }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-with-badge">
          <h2>Branch Admin Dashboard</h2>
          <span className="branch-badge large">
            <Building size={18} />
            {branch}
          </span>
        </div>
        <p>Managing {branch} department at GCEK Central</p>
      </div>

      <div className="stat-cards">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-card-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-card-content">
              <span className="stat-card-value">{stat.value}</span>
              <span className="stat-card-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions-vertical">
            <Link to="/students" className="quick-action-card">
              <Users size={24} />
              <div>
                <span className="action-title">Manage Students</span>
                <span className="action-desc">Add, edit or remove students</span>
              </div>
              <ArrowRight size={18} />
            </Link>
            <Link to="/attendance" className="quick-action-card">
              <CalendarCheck size={24} />
              <div>
                <span className="action-title">View Attendance</span>
                <span className="action-desc">Check attendance reports</span>
              </div>
              <ArrowRight size={18} />
            </Link>
            <Link to="/analytics" className="quick-action-card">
              <TrendingUp size={24} />
              <div>
                <span className="action-title">Analytics</span>
                <span className="action-desc">View branch performance</span>
              </div>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h3>Recent Students</h3>
            <Link to="/students" className="view-all">View All</Link>
          </div>
          <div className="students-preview">
            {recentStudents.map((student) => (
              <div key={student.id} className="student-preview-item">
                <div className="student-avatar">
                  {student.name.charAt(0)}
                </div>
                <div className="student-info">
                  <span className="student-name">{student.name}</span>
                  <span className="student-email">{student.email}</span>
                </div>
                <span className="student-year">{student.year}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BranchAdminDashboard;
```

---

## Continue in Part 2...

The remaining files (Students.jsx, Attendance.jsx, Results.jsx, Notices.jsx, Analytics.jsx, App.jsx, App.css) are extensive. Create a second file for them.
