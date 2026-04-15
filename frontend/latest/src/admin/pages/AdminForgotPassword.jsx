import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Lock, Mail } from 'lucide-react';
import { requestAdminPasswordResetOtp, resetAdminPassword, verifyAdminPasswordResetOtp } from '../services/adminApi';
import './AdminAuth.css';

function AdminForgotPassword() {
  const [step, setStep] = useState('email');
  const [formData, setFormData] = useState({ email: '', otp: '', newPassword: '' });
  const [resetToken, setResetToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const sendOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await requestAdminPasswordResetOtp({ email: formData.email });
      setStep('otp');
      setMessage(response.debugOtp ? `Development OTP: ${response.debugOtp}` : response.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await verifyAdminPasswordResetOtp({ email: formData.email, otp: formData.otp });
      setResetToken(response.resetToken);
      setStep('reset');
      setMessage('OTP verified. You can set a new password now.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await resetAdminPassword({ resetToken, newPassword: formData.newPassword });
      setMessage(response.message || 'Password reset successfully');
      setStep('done');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-container">
      <div className="admin-auth-box">
        <div className="admin-auth-title-row">
          <h1>Forgot Password</h1>
          <Link to="/" className="back-to-home-btn">
            ← Back
          </Link>
        </div>
        <p className="subtitle">Reset your admin password</p>

        {error && <div className="error-msg">{error}</div>}
        {message && <div className="success-msg">{message}</div>}

        {step === 'email' && (
          <form onSubmit={sendOtp}>
            <div className="input-field">
              <label>Registered Email</label>
              <div className="input-group-admin">
                <Mail size={18} className="input-icon-admin" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@gmail.com"
                  required
                />
              </div>
              <small>Enter your registered Gmail address</small>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <div className="signin-link">
              <Link to="/admin/login">← Back to login</Link>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={verifyOtp}>
            <p className="admin-step-hint">
              Enter the OTP sent to your email
            </p>

            <div className="input-field">
              <label>OTP</label>
              <div className="input-group-admin">
                <KeyRound size={18} className="input-icon-admin" />
                <input
                  id="otp"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button type="button" className="back-btn-admin" onClick={() => setStep('email')}>
              ← Back
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={updatePassword}>
            <div className="input-field">
              <label>New Password</label>
              <div className="input-group-admin">
                <Lock size={18} className="input-icon-admin" />
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="4 digits only"
                  maxLength="4"
                  required
                />
              </div>
              <small>Must be exactly 4 digits (e.g., 1234)</small>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="admin-done-block">
            <p className="admin-done-text">Password reset successfully!</p>
            <Link to="/admin/login" className="login-btn admin-inline-btn">
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminForgotPassword;