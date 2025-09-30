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
  const [passwordStrength, setPasswordStrength] = useState("");

  useEffect(() => {
    // Check password strength
    const strength = checkPasswordStrength(newPassword);
    setPasswordStrength(strength);
  }, [newPassword]);

  const checkPasswordStrength = (password) => {
    if (!password) return "";
    
    const hasMinLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const strengthScore = [hasMinLength, hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
      .filter(Boolean).length;

    if (strengthScore <= 2) return "weak";
    if (strengthScore <= 4) return "medium";
    return "strong";
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "weak": return "#ff4444";
      case "medium": return "#ffbb33";
      case "strong": return "#00C851";
      default: return "#cccccc";
    }
  };

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

      if (res.ok && data.success) {
        setMessage(data.message);
        
        // Redirect to login after success
        setTimeout(() => {
          navigate("/login", { 
            state: { message: "Password reset successfully! Please log in with your new password." }
          });
        }, 3000);
      } else {
        throw new Error(data.message || `Error: ${res.status}`);
      }
    } catch (err) {
      console.error("API Error:", err);
      
      if (err.message.includes("Failed to fetch")) {
        setError("Cannot connect to the server. Please check your internet connection.");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.authHeader}>
            <h2>Create New Password</h2>
            <p>Enter your new password below</p>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="newPassword" className={styles.inputLabel}>
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              placeholder="Enter new password (min. 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              disabled={isLoading}
              className={styles.authInput}
            />
            {newPassword && (
              <div className={styles.passwordStrength}>
                <div 
                  className={styles.strengthBar} 
                  style={{ 
                    width: passwordStrength === "weak" ? "33%" : 
                           passwordStrength === "medium" ? "66%" : "100%",
                    backgroundColor: getPasswordStrengthColor()
                  }}
                ></div>
                <span className={styles.strengthText}>
                  Strength: {passwordStrength || "none"}
                </span>
              </div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword" className={styles.inputLabel}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              disabled={isLoading}
              className={styles.authInput}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 6}
            className={`${styles.authButton} ${isLoading ? styles.loading : ''}`}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner}></div>
                Resetting Password...
              </>
            ) : (
              'Reset Password'
            )}
          </button>

          {message && (
            <div className={styles.successMessage}>
              <div className={styles.successIcon}>✓</div>
              <div>
                <strong>Success!</strong>
                <p>{message}</p>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              <div className={styles.errorIcon}>⚠</div>
              <div>
                <strong>Error</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className={styles.authLinks}>
            <button 
              type="button"
              onClick={() => navigate('/login')}
              className={styles.textButton}
            >
              ← Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}