import { Link, useNavigate } from 'react-router-dom';
import { logoutUser } from '../../services/fetch';
import stayTunedImage from '../../assets/stayTuned.jpg';
import './result.css';

function ViewResults() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const userId = localStorage.getItem('userId');
    try {
      await logoutUser(userId);
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('isLoggedIn');
      navigate('/');
    }
  };

  return (
    <div className="result-page">
      <div className="result-shell">
        <nav className="result-nav">
          <ul className="result-nav-list">
            <li>
              <Link to="/homeUser" className="result-nav-link">Home</Link>
            </li>
            <li>
              <Link to="/register" className="result-nav-link">Register</Link>
            </li>
            <li>
              <Link to="/vote" className="result-nav-link">Vote</Link>
            </li>
            <li>
              <Link to="/result" className="result-nav-link active">Result</Link>
            </li>
            <li>
              <button type="button" className="result-logout-btn" onClick={handleLogout}>Logout</button>
            </li>
          </ul>
        </nav>

        <header className="result-header">
          <p className="result-subtitle">Election update</p>
          <h1 className="result-title">Results are almost ready.</h1>
        </header>

        <section className="result-message-card">
          <div className="result-copy">
            <h2>Stay tuned</h2>
            <p>
              Results will appear here shortly.
            </p>
          </div>
          <div className="result-image">
            <img src={stayTunedImage} alt="Stay tuned" />
          </div>
        </section>
      </div>
    </div>
  );
}

export default ViewResults;