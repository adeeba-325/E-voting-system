import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { validateSession, logoutUser } from '../../services/fetch';
import './homeUser.css';

const HomeUser = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const userId = localStorage.getItem('userId');
      const sessionToken = localStorage.getItem('sessionToken');
      
      if (!userId || !sessionToken) {
        navigate('/');
        return;
      }
      
      try {
        await validateSession(userId, sessionToken);
      } catch (error) {
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('isLoggedIn');
        navigate('/');
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleLogout = async () => {
    const userId = localStorage.getItem('userId');
    try {
      await logoutUser(userId);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('isLoggedIn');
      navigate('/');
    }
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <nav className="home-nav">
          <ul className="home-nav-list">
            <li>
              <Link to="/homeUser" className="home-nav-link active">Home</Link>
            </li>
            <li>
              <Link to="/register" className="home-nav-link">Register</Link>
            </li>
            <li>
              <Link to="/vote" className="home-nav-link">Vote</Link>
            </li>
            <li>
              <Link to="/result" className="home-nav-link">Result</Link>
            </li>
            <li>
              <button onClick={handleLogout} className="home-logout-btn">Logout</button>
            </li>
          </ul>
        </nav>

        <header className="home-header">
          <p className="home-subtitle">Welcome back</p>
          <h1 className="home-title">E-Vote Election System</h1>
        </header>

        <section className="home-news-section">
          <span className="home-news-badge">📢 Breaking News</span>
          <h2 className="home-news-headline">Registrations Are Going On!</h2>
          <p className="home-news-message">
            Interested students can register as candidates for the Class Representatives election. Don't miss your chance to lead your class—register now and make your voice heard!
          </p>
        </section>

        <div className="home-actions">
          <Link to="/register" className="action-card" style={{ textDecoration: 'none' }}>
            <span className="action-icon">👥</span>
            <h2>Become a CR</h2>
            <p>Register yourself as a Class Representative candidate and share your vision for the class.</p>
            <button className="action-button action-button-register">Register Now</button>
          </Link>

          <Link to="/vote" className="action-card" style={{ textDecoration: 'none' }}>
            <span className="action-icon">✅</span>
            <h2>Choose Your CR</h2>
            <p>Cast your vote for the candidate who best represents your class and your interests.</p>
            <button className="action-button action-button-vote">Vote Now</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomeUser;