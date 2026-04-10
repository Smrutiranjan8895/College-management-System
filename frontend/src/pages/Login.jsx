import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn, signOut as amplifySignOut } from 'aws-amplify/auth';
import { toast } from 'react-hot-toast';
import { GraduationCap, Mail, Lock, Eye, EyeOff, User, Building2 } from 'lucide-react';
import Spinner from '../components/Spinner';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'branch_admin', label: 'Branch Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
];

const BRANCHES = ['CS', 'EC', 'ME', 'CE', 'EE', 'ALL'];
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim();

function normalizeRoleSelection(value) {
  const candidate = (value || '').toString().trim().toLowerCase();
  return ROLES.some((role) => role.value === candidate) ? candidate : 'student';
}

function normalizeBranchSelection(value, role) {
  if (role === 'admin') {
    return 'ALL';
  }

  const candidate = (value || '').toString().trim().toUpperCase();
  return BRANCHES.includes(candidate) && candidate !== 'ALL' ? candidate : 'CS';
}

async function checkEmailStatus(email) {
  if (!API_BASE_URL || !email) {
    return null;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/users/check-email?email=${encodeURIComponent(email)}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return payload?.data || null;
  } catch {
    return null;
  }
}

function Login() {
  const navigate = useNavigate();
  const pendingRoleFromStorage = normalizeRoleSelection(localStorage.getItem('pendingUserRole'));
  const pendingBranchFromStorage = normalizeBranchSelection(
    localStorage.getItem('pendingUserBranch'),
    pendingRoleFromStorage
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(pendingRoleFromStorage);
  const [selectedBranch, setSelectedBranch] = useState(pendingBranchFromStorage);

  useEffect(() => {
    const pendingEmail = (localStorage.getItem('pendingVerifyEmail') || '').trim();
    if (pendingEmail && !email) {
      setEmail(pendingEmail);
    }
  }, [email]);

  useEffect(() => {
    if (selectedRole === 'admin' && selectedBranch !== 'ALL') {
      setSelectedBranch('ALL');
      return;
    }

    if (selectedRole !== 'admin' && selectedBranch === 'ALL') {
      setSelectedBranch('CS');
    }
  }, [selectedRole, selectedBranch]);

  function validate() {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function signInWithRecovery(username, password) {
    try {
      return await signIn({ username, password });
    } catch (error) {
      if (error.name === 'UserAlreadyAuthenticatedException') {
        try {
          await amplifySignOut();
        } catch {
          // Ignore cleanup failure and retry sign-in once.
        }
        return await signIn({ username, password });
      }
      throw error;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const normalizedRole = normalizeRoleSelection(selectedRole);
      const normalizedBranch = normalizeBranchSelection(selectedBranch, normalizedRole);

      localStorage.setItem('pendingUserRole', normalizedRole);
      localStorage.setItem('pendingUserBranch', normalizedBranch);

      const { isSignedIn, nextStep } = await signInWithRecovery(email, password);
      
      if (nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        navigate('/verify-email', { state: { email } });
        return;
      }
      
      if (isSignedIn) {
        localStorage.removeItem('pendingVerifyEmail');
        localStorage.removeItem('pendingVerifyUsername');
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      if (error.name === 'UserNotConfirmedException') {
        toast.error('Please verify your email first');
        navigate('/verify-email', { state: { email } });
      } else if (error.name === 'UserAlreadyAuthenticatedException') {
        toast.error('Session conflict detected. Please try signing in again.');
      } else if (error.name === 'NotAuthorizedException') {
        const normalizedEmail = email.trim().toLowerCase();
        const emailStatus = await checkEmailStatus(normalizedEmail);

        if (emailStatus?.hasConfirmed && emailStatus?.hasUnconfirmed) {
          toast.error('This email already has a confirmed account. Use that password or use a new email for a new role signup.');
        } else if (emailStatus?.hasConfirmed) {
          toast.error('This email is already registered. Please check the existing account password.');
        } else {
          toast.error('Incorrect email or password');
        }
      } else if (error.message?.includes('SECRET_HASH')) {
        toast.error('App Client has a secret. Create a new client WITHOUT secret in Cognito Console.');
      } else if (error.name === 'UserNotFoundException') {
        toast.error('No account found with this email');
      } else {
        toast.error(error.message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <GraduationCap size={48} />
          </div>
          <h1 className="auth-title">Welcome to GCEK Central</h1>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrapper">
              <Mail size={20} className="input-icon" />
              <input
                type="email"
                className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-input form-input--with-toggle ${errors.password ? 'form-input--error' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Login As</label>
              <div className="input-wrapper">
                <User size={20} className="input-icon" />
                <select
                  className="form-select"
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value)}
                  disabled={loading}
                >
                  {ROLES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Branch</label>
              <div className="input-wrapper">
                <Building2 size={20} className="input-icon" />
                <select
                  className="form-select"
                  value={selectedBranch}
                  onChange={(event) => setSelectedBranch(event.target.value)}
                  disabled={loading || selectedRole === 'admin'}
                >
                  {BRANCHES.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <p className="form-error" style={{ marginTop: '-0.5rem' }}>
            Role and branch are applied automatically only when an account has no role assigned yet.
          </p>

          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? <Spinner size="small" /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
