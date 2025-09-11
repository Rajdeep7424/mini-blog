import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from './Auth.module.css';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(
        `http://localhost:5000/api/auth/reset-password/${token}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMessage("Password reset successfully! Redirecting to login...");
        
        // Redirect to login after success
        setTimeout(() => navigate("/login"), 3000);
      } else {
        throw new Error(data.message || `Error: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      console.error("API Error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.authcontainer}>
      <form onSubmit={handleSubmit} className={styles.authform}>
        <h2>Reset Password</h2>
        <p>Enter your new password below</p>
        
        <input
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
          disabled={isLoading}
        />
        
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          disabled={isLoading}
        />
        
        <button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>

        {message && (
          <div className={`${styles.authmessage} ${styles.authsuccess}`}>
            <p>{message}</p>
          </div>
        )}
        
        {error && (
          <div className={`${styles.authmessage} ${styles.autherror}`}>
            <p>{error}</p>
          </div>
        )}
        
        <div className={styles.authlinks}>
          <button onClick={() => navigate('/login')}>Back to Login</button>
        </div>
      </form>
    </div>
  );
}