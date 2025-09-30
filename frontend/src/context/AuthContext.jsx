import { createContext, useContext, useState, useEffect } from "react";
import { login as loginService, register as registerService } from "../services/authService";

// Create context
const AuthContext = createContext();

// Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on app start/refresh
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const savedUser = localStorage.getItem("user");
        const savedToken = localStorage.getItem("token");
        
        if (savedUser && savedToken) {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        }
      } catch (error) {
        console.error("Error loading auth data from localStorage:", error);
        logout(); // Clear corrupted data
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function - accepts userData object
  const login = async (userData) => {
    try {
      setLoading(true);
      const data = await loginService(userData);

      if (data.token) {
        // The response should contain both user data and token
        const userData = {
          _id: data._id,
          username: data.username,
          email: data.email
        };

        setUser(userData);
        setToken(data.token);

        // Save to localStorage
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", data.token);

        return { success: true, data };
      } else {
        throw new Error('No authentication token received');
      }
    } catch (error) {
      console.error("Login failed:", error);
      // Clear any potentially corrupted auth data
      logout();
      throw error; // Re-throw to handle in UI
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      const data = await registerService(userData);

      if (data.token) {
        const userData = {
          _id: data._id,
          username: data.username,
          email: data.email
        };

        setUser(userData);
        setToken(data.token);

        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", data.token);

        return { success: true, data };
      } else {
        throw new Error('Registration completed but no token received');
      }
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // updateuser
  const updateUser = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem("user", JSON.stringify(newUserData));
  };
  

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // Check if token is expired (optional enhancement)
  const isTokenExpired = () => {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token && !isTokenExpired(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}