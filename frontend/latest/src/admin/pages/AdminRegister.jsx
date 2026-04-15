import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, UserRound } from 'lucide-react';
import { registerAdmin } from '../services/adminApi';
import './AdminAuth.css';

const departments = ['CSE', 'MDS', 'ECE', 'EE', 'ME', 'CE', 'CHE', 'MME', 'Architecture', 'Planning', 'Management'];

function AdminRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', department: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({}); // Field-level errors
  const [loading, setLoading] = useState(false);

  const validateForm = (data = formData) => {
    const newErrors = {};

    if (!data.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!data.department) {
      newErrors.department = 'Department is required';
    }

    if (!data.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!data.email.endsWith('@gmail.com')) {
      newErrors.email = 'Email must end with @gmail.com';
    }

    if (!data.password) {
      newErrors.password = 'Password is required';
    } else if (!/^\d{4}$/.test(data.password)) {
      newErrors.password = 'Password must be exactly 4 digits (e.g., 1234)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);
    validateForm(updatedData); // Real-time validation
    setError(''); // Clear API errors when user types
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Sending admin registration:', formData);
      const response = await registerAdmin(formData);
      console.log('✅ Registration response:', response);
      setMessage(response.message || 'Admin registered successfully! Redirecting to login...');
      setTimeout(() => navigate('/admin/login'), 1500);
    } catch (requestError) {
      console.error('❌ Registration error:', requestError);
      setError(requestError.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-container">
      <div className="admin-auth-box">
        <div className="admin-auth-title-row">
          <h1>Admin Registration</h1>
          <Link to="/" className="back-to-home-btn">
            ← Back
          </Link>
        </div>
        <p className="subtitle">Create your admin account</p>

        {error && <div className="error-msg">{error}</div>}
        {message && <div className="success-msg">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-field">
            <label>Name</label>
            <div className="input-group-admin">
              <UserRound size={18} className="input-icon-admin" />
              <input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Admin name"
                required
              />
            </div>
            {errors.name && <small className="field-error">{errors.name}</small>}
          </div>

          <div className="input-field">
            <label>Department</label>
            <div className="input-group-admin">
              <Building2 size={18} className="input-icon-admin" />
              <select id="department" name="department" value={formData.department} onChange={handleChange} required>
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>
            {errors.department && <small className="field-error">{errors.department}</small>}
          </div>

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
            <small className="help-text">Must be a Gmail address (@gmail.com)</small>
            {errors.email && <small className="field-error">{errors.email}</small>}
          </div>

          <div className="input-field">
            <label>Password</label>
            <div className="input-group-admin">
              <Lock size={18} className="input-icon-admin" />
              <input
                id="password"
                name="password"
                type="password"
                maxLength="4"
                value={formData.password}
                onChange={handleChange}
                placeholder="4 digits only"
                required
              />
            </div>
            <small className="help-text">Must be exactly 4 digits (e.g., 1234)</small>
            {errors.password && <small className="field-error">{errors.password}</small>}
          </div>

          <button type="submit" className="login-btn" disabled={loading || Object.keys(errors).length > 0}>
            {loading ? 'Registering...' : 'Register Admin'}
          </button>
        </form>

        <div className="signin-link">
          Already registered?
          <Link to="/admin/login">
            <span>Login here</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminRegister;