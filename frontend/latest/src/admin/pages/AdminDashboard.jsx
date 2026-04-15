import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  CirclePlus,
  LogOut,
  PencilLine,
  PlayCircle,
  SquareStop,
  Trash2,
} from 'lucide-react';
import {
  clearAdminSession,
  createAdminCandidate,
  deleteAdminCandidate,
  endElection,
  getAdminCandidates,
  getAdminDashboard,
  getAdminLiveVotes,
  getAdminResults,
  getAdminSections,
  saveAdminSession,
  startElection,
  updateAdminCandidate,
  verifyAdminSession,
} from '../services/adminApi';
import './AdminDashboard.css';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const emptyCandidate = {
  name: '',
  branch: '',
  scholarNumber: '',
  section: '',
  cgpa: '',
  manifesto: '',
  wasPreviousCR: false,
};

const departmentsFallback = ['CSE', 'MDS', 'ECE', 'EE', 'ME', 'CE', 'CHE', 'MME', 'Architecture', 'Planning', 'Management'];

function AdminDashboard() {
  const navigate = useNavigate();
  const params = useParams();
  const savedDepartment = localStorage.getItem('adminSelectedDepartment');
  const savedSection = localStorage.getItem('adminSelectedSection');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ departments: departmentsFallback, sections: ['1', '2', '3'], totals: { registeredCandidates: 0, activeElections: 0 } });
  const [selectedDepartment, setSelectedDepartment] = useState(params.department || savedDepartment || localStorage.getItem('adminDepartment') || '');
  const [selectedSection, setSelectedSection] = useState(params.section || savedSection || '');
  const [sections, setSections] = useState(['1', '2', '3']);
  const [candidates, setCandidates] = useState([]);
  const [liveVotes, setLiveVotes] = useState([]);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [candidateForm, setCandidateForm] = useState(emptyCandidate);
  const [actionLoading, setActionLoading] = useState(false);
  const [electionState, setElectionState] = useState(null);
  const [activeView, setActiveView] = useState('overview');

  const candidateChartData = useMemo(
    () => {
      const normalized = (liveVotes || []).map((item) => {
        const votes = Number(item?.votes || 0);
        const fullName = String(item?.name || 'Unknown');
        const shortName = fullName.length > 16 ? `${fullName.slice(0, 16)}...` : fullName;
        return {
          name: fullName,
          shortName,
          votes,
        };
      });

      const total = normalized.reduce((acc, candidate) => acc + candidate.votes, 0);

      return normalized
        .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name))
        .map((candidate, index) => ({
          ...candidate,
          rank: index + 1,
          percent: total > 0 ? Number(((candidate.votes / total) * 100).toFixed(1)) : 0,
        }));
    },
    [liveVotes]
  );

  const totalLiveVotes = useMemo(
    () => candidateChartData.reduce((sum, candidate) => sum + candidate.votes, 0),
    [candidateChartData]
  );

  const leadingCandidate = candidateChartData[0] || null;

  const declaredCr = resultData?.cr && Number(resultData.cr.votes || 0) > 0 ? resultData.cr : null;
  const declaredCoCr = resultData?.coCr && Number(resultData.coCr.votes || 0) > 0 ? resultData.coCr : null;
  const electionTone = !electionState ? 'idle' : electionState.isActive ? 'live' : electionState.announcedResults ? 'declared' : 'closed';
  const electionLabel = !electionState ? 'No election loaded' : electionState.isActive ? 'Voting live' : electionState.announcedResults ? 'Results declared' : 'Voting closed';
  const electionDetail = !selectedDepartment || !selectedSection
    ? 'Choose a department and section to manage election settings.'
    : `${selectedDepartment} / Section ${selectedSection}`;

  const refreshSectionData = async (department, section) => {
    if (!department || !section) {
      setCandidates([]);
      setLiveVotes([]);
      setElectionState(null);
      setResultData(null);
      return;
    }

    const [candidateResponse, liveResponse, resultResponse] = await Promise.allSettled([
      getAdminCandidates(department, section),
      getAdminLiveVotes(department, section),
      getAdminResults(department, section),
    ]);

    if (candidateResponse.status === 'fulfilled') {
      setCandidates(candidateResponse.value.candidates || []);
      setElectionState(candidateResponse.value.election || null);
    }

    if (liveResponse.status === 'fulfilled') {
      setLiveVotes(liveResponse.value.candidates || []);
    }

    if (resultResponse.status === 'fulfilled') {
      setResultData(resultResponse.value.results || null);
    }

    const failure = [candidateResponse, liveResponse, resultResponse].find((entry) => entry.status === 'rejected');
    if (failure) {
      throw failure.reason;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    verifyAdminSession()
      .then((response) => saveAdminSession({ admin: response.admin, token }))
      .catch(() => {
        clearAdminSession();
        navigate('/admin/login');
      });
  }, [navigate]);

  useEffect(() => {
    if (selectedDepartment) {
      localStorage.setItem('adminSelectedDepartment', selectedDepartment);
    } else {
      localStorage.removeItem('adminSelectedDepartment');
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedSection) {
      localStorage.setItem('adminSelectedSection', selectedSection);
    } else {
      localStorage.removeItem('adminSelectedSection');
    }
  }, [selectedSection]);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await getAdminDashboard();
        setSummary(response);
        if (!selectedDepartment && response.departments?.length) {
          setSelectedDepartment(response.departments[0]);
        }
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  useEffect(() => {
    if (!selectedDepartment) {
      return;
    }

    getAdminSections(selectedDepartment)
      .then((response) => {
        setSections(response.sections || ['1', '2', '3']);
        if (!response.sections?.includes(selectedSection)) {
          setSelectedSection(response.sections?.[0] || '');
        }
      })
      .catch((requestError) => setError(requestError.message));
  }, [selectedDepartment]);

  useEffect(() => {
    const loadSectionData = async () => {
      if (!selectedDepartment || !selectedSection) {
        setCandidates([]);
        setLiveVotes([]);
        setElectionState(null);
        setResultData(null);
        return;
      }

      try {
        await refreshSectionData(selectedDepartment, selectedSection);
      } catch (requestError) {
        setError(requestError.message);
      }
    };

    loadSectionData();

    const interval = setInterval(() => {
      if (selectedDepartment && selectedSection) {
        getAdminLiveVotes(selectedDepartment, selectedSection)
          .then((response) => setLiveVotes(response.candidates || []))
          .catch(() => undefined);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedDepartment, selectedSection]);

  const handleDepartmentClick = (department) => {
    setError('');
    setMessage('');
    setSelectedDepartment(department);
    setSelectedSection('');
    localStorage.removeItem('adminSelectedSection');
    navigate(`/admin/dashboard/${encodeURIComponent(department)}`);
  };

  const handleSectionClick = (section) => {
    setError('');
    setMessage('');
    setSelectedSection(section);
    navigate(`/admin/dashboard/${encodeURIComponent(selectedDepartment)}/${encodeURIComponent(section)}`);
  };

  const handleDepartmentSelect = (event) => {
    const department = event.target.value;
    if (!department) {
      return;
    }
    handleDepartmentClick(department);
  };

  const handleSectionSelect = (event) => {
    const section = event.target.value;
    if (!section) {
      return;
    }
    handleSectionClick(section);
  };

  const openCreateModal = () => {
    setEditingCandidate(null);
    setCandidateForm((previous) => ({ ...emptyCandidate, branch: selectedDepartment, section: selectedSection || previous.section }));
    setShowModal(true);
  };

  const openEditModal = (candidate) => {
    setEditingCandidate(candidate);
    setCandidateForm({
      name: candidate.name,
      branch: candidate.branch,
      scholarNumber: candidate.scholarNumber,
      section: candidate.section,
      cgpa: String(candidate.cgpa),
      manifesto: candidate.manifesto,
      wasPreviousCR: Boolean(candidate.wasPreviousCR),
    });
    setShowModal(true);
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setCandidateForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateCandidate = () => {
    if (!candidateForm.name.trim()) return 'Name is required';
    if (!/^[a-zA-Z\s]+$/.test(candidateForm.name.trim())) return 'Name can contain letters only';
    if (!candidateForm.branch) return 'Department is required';
    if (!candidateForm.section) return 'Section is required';
    if (!candidateForm.scholarNumber.trim()) return 'Scholar number is required';
    const cgpaValue = Number(candidateForm.cgpa);
    if (Number.isNaN(cgpaValue)) return 'CGPA must be a number';
    if (cgpaValue <= 8 || cgpaValue > 10) return 'CGPA must be greater than 8 and at most 10';
    if (!candidateForm.manifesto.trim()) return 'Manifesto is required';
    if (candidateForm.manifesto.trim().length < 20) return 'Manifesto must be at least 20 characters';
    return '';
  };

  const handleCandidateSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateCandidate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setActionLoading(true);
    setError('');
    setMessage('');

    const payload = {
      ...candidateForm,
      cgpa: Number(candidateForm.cgpa),
    };

    try {
      if (editingCandidate) {
        await updateAdminCandidate(editingCandidate._id, payload);
        setMessage('Candidate updated successfully');
      } else {
        await createAdminCandidate(payload);
        setMessage('Candidate created successfully');
      }

      setShowModal(false);
      const refreshed = await getAdminCandidates(selectedDepartment, selectedSection);
      setCandidates(refreshed.candidates || []);
      const liveResponse = await getAdminLiveVotes(selectedDepartment, selectedSection);
      setLiveVotes(liveResponse.candidates || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (candidateId) => {
    setActionLoading(true);
    setError('');
    setMessage('');

    try {
      await deleteAdminCandidate(candidateId);
      setMessage('Candidate deleted successfully');
      const refreshed = await getAdminCandidates(selectedDepartment, selectedSection);
      setCandidates(refreshed.candidates || []);
      const liveResponse = await getAdminLiveVotes(selectedDepartment, selectedSection);
      setLiveVotes(liveResponse.candidates || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartElection = async () => {
    if (!selectedDepartment || !selectedSection) {
      setError('Select a department and section first');
      return;
    }

    try {
      setError('');
      setMessage('');
      setActionLoading(true);
      const response = await startElection({ department: selectedDepartment, section: selectedSection });
      setElectionState(response.election);
      setMessage(`Election started in ${selectedDepartment} section ${selectedSection}`);
      try {
        await refreshSectionData(selectedDepartment, selectedSection);
      } catch (refreshError) {
        console.warn('Election started, but refresh failed:', refreshError.message);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndElection = async () => {
    if (!selectedDepartment || !selectedSection) {
      setError('Select a department and section first');
      return;
    }

    try {
      setError('');
      setMessage('');
      setActionLoading(true);
      const response = await endElection({ department: selectedDepartment, section: selectedSection });
      setElectionState(response.election);
      setResultData(response.results);
      setMessage(`Election ended in ${selectedDepartment} section ${selectedSection}`);
      try {
        await refreshSectionData(selectedDepartment, selectedSection);
      } catch (refreshError) {
        console.warn('Election ended, but refresh failed:', refreshError.message);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminSelectedDepartment');
    localStorage.removeItem('adminSelectedSection');
    clearAdminSession();
    navigate('/admin/login');
  };

  if (!localStorage.getItem('adminToken')) {
    return <Navigate to="/admin/login" replace />;
  }

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <div className="admin-dashboard-main admin-shell-loading">
          <div className="admin-loading-card">
            <div className="admin-loading-badge">College Election Control</div>
            <h1>Loading admin dashboard...</h1>
            <p>Preparing election data, candidate records, and live status panels.</p>
          </div>
        </div>
      </div>
    );
  }

  const hasSelection = Boolean(selectedDepartment && selectedSection);

  const chartSection = hasSelection && candidateChartData.length > 0 ? (
    <section className="admin-surface-card admin-chart-section admin-overview-chart">
      <div className="admin-chart-header">
        <div>
          <p className="admin-section-label">Live tracking</p>
          <h3>Real-time Vote Chart</h3>
          <p>Voting results for {selectedDepartment} - Section {selectedSection}</p>
        </div>
          <div className="admin-chart-meta" aria-label="Live vote summary">
          <div className="admin-chart-meta-item">
            <span>Total Votes</span>
            <strong>{totalLiveVotes}</strong>
          </div>
          <div className="admin-chart-meta-item">
            <span>Leader</span>
              <strong>{totalLiveVotes > 0 ? (leadingCandidate?.name || 'Pending') : 'Pending'}</strong>
          </div>
        </div>
      </div>
      <div className="admin-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={candidateChartData} layout="vertical" margin={{ top: 6, right: 20, left: 14, bottom: 6 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf5" />
            <XAxis type="number" stroke="#5f7aa1" tick={{ fontSize: 12 }} allowDecimals={false} />
            <YAxis type="category" dataKey="shortName" stroke="#5f7aa1" tick={{ fontSize: 12 }} width={130} />
            <Tooltip
              contentStyle={{ background: '#ffffff', border: '2px solid #f0f3f8', borderRadius: 12, color: '#10234b' }}
              formatter={(value, _name, info) => [`${value} votes (${info?.payload?.percent ?? 0}%)`, 'Live count']}
              labelFormatter={(_label, payload) => payload?.[0]?.payload?.name || ''}
            />
            <Bar dataKey="votes" fill="#164a95" radius={[0, 10, 10, 0]}>
              {candidateChartData.map((entry, index) => (
                <Cell key={`cell-${entry.name}-${index}`} fill={index % 2 === 0 ? '#164a95' : '#4e73df'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  ) : null;

  const candidatesSection = hasSelection ? (
    <section className="admin-surface-card admin-candidates-section admin-overview-candidates">
      <div className="admin-candidates-header">
        <div>
          <p className="admin-section-label">Roster</p>
          <h3>Registered Candidates</h3>
        </div>
        <button className="admin-ghost-button" type="button" onClick={() => refreshSectionData(selectedDepartment, selectedSection)}>
          Refresh
        </button>
      </div>

      {candidates.length === 0 ? (
        <div className="admin-empty-state">
          <h4>No candidates yet</h4>
          <p>Add candidates to get started.</p>
        </div>
      ) : (
        <div className="admin-candidates-grid">
          {candidates.map((candidate) => (
            <div key={candidate._id} className="admin-candidate-item">
              <div className="admin-candidate-topline">
                <h3 className="admin-candidate-name">{candidate.name}</h3>
                <span className="admin-candidate-votes">🏆 {candidate.votes || 0}</span>
              </div>
              <p className="admin-candidate-meta">{candidate.branch} • Section {candidate.section}</p>
              <div className="admin-candidate-info">
                <p><strong>Scholar:</strong> {candidate.scholarNumber}</p>
                <p><strong>CGPA:</strong> {Number(candidate.cgpa).toFixed(2)}</p>
                <p><strong>Prev CR:</strong> {candidate.wasPreviousCR ? '✓ Yes' : '✗ No'}</p>
                <p><em>{candidate.manifesto}</em></p>
              </div>
              <div className="admin-candidate-actions">
                <button className="admin-edit-btn" onClick={() => openEditModal(candidate)}>
                  <PencilLine size={14} /> Edit
                </button>
                <button className="admin-delete-btn" onClick={() => handleDelete(candidate._id)}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  ) : null;

  const resultsSection = resultData ? (
    <section className="admin-surface-card admin-results-section admin-overview-results">
      <div className="admin-candidates-header">
        <div>
          <p className="admin-section-label">Declaration</p>
          <h3>Election Results</h3>
        </div>
      </div>
      {!declaredCr && !declaredCoCr ? (
        <div className="admin-empty-state admin-empty-declaration">
          <h4>No winner declared</h4>
          <p>No valid votes were cast, so CR and Co-CR remain pending.</p>
        </div>
      ) : null}
      <div className="admin-results-grid">
        <div className="admin-result-card winner-card">
          <h4>🥇 Class Representative</h4>
          <p>{declaredCr?.name || 'Pending'}</p>
          <span>{declaredCr?.votes ?? 0} votes</span>
        </div>
        <div className="admin-result-card co-winner-card">
          <h4>🥈 Co-Representative</h4>
          <p>{declaredCoCr?.name || 'Pending'}</p>
          <span>{declaredCoCr?.votes ?? 0} votes</span>
        </div>
        <div className="admin-result-card summary-card">
          <h4>📊 Total Candidates</h4>
          <p>{resultData.allCandidates?.length || 0}</p>
          <span>All candidates in the selected section</span>
        </div>
      </div>
    </section>
  ) : null;

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-main admin-shell">
        <header className="admin-hero">
          <div className="admin-hero-copy">
            <div className={`admin-hero-kicker ${electionTone}`}>
              <span className="admin-hero-dot" /> College Election Control Center
            </div>
            <h1>Admin Dashboard</h1>
            <p>
              Manage departments, sections, candidates, live voting, and final declarations from a single clean control surface.
            </p>
            <div className="admin-hero-badges">
              <span className="admin-hero-badge">{electionDetail}</span>
              <span className={`admin-hero-badge status-${electionTone}`}>{electionLabel}</span>
              <span className="admin-hero-badge">{hasSelection ? candidates.length : 0} section candidates</span>
            </div>
          </div>
          <div className="admin-hero-actions">
            <button className="admin-hero-action primary" onClick={openCreateModal}>
              <CirclePlus size={18} /> Add Candidate
            </button>
            <button className="admin-hero-action secondary" onClick={handleLogout}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        </header>

        <section className="admin-top-nav">
          <div className="admin-top-nav-brand">
            <h2>Election Workspace</h2>
            <p>Navigate modules and monitor section context from one place.</p>
          </div>

          <div className="admin-top-nav-meta" aria-label="Current context">
            <article className="admin-meta-card">
              <span className="admin-meta-card-label">Department</span>
              <strong className="admin-meta-card-value">{selectedDepartment || 'Not selected'}</strong>
            </article>
            <article className="admin-meta-card">
              <span className="admin-meta-card-label">Section</span>
              <strong className="admin-meta-card-value">{selectedSection ? `Section ${selectedSection}` : 'Not selected'}</strong>
            </article>
            <article className={`admin-meta-card status-${electionTone}`}>
              <span className="admin-meta-card-label">Voting Status</span>
              <strong className="admin-meta-card-value">{electionLabel}</strong>
            </article>
          </div>
        </section>

        <section className="admin-view-switcher" aria-label="Dashboard views">
          <button
            type="button"
            className={`admin-view-btn ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveView('overview')}
          >
            Overview
          </button>
          <button
            type="button"
            className={`admin-view-btn ${activeView === 'live' ? 'active' : ''}`}
            onClick={() => setActiveView('live')}
          >
            Live Votes
          </button>
          <button
            type="button"
            className={`admin-view-btn ${activeView === 'candidates' ? 'active' : ''}`}
            onClick={() => setActiveView('candidates')}
          >
            Candidates
          </button>
          <button
            type="button"
            className={`admin-view-btn ${activeView === 'results' ? 'active' : ''}`}
            onClick={() => setActiveView('results')}
          >
            Results
          </button>
        </section>

        {error && <div className="admin-error-msg">{error}</div>}
        {message && <div className="admin-success-msg">{message}</div>}

        <section className="admin-stats-grid">
          <div className="admin-stat-box">
            <div className="admin-stat-icon">🏢</div>
            <h3>{summary.departments?.length || 0}</h3>
            <p>Departments</p>
          </div>
          <div className="admin-stat-box">
            <div className="admin-stat-icon">📊</div>
            <h3>{candidates.length}</h3>
            <p>Section candidates</p>
          </div>
          <div className="admin-stat-box">
            <div className="admin-stat-icon">🗳️</div>
            <h3>{summary.totals?.activeElections || 0}</h3>
            <p>Active elections</p>
          </div>
          <div className="admin-stat-box">
            <div className="admin-stat-icon">✨</div>
            <h3>{electionState?.announcedResults ? 'Declared' : electionState?.isActive ? 'Live' : 'Idle'}</h3>
            <p>Current status</p>
          </div>
        </section>

        <div className="admin-layout-grid">
          <aside className="admin-sidebar">
            <section className="admin-surface-card admin-selection-section">
              <div className="admin-section-head">
                <div>
                  <p className="admin-section-label">Context</p>
                  <h3>Select Department and Section</h3>
                </div>
              </div>

              <div className="admin-select-group">
                <label className="admin-input-label" htmlFor="adminDepartmentSelect">Department</label>
                <div className="admin-select-wrap">
                  <select
                    id="adminDepartmentSelect"
                    className="admin-context-select"
                    value={selectedDepartment}
                    onChange={handleDepartmentSelect}
                  >
                    <option value="">Choose department</option>
                    {(summary.departments || []).map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedDepartment && (
                <div className="admin-select-group">
                  <label className="admin-input-label" htmlFor="adminSectionSelect">Section</label>
                  <div className="admin-select-wrap">
                    <select
                      id="adminSectionSelect"
                      className="admin-context-select"
                      value={selectedSection}
                      onChange={handleSectionSelect}
                    >
                      <option value="">Choose section</option>
                      {(sections || []).map((section) => (
                        <option key={section} value={section}>Section {section}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </section>

            <section className="admin-surface-card admin-controls-section">
              <div className="admin-control-card">
                <h4>🎛️ Election Control</h4>
                <p>Start or end the selected department/section election window.</p>
                <div className="admin-control-buttons">
                  <button className="admin-btn-success" onClick={handleStartElection} disabled={actionLoading}>
                    <PlayCircle size={16} /> Start
                  </button>
                  <button className="admin-btn-danger" onClick={handleEndElection} disabled={actionLoading}>
                    <SquareStop size={16} /> End
                  </button>
                </div>
              </div>

              <div className="admin-control-card accent">
                <h4>📋 Candidate Management</h4>
                <p>Add, edit, or remove candidates for this section.</p>
                <div className="admin-control-buttons">
                  <button className="admin-btn-primary admin-btn-block" onClick={openCreateModal}>
                    <CirclePlus size={16} /> Add Candidate
                  </button>
                </div>
              </div>
            </section>
          </aside>

          <main className="admin-main-column">
            {activeView === 'overview' && (
              <>
                {chartSection}
                <div className="admin-overview-grid">
                  {candidatesSection}
                  {resultsSection}
                </div>
              </>
            )}

            {activeView === 'live' && (
              chartSection || (
                <div className="admin-empty-state">
                  <h4>No live vote data yet</h4>
                  <p>Start election and receive votes to view the live chart.</p>
                </div>
              )
            )}

            {activeView === 'candidates' && candidatesSection}

            {activeView === 'results' && (
              resultsSection || (
                <div className="admin-empty-state">
                  <h4>Results not available yet</h4>
                  <p>End the election to generate and view final results.</p>
                </div>
              )
            )}
          </main>
        </div>

        {showModal && (
          <div className="admin-modal-backdrop" onClick={() => setShowModal(false)}>
            <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <div>
                  <p className="admin-section-label">Candidate form</p>
                  <h2>{editingCandidate ? '✏️ Edit Candidate' : '➕ Add Candidate'}</h2>
                </div>
                <button className="admin-btn-secondary admin-modal-close-btn" onClick={() => setShowModal(false)}>
                  Close
                </button>
              </div>

              {error && <div className="admin-error-msg">{error}</div>}

              <form className="admin-modal-form" onSubmit={handleCandidateSubmit}>
                <div className="admin-form-field">
                  <label>Name</label>
                  <input type="text" name="name" value={candidateForm.name} onChange={handleFormChange} placeholder="Candidate name" required />
                </div>

                <div className="admin-form-grid">
                  <div className="admin-form-field">
                    <label>Department</label>
                    <select name="branch" value={candidateForm.branch} onChange={handleFormChange} required>
                      <option value="">Select</option>
                      {(summary.departments || []).map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-form-field">
                    <label>Section</label>
                    <select name="section" value={candidateForm.section} onChange={handleFormChange} required>
                      <option value="">Select</option>
                      {(sections || []).map((sec) => (
                        <option key={sec} value={sec}>Section {sec}</option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-form-field">
                    <label>Scholar Number</label>
                    <input type="text" name="scholarNumber" value={candidateForm.scholarNumber} onChange={handleFormChange} placeholder="Scholar number" required />
                  </div>
                  <div className="admin-form-field">
                    <label>CGPA</label>
                    <input type="number" name="cgpa" min="0" max="10" step="0.01" value={candidateForm.cgpa} onChange={handleFormChange} placeholder="8.5" required />
                  </div>
                </div>

                <div className="admin-form-field">
                  <label>Manifesto</label>
                  <textarea name="manifesto" value={candidateForm.manifesto} onChange={handleFormChange} placeholder="Why should students vote for this candidate?" required />
                </div>

                <div className="admin-checkbox-wrapper">
                  <input type="checkbox" name="wasPreviousCR" checked={candidateForm.wasPreviousCR} onChange={handleFormChange} id="prev-cr" />
                  <label htmlFor="prev-cr" className="admin-checkbox-label">
                    I was a Class Representative before
                  </label>
                </div>

                <div className="admin-modal-actions">
                  <button type="button" className="admin-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="admin-btn-primary" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : editingCandidate ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;