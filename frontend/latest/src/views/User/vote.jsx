import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logoutUser, getUserProfile } from '../../services/fetch';
import { getAllCandidates, voteCandidateOnServer } from '../../services/connect';
import './vote.css';

function Vote() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [votedCandidateId, setVotedCandidateId] = useState('');
  const [votingId, setVotingId] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const loadData = async () => {
      try {
        setLoading(true);
        let branch;
        let section;

        if (userId) {
          try {
            const profileResponse = await getUserProfile(userId);
            branch = profileResponse.user?.branch;
            section = profileResponse.user?.section;

            if (profileResponse.user?.hasVoted) {
              setHasVoted(true);
              setVotedCandidateId(profileResponse.user.votedCandidate || '');
            }
          } catch (profileError) {
            setError('Unable to load profile information. Showing available candidates.');
          }
        }

        const candidateResponse = await getAllCandidates({ branch, section });
        setCandidates(candidateResponse.candidates || []);
      } catch (err) {
        setError(err.message || 'Unable to load voting data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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

  const handleVote = async (candidateId, candidateName) => {
    if (hasVoted) {
      setError('You have already voted and cannot vote again.');
      setFeedback('');
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('Your session has expired. Please login again.');
      return;
    }

    try {
      setError('');
      setFeedback('');
      setVotingId(candidateId);
      const data = await voteCandidateOnServer({ candidateId, userId });
      const updated = data.candidate;
      setCandidates(prev => prev.map(item => item._id === candidateId ? updated : item));
      setHasVoted(true);
      setVotedCandidateId(candidateId);
      setFeedback(`Your vote for ${candidateName} has been recorded.`);
    } catch (err) {
      setError(err.message || 'Unable to cast vote.');
    } finally {
      setVotingId('');
    }
  };

  return (
    <div className="vote-page">
      <div className="vote-card">
        <nav className="vote-nav">
          <ul className="vote-nav-list">
            <li>
              <Link to="/homeUser" className="vote-nav-link">Home</Link>
            </li>
            <li>
              <Link to="/register" className="vote-nav-link">Register</Link>
            </li>
            <li>
              <Link to="/vote" className="vote-nav-link active">Vote</Link>
            </li>
            <li>
              <Link to="/result" className="vote-nav-link">Result</Link>
            </li>
            <li>
              <button type="button" className="vote-logout-btn" onClick={handleLogout}>Logout</button>
            </li>
          </ul>
        </nav>

        <header className="vote-header">
          <div>
            <p className="vote-subtitle">Choose your CR</p>
            <h1>Cast Your Vote</h1>
          </div>
          <p className="vote-description">
            Browse the registered candidates and support the person who best represents your class.
          </p>
        </header>

        {loading && <div className="vote-status">Loading candidates...</div>}
        {error && <div className="vote-error">✗ {error}</div>}
        {feedback && <div className="vote-success">✓ {feedback}</div>}

        <div className="candidate-grid">
          {candidates.length > 0 ? (
            candidates.map(candidate => (
              <article key={candidate._id} className="candidate-card">
                <div className="candidate-card-top">
                  <div>
                    <h2>{candidate.name}</h2>
                    <p className="candidate-role">Class Representative Candidate</p>
                  </div>
                </div>

                <div className="candidate-meta">
                  <span>{candidate.branch}</span>
                  <span>Section {candidate.section}</span>
                  <span>Scholar No. {candidate.scholarNumber}</span>
                </div>

                <div className="candidate-details">
                  <p><strong>CGPA:</strong> {candidate.cgpa.toFixed(2)}</p>
                  <p className="candidate-manifesto">{candidate.manifesto.length > 180 ? `${candidate.manifesto.slice(0, 180)}...` : candidate.manifesto}</p>
                </div>

                <button
                  type="button"
                  className="vote-button"
                  disabled={hasVoted || Boolean(votingId)}
                  onClick={() => handleVote(candidate._id, candidate.name)}
                >
                  {votingId === candidate._id ? 'Voting...' : hasVoted ? 'Vote disabled' : 'Vote'}
                </button>
              </article>
            ))
          ) : (
            !loading && <div className="vote-empty">No candidates have registered yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Vote;
