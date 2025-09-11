import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from './Auth.module.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setResetToken("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        if (data.resetToken) {
          setResetToken(data.resetToken);
        }
        setEmail("");
      } else {
        throw new Error(data.message || `Error: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      console.error("API Error:", err);
      
      if (err.message.includes("Failed to fetch")) {
        setError("Cannot connect to the server. Please make sure the backend is running on port 5000.");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleResetClick = () => {
    if (resetToken) {
      navigate(`/reset-password/${resetToken}`);
    }
  };

  return (
    <div className={styles.authcontainer}>
      <form onSubmit={handleSubmit} className={styles.authform}>
        <h2>Forgot Password</h2>
        <p>Enter your email to generate a password reset link</p>
        
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
        
        <button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Generate Reset Link'}
        </button>

        {message && (
          <div className={`${styles.authmessage} ${styles.authsuccess}`}>
            <p>{message}</p>
            {resetToken && (
              <div className={styles.resetlinkcontainer}>
                <p>Click the button below to reset your password:</p>
                <div className={styles.resetlinkbox}>
                  <button 
                    className={styles.resetlinkbutton}
                    onClick={handleResetClick}
                  >
                    Reset My Password
                  </button>
                </div>
                {/* <p className={styles.demonote}>
                  Token: {resetToken}
                </p> */}
              </div>
            )}
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