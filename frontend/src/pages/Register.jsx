import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from 'aws-amplify/auth';
import { toast } from 'react-hot-toast';
import { GraduationCap, Mail, Lock, User, Building2, Phone, Eye, EyeOff } from 'lucide-react';
import Spinner from '../components/Spinner';

const BRANCHES = ['CS', 'EC', 'ME', 'CE', 'EE'];
const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'branch_admin', label: 'Branch Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
];

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim();

function generateAliasUsername(email) {
  const localPart = String(email || '')
    .split('@')[0]
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
  const safeLocal = (localPart || 'user').slice(0, 18);
  const randomPart = Math.random().toString(36).slice(2, 8);
  const timePart = Date.now().toString(36);
  return `${safeLocal}_${timePart}_${randomPart}`;
}

async function checkEmailAvailability(email) {
  if (!API_BASE_URL) {
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
  } catch (error) {
    console.warn('Could not check email availability:', error);
    return null;
  }
}

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    branch: 'CS',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function validate() {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    else if (!/^\+?[1-9]\d{9,14}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Enter valid phone (e.g., +919876543210)';
    }
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      const emailStatus = await checkEmailAvailability(normalizedEmail);

      if (emailStatus?.hasConfirmed) {
        toast.error('This email is already registered. Please sign in with existing password.');
        navigate('/login');
        return;
      }

      if (emailStatus?.hasUnconfirmed) {
        localStorage.setItem('pendingVerifyEmail', normalizedEmail);
        localStorage.setItem('pendingVerifyUsername', normalizedEmail);
        localStorage.setItem('pendingUserRole', formData.role);
        localStorage.setItem('pendingUserBranch', formData.branch);
        toast('Account exists but is not verified. Please complete verification.');
        navigate('/verify-email', { state: { email: normalizedEmail, username: normalizedEmail } });
        return;
      }

      const username = generateAliasUsername(normalizedEmail);

      // Persist pending signup identity for email verification page resilience.
      localStorage.setItem('pendingVerifyEmail', normalizedEmail);
      localStorage.setItem('pendingVerifyUsername', username);
      
      // Store role and branch in localStorage until Cognito custom attributes are configured
      localStorage.setItem('pendingUserRole', formData.role);
      localStorage.setItem('pendingUserBranch', formData.branch);
      
      // Format phone number with country code if not present
      let phoneNumber = formData.phone.replace(/\s/g, '');
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+91' + phoneNumber; // Default to India
      }
      
      const signUpPayload = {
        username: username,
        password: formData.password,
        options: {
          userAttributes: {
            email: normalizedEmail,
            name: formData.name,
            phone_number: phoneNumber,
            'custom:role': formData.role,
            'custom:branch': formData.branch,
          },
        },
      };

      try {
        await signUp(signUpPayload);
      } catch (signUpError) {
        // Backward compatibility: retry without custom attributes if pool schema doesn't support them.
        const fallbackNeeded =
          signUpError?.name === 'InvalidParameterException' &&
          String(signUpError?.message || '').toLowerCase().includes('custom:');

        if (!fallbackNeeded) {
          throw signUpError;
        }

        console.warn('Custom attributes are unavailable in this User Pool. Retrying signup without custom role/branch.');
        await signUp({
          ...signUpPayload,
          options: {
            ...signUpPayload.options,
            userAttributes: {
              email: normalizedEmail,
              name: formData.name,
              phone_number: phoneNumber,
            },
          },
        });
      }

      toast.success('Account created! Please verify your email.');
      navigate('/verify-email', { state: { email: normalizedEmail, username } });
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      if (error.name === 'UsernameExistsException') {
        toast.error('An account with this email already exists');
      } else if (error.message?.includes('SECRET_HASH')) {
        toast.error('App Client has a secret. Create a new client WITHOUT secret in Cognito Console.');
      } else if (error.message?.includes('phone')) {
        toast.error('Invalid phone number format. Use +91XXXXXXXXXX');
      } else {
        toast.error(error.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <div className="auth-header">
          <div className="auth-logo">
            <GraduationCap size={48} />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join GCEK Central today</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-wrapper">
                <User size={20} className="input-icon" />
                <input
                  type="text"
                  name="name"
                  className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-wrapper">
                <Mail size={20} className="input-icon" />
                <input
                  type="email"
                  name="email"
                  className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <div className="input-wrapper">
              <Phone size={20} className="input-icon" />
              <input
                type="tel"
                name="phone"
                className={`form-input ${errors.phone ? 'form-input--error' : ''}`}
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            {errors.phone && <span className="form-error">{errors.phone}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock size={20} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className={`form-input form-input--with-toggle ${errors.password ? 'form-input--error' : ''}`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
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

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={20} className="input-icon" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className={`form-input form-input--with-toggle ${errors.confirmPassword ? 'form-input--error' : ''}`}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Role</label>
              <div className="input-wrapper">
                <User size={20} className="input-icon" />
                <select
                  name="role"
                  className="form-select"
                  value={formData.role}
                  onChange={handleChange}
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
                  name="branch"
                  className="form-select"
                  value={formData.branch}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? <Spinner size="small" /> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
