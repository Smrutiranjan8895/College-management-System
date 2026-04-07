import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import { toast } from 'react-hot-toast';
import { GraduationCap, Mail } from 'lucide-react';
import Spinner from '../components/Spinner';

function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateEmail = location.state?.email || '';
  const stateUsername = location.state?.username || '';
  const email = stateEmail || localStorage.getItem('pendingVerifyEmail') || '';
  const username = stateUsername || localStorage.getItem('pendingVerifyUsername') || email;
  
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
    if (stateEmail) {
      localStorage.setItem('pendingVerifyEmail', stateEmail);
    }
    if (stateUsername) {
      localStorage.setItem('pendingVerifyUsername', stateUsername);
    }
  }, [stateEmail, stateUsername]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  function handleChange(index, value) {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    
    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      toast.error('Please enter the complete verification code');
      return;
    }

    setLoading(true);
    try {
      await confirmSignUp({ username: username, confirmationCode: verificationCode });
      localStorage.removeItem('pendingVerifyEmail');
      localStorage.removeItem('pendingVerifyUsername');
      toast.success('Email verified successfully!');
      navigate('/login');
    } catch (error) {
      console.error('Verification error:', error);
      if (error.name === 'CodeMismatchException') {
        toast.error('Invalid verification code');
      } else if (error.name === 'ExpiredCodeException') {
        toast.error('Code expired. Please request a new one.');
      } else {
        toast.error(error.message || 'Verification failed');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;

    if (!username) {
      toast.error('Signup session not found. Please register again.');
      navigate('/register');
      return;
    }
    
    try {
      await resendSignUpCode({ username: username });
      toast.success('Verification code sent!');
      setResendCooldown(60);
    } catch (error) {
      console.error('Resend error:', error);
      toast.error(error.message || 'Failed to resend code');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <GraduationCap size={48} />
          </div>
          <h1 className="auth-title">Verify Your Email</h1>
          <p className="auth-subtitle">
            We sent a verification code to<br />
            <strong>{email}</strong>
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="otp-container" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                className="otp-input"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                maxLength={1}
              />
            ))}
          </div>

          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? <Spinner size="small" /> : 'Verify Email'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Didn't receive the code?{' '}
            <button
              type="button"
              className="auth-link-btn"
              onClick={handleResend}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
