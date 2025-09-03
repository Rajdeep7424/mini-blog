const API_URL = "http://localhost:5000/api/auth";

export const login = async (userData) => {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    
    // Handle network errors
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    return data;
    
  } catch (error) {
    console.error('Login API error:', error);
    
    // Provide more specific error messages
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running on port 5000.');
    }
    
    throw error;
  }
};

export const register = async (userData) => {
  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    return data;
    
  } catch (error) {
    console.error('Register API error:', error);
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running on port 5000.');
    }
    
    throw error;
  }
};