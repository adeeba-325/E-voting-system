const BASE_URL = 'http://localhost:5000/api/admin';

const request = async (path, options = {}) => {
  try {
    const url = `${BASE_URL}${path}`;
    console.log(`🌐 API Request - ${options.method || 'GET'} ${url}`);
    const mergedHeaders = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    
    const response = await fetch(url, {
      ...options,
      headers: mergedHeaders,
    });

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      let errorMsg = data.message || data.error || `HTTP ${response.status} ${response.statusText}`;
      if (data.message === 'Server error' && data.error) {
        errorMsg = `Server error: ${data.error}`;
      }
      if (data.message?.startsWith('Server error:')) {
        errorMsg = data.message;
      }
      errorMsg = `${errorMsg} [${path}]`;
      console.error(`❌ API Error [${response.status}]:`, errorMsg, data);
      throw new Error(errorMsg);
    }

    console.log(`✅ API Success [${response.status}]:`, data.message || 'OK');
    return data;
  } catch (err) {
    const isNetworkError = err?.message === 'Failed to fetch' || err?.name === 'TypeError';
    const finalError = isNetworkError
      ? new Error(`Backend service is not reachable at ${BASE_URL}. Please start backend server. [${path}]`)
      : err;
    console.error(`⚠️ API Request Failed [${path}]:`, finalError.message);
    throw finalError;
  }
};

const authHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const saveAdminSession = (payload) => {
  if (payload?.token) {
    localStorage.setItem('adminToken', payload.token);
  }
  if (payload?.admin?.id) {
    localStorage.setItem('adminId', payload.admin.id);
  }
  if (payload?.admin?.name) {
    localStorage.setItem('adminName', payload.admin.name);
  }
  if (payload?.admin?.department) {
    localStorage.setItem('adminDepartment', payload.admin.department);
  }
};

export const clearAdminSession = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminId');
  localStorage.removeItem('adminName');
  localStorage.removeItem('adminDepartment');
};

export const registerAdmin = (payload) => request('/register', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const requestAdminLoginOtp = (payload) => request('/login', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const verifyAdminLoginOtp = (payload) => request('/verify-otp', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const requestAdminPasswordResetOtp = (payload) => request('/forgot-password', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const verifyAdminPasswordResetOtp = (payload) => request('/verify-reset-otp', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const resetAdminPassword = (payload) => request('/reset-password', {
  method: 'POST',
  body: JSON.stringify(payload),
});

export const verifyAdminSession = () => request('/verify-session', {
  method: 'GET',
  headers: authHeaders(),
});

export const getAdminDashboard = () => request('/dashboard', {
  method: 'GET',
  headers: authHeaders(),
});

export const getAdminSections = (department) => request(`/departments/${encodeURIComponent(department)}/sections`, {
  method: 'GET',
  headers: authHeaders(),
});

export const getAdminCandidates = (department, section) => request(`/departments/${encodeURIComponent(department)}/sections/${encodeURIComponent(section)}/candidates`, {
  method: 'GET',
  headers: authHeaders(),
});

export const getAdminLiveVotes = (department, section) => {
  const search = new URLSearchParams();
  if (department) search.set('department', department);
  if (section) search.set('section', section);
  return request(`/live-votes?${search.toString()}`, {
    method: 'GET',
    headers: authHeaders(),
  });
};

export const getAdminResults = (department, section) => {
  const search = new URLSearchParams();
  if (department) search.set('department', department);
  if (section) search.set('section', section);
  return request(`/results?${search.toString()}`, {
    method: 'GET',
    headers: authHeaders(),
  });
};

export const createAdminCandidate = (payload) => request('/candidates', {
  method: 'POST',
  headers: authHeaders(),
  body: JSON.stringify(payload),
});

export const updateAdminCandidate = (candidateId, payload) => request(`/candidates/${candidateId}`, {
  method: 'PUT',
  headers: authHeaders(),
  body: JSON.stringify(payload),
});

export const deleteAdminCandidate = (candidateId) => request(`/candidates/${candidateId}`, {
  method: 'DELETE',
  headers: authHeaders(),
});

export const startElection = (payload) => request('/election/start', {
  method: 'POST',
  headers: authHeaders(),
  body: JSON.stringify(payload),
});

export const endElection = (payload) => request('/election/end', {
  method: 'POST',
  headers: authHeaders(),
  body: JSON.stringify(payload),
});