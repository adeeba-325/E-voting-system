export const addUserToServer = async ({ userInfo }) => {
  const url = "http://localhost:5000/api/signup";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userInfo)
    });

    console.log("Raw response:", response);

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Backend returned error:", data);
      throw new Error(data.error || data.message || JSON.stringify(data));
    }
   
    return data;
  } catch (error) {
    console.error("Fetch failed:", error);
    throw new Error(error.message || "Fetch completely failed");
  }
};

export const addCandidateToServer = async ({ userId, candidateInfo }) => {
  const url = `http://localhost:5000/api/register/${userId}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateInfo)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Candidate registration error:', data);
      throw new Error(data.error || data.message || JSON.stringify(data));
    }

    return data;
  } catch (error) {
    console.error('Candidate registration failed:', error);
    throw new Error(error.message || 'Candidate registration failed');
  }
};

export const getAllCandidates = async ({ branch, section } = {}) => {
  const url = new URL('http://localhost:5000/api/candidates');
  if (branch) url.searchParams.append('branch', branch);
  if (section) url.searchParams.append('section', section);

  try {
    const response = await fetch(url.toString());
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Candidate fetch error:', data);
      throw new Error(data.error || data.message || 'Failed to load candidates');
    }
    return data;
  } catch (error) {
    console.error('Candidate fetch failed:', error);
    throw new Error(error.message || 'Failed to load candidates');
  }
};

export const voteCandidateOnServer = async ({ candidateId, userId }) => {
  const url = `http://localhost:5000/api/vote/${candidateId}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Vote candidate error:', data);
      throw new Error(data.error || data.message || 'Failed to cast vote');
    }
    return data;
  } catch (error) {
    console.error('Vote candidate failed:', error);
    throw new Error(error.message || 'Failed to cast vote');
  }
};