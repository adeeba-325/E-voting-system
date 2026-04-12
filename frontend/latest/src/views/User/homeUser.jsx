import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { validateSession, logoutUser } from '../../services/fetch';
import '../../App.css';

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
        // Session invalid on other device
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
      // Force logout even if API fails
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('isLoggedIn');
      navigate('/');
    }
  };
  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: 'white' }}>
      <nav style={{ backgroundColor: '#111', padding: '20px', textAlign: 'center' }}>
        <ul style={{ listStyleType: 'none', display: 'flex', justifyContent: 'center', gap: '30px', margin: 0, padding: 0 }}>
          <li><Link to="/home" style={{ color: '#00e6ff', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 'bold', textShadow: '0 0 10px #00e6ff' }}>Home</Link></li>
          <li><Link to="/register" style={{ color: '#00e6ff', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 'bold', textShadow: '0 0 10px #00e6ff' }}>Register</Link></li>
          <li><Link to="/vote" style={{ color: '#00e6ff', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 'bold', textShadow: '0 0 10px #00e6ff' }}>Vote</Link></li>
          <li><Link to="/result" style={{ color: '#00e6ff', textDecoration: 'none', fontSize: '1.2rem', fontWeight: 'bold', textShadow: '0 0 10px #00e6ff' }}>Result</Link></li>
          <li><button onClick={handleLogout} style={{ color: '#00e6ff', background: 'none', border: 'none', fontSize: '1.2rem', fontWeight: 'bold', textShadow: '0 0 10px #00e6ff', cursor: 'pointer' }}>Logout</button></li>
        </ul>
      </nav>
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1 className="main-heading" style={{ fontSize: '3rem' }}>Welcome to the E-Vote System</h1>
        <p style={{ color: 'white', fontSize: '1.5rem', marginTop: '20px' }}>This is the home page for users.</p>
      </div>
    </div>
  );
};

export default HomeUser;