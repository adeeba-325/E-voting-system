import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logoutUser, getUserProfile } from '../../services/fetch';
import { addCandidateToServer } from '../../services/connect';
import './registerUser.css';

function Register() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState({ scholarNumber: '', name: '' });
  const [formData, setFormData] = useState({
    name: '',
    cgpa: '',
    crReason: '',
    wasPreviousCR: false
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);

  const handleLogout = async () => {
    const userId = localStorage.getItem('userId');
    try {
      await logoutUser(userId);
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('isLoggedIn');
      navigate('/');
    } catch (error) {
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('isLoggedIn');
      navigate('/');
    }
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError('Unable to load your profile. Please login again.');
        setLoadingProfile(false);
        return;
      }

      try {
        const data = await getUserProfile(userId);
        setUserProfile(data.user);
        setFormData(prev => ({ ...prev, name: data.user.name || prev.name }));
      } catch (err) {
        setError('Unable to load your profile. Please refresh.');
        console.error('Profile loading failed:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!userProfile.scholarNumber) {
      setError('Unable to load scholar number. Refresh and try again.');
      return;
    }
    if (!formData.cgpa) {
      setError('CGPA is required');
      return;
    }
    if (parseFloat(formData.cgpa) <= 8) {
      setError('CGPA must be greater than 8');
      return;
    }
    if (!formData.crReason.trim()) {
      setError('Please explain why you want to become a CR');
      return;
    }
    if (formData.crReason.trim().length < 20) {
      setError('Please provide a detailed explanation (at least 20 characters)');
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('Your session has expired. Please login again.');
      return;
    }

    setError('');

    try {
      await addCandidateToServer({
        userId,
        candidateInfo: {
          cgpa: parseFloat(formData.cgpa),
          manifesto: formData.crReason.trim(),
          wasPreviousCR: formData.wasPreviousCR
        }
      });

      setSubmitted(true);
      setFormData({
        name: userProfile.name || '',
        cgpa: '',
        crReason: '',
        wasPreviousCR: false
      });
    } catch (err) {
      setError(err.message || 'Candidate registration failed. Please try again.');
      return;
    }

    // Clear success state after 2 seconds
    setTimeout(() => {
      setSubmitted(false);
    }, 2000);
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <nav className="page-nav">
          <ul className="page-nav-list">
            <li>
              <Link to="/homeUser" className="page-nav-link">
                Home
              </Link>
            </li>
            <li>
              <Link to="/register" className="page-nav-link">
                Register
              </Link>
            </li>
            <li>
              <Link to="/vote" className="page-nav-link">
                Vote
              </Link>
            </li>
            <li>
              <Link to="/result" className="page-nav-link">
                Result
              </Link>
            </li>
            <li>
              <button type="button" onClick={handleLogout} className="page-nav-button">
                Logout
              </button>
            </li>
          </ul>
        </nav>
        <div className="register-header">
          <h1>CR Registration Form</h1>
          <p>Register to become a Class Representative</p>
        </div>

        {submitted && (
          <div className="success-message">
            ✓ Registration submitted successfully!
          </div>
        )}

        {error && (
          <div className="error-message">
            ✗ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Scholar Number
            </label>
            <div className="profile-info">
              {loadingProfile ? 'Loading scholar number...' : userProfile.scholarNumber || 'Scholar number unavailable'}
            </div>
          </div>

          {/* CGPA Field */}
          <div className="form-group">
            <label htmlFor="cgpa" className="form-label">
              CGPA (Previous Semester) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="cgpa"
              name="cgpa"
              value={formData.cgpa}
              onChange={handleChange}
              placeholder="Enter CGPA (must be > 8)"
              min="0"
              max="10"
              step="0.01"
              className="form-input"
            />
          </div>

          {/* CR Reason Field */}
          <div className="form-group">
            <label htmlFor="crReason" className="form-label">
              Why do you want to become a CR? <span className="required">*</span>
            </label>
            <textarea
              id="crReason"
              name="crReason"
              value={formData.crReason}
              onChange={handleChange}
              placeholder="Explain your motivation and what qualities make you a good candidate for this role..."
              className="form-textarea"
              rows="5"
            />
            <small className="char-count">
              {formData.crReason.length}/200 characters (minimum 20 required)
            </small>
          </div>

          {/* Previous CR Checkbox */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="wasPreviousCR"
                checked={formData.wasPreviousCR}
                onChange={handleChange}
                className="form-checkbox"
              />
              <span>I was a Class Representative in the previous year</span>
            </label>
          </div>

          {/* Submit Button */}
          <button type="submit" className="register-btn">
            Register
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;