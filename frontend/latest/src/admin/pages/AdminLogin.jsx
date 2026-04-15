import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { requestAdminLoginOtp, saveAdminSession, verifyAdminLoginOtp, verifyAdminSession } from '../services/adminApi';
import './AdminAuth.css';

const initialOtpState = {
  adminId: '',
  otp: '',
};

function AdminLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState('credentials');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [otpData, setOtpData] = useState(initialOtpState);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      return;
    }

    verifyAdminSession()
      .then(() => navigate('/admin/dashboard'))
      .catch(() => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminId');
        localStorage.removeItem('adminName');
        localStorage.removeItem('adminDepartment');
      });
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const submitCredentials = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await requestAdminLoginOtp(formData);
      setOtpData({ adminId: response.adminId, otp: '' });
      setStep('otp');
      setMessage(response.debugOtp ? `Development OTP: ${response.debugOtp}` : 'OTP sent to your registered email.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await verifyAdminLoginOtp(otpData);
      saveAdminSession(response);
      navigate('/admin/dashboard');
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
          <h1>Admin Login</h1>
          <Link to="/" className="back-to-home-btn">
            ← Back
          </Link>
        </div>
        <p className="subtitle">Secure access for election control panel</p>

        {error && <div className="error-msg">{error}</div>}
        {message && <div className="success-msg">{message}</div>}

        {step === 'credentials' ? (
          <form onSubmit={submitCredentials}>
            <div className="input-field">
              <label>Email</label>
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
              <small>Must be a Gmail address (@gmail.com)</small>
            </div>

            <div className="input-field">
              <label>Password</label>
              <div className="input-group-admin">
                <Lock size={18} className="input-icon-admin" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="4-digit password"
                  maxLength="4"
                  required
                />
              </div>
              <small>Must be exactly 4 digits (e.g., 1234)</small>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>

            <div className="auth-links">
              <Link to="/admin/signup">Create admin account</Link>
              <Link to="/admin/forgot-password">Forgot password?</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={submitOtp}>
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
                  value={otpData.otp}
                  onChange={(event) => setOtpData((previous) => ({ ...previous, otp: event.target.value }))}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button type="button" className="back-btn-admin" onClick={() => setStep('credentials')}>
              ← Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AdminLogin;