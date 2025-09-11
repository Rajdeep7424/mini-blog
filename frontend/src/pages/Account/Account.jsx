import styles from './Account.module.css'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from "react";

export default function Account() {
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const [newUsername, setNewUsername] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageType, setMessageType] = useState(""); // "success" or "error"

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [message]);

  const updateUsername = async (id, username) => {
    if (!username.trim()) {
      setMessageType("error");
      setMessage("Please enter a valid username");
      return;
    }
    
    // Check if username is same as current
    if (username === user.username) {
      setMessageType("error");
      setMessage("New username cannot be the same as current username");
      return;
    }
    
    setIsLoading(true);
    setMessage("");
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`http://localhost:5000/api/auth/profile/username`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ username }),
      });
      
      const data = await res.json();
      console.log(data);
      
      if (res.ok) {
        setMessageType("success");
        setMessage("Username updated successfully!");
        setNewUsername("");
        if (updateUser) {
          updateUser(data.user);
        }
      } else {
        setMessageType("error");
        // Check if it's a duplicate username error (from server response)
        if (data.error && data.error.includes('duplicate key error') && data.error.includes('username')) {
          setMessage("Username already exists. Please choose a different one.");
        } 
        // Check if server returned a specific message about username already existing
        else if (data.message && data.message.toLowerCase().includes('already exists')) {
          setMessage("Username already exists. Please choose a different one.");
        } 
        // Check for the specific error format from your console
        else if (data.error && data.error.includes('E11000 duplicate key error')) {
          setMessage("Username already exists. Please choose a different one.");
        }
        else {
          setMessage(data.message || "Failed to update username");
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setMessageType("error");
      setMessage("An error occurred while updating username");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateUsername(user._id, newUsername);
  };

  return (
    <div className={styles.container}>
      {isAuthenticated && user && (
        <div className={styles.UserCard}>
          <h2 className={styles.title}>Account Information</h2>
          
          <div className={styles.userInfo}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Username:</span>
              <span className={styles.username}>{user.username}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Email:</span>
              <span className={styles.usermail}>{user.email}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <h3 className={styles.subtitle}>Update Username</h3>
            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="Enter new username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className={styles.input}
                disabled={isLoading}
              />
              <button 
                type="submit" 
                className={styles.updateButton}
                disabled={isLoading || !newUsername.trim()}
              >
                {isLoading ? 'Updating...' : 'Update Username'}
              </button>
            </div>
          </form>

          {message && (
            <div className={`${styles.message} ${styles[messageType]}`}>
              {message}
              <button 
                className={styles.dismissButton}
                onClick={() => {
                  setMessage("");
                  setMessageType("");
                }}
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          )}

          <div className={styles.actions}>
            <button
              onClick={() => {
                logout();
                window.location.href = "/";
              }}
              className={styles.logoutButton}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}