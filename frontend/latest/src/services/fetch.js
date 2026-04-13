export const loginUser = async (email, password) => {
  try {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Store session token
    if (data.sessionToken) {
      localStorage.setItem('sessionToken', data.sessionToken);
      localStorage.setItem('userId', data.user.id);
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const validateSession = async (userId, sessionToken) => {
  try {
    const response = await fetch('http://localhost:5000/api/validate-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, sessionToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Session validation failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async (userId) => {
  try {
    const response = await fetch('http://localhost:5000/api/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Logout failed');
    }

    // Clear local storage
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');

    return data;
  } catch (error) {
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    const response = await fetch(`http://localhost:5000/api/user-profile/${userId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to load user profile');
    }

    return data;
  } catch (error) {
    throw error;
  }
};