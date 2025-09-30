import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from './Auth.module.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [debugToken, setDebugToken] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setDebugToken("");
    setIsLoading(true);

    // Basic email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage(data.message);
        setEmailSent(true);
        
        // For development - show debug token if available
        if (data.debugToken) {
          setDebugToken(data.debugToken);
          console.log("🔧 Debug Token:", data.debugToken);
          console.log("🔧 Debug URL:", data.debugUrl);
        }
      } else {
        throw new Error(data.message || `Error: ${res.status}`);
      }
    } catch (err) {
      console.error("API Error:", err);
      
      if (err.message.includes("Failed to fetch")) {
        setError("Cannot connect to the server. Please check your internet connection and make sure the backend is running.");
      } else if (err.message.includes("Too many requests")) {
        setError("Too many reset attempts. Please wait 15 minutes before trying again.");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleResetForm = () => {
    setEmailSent(false);
    setMessage("");
    setError("");
    setEmail("");
    setDebugToken("");
  };

  const handleDebugReset = () => {
    if (debugToken) {
      navigate(`/reset-password/${debugToken}`);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.authHeader}>
            <h2>Reset Your Password</h2>
            <p>Enter your email address and we'll send you a password reset link</p>
          </div>

          {!emailSent ? (
            <>
              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.inputLabel}>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className={styles.authInput}
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className={`${styles.authButton} ${isLoading ? styles.loading : ''}`}
              >
                {isLoading ? (
                  <>
                    <div className={styles.spinner}></div>
                    Sending Reset Link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </>
          ) : (
            <div className={styles.successState}>
              <div className={styles.successIcon}>✓</div>
              <h3>Check Your Email</h3>
              <p className={styles.successMessage}>{message}</p>
              
              <div className={styles.instructions}>
                <h4>What to do next:</h4>
                <ul>
                  <li>Check your inbox at <strong>{email}</strong></li>
                  <li>Look for an email from "Your App"</li>
                  <li>Click the reset link in the email</li>
                  <li>The link expires in 15 minutes</li>
                </ul>
                
                {/* Debug section for development */}
                {debugToken && (
                  <div className={styles.debugSection}>
                    <h4>🔧 Development Mode</h4>
                    <p>Since you're in development, you can use this direct link:</p>
                    <button 
                      type="button"
                      onClick={handleDebugReset}
                      className={styles.debugButton}
                    >
                      Test Reset Password
                    </button>
                    <p className={styles.debugNote}>
                      Token: {debugToken.substring(0, 20)}...
                    </p>
                  </div>
                )}
                
                <div className={styles.tips}>
                  <p><strong>Didn't receive the email?</strong></p>
                  <ul>
                    <li>Check your spam or junk folder</li>
                    <li>Make sure you entered the correct email address</li>
                    <li>Wait a few minutes and try again</li>
                  </ul>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleResetForm}
                className={styles.secondaryButton}
              >
                Try a different email address
              </button>
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