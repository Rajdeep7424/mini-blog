import styles from './Account.module.css';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from "react";
import { Edit2, X, Check } from "lucide-react"; // lucide-react icons

export default function Account() {
  const { user, isAuthenticated, logout, updateUser } = useAuth();

  const [editingField, setEditingField] = useState(null); // "username" | "email" | "password" | null
  const [fieldValue, setFieldValue] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState(""); // ✅ for password change
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto dismiss message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleEditClick = (field, currentValue = "") => {
    setEditingField(field);
    setFieldValue(currentValue);
    setPassword("");
    setNewPassword("");
  };

  const handleCancel = () => {
    setEditingField(null);
    setFieldValue("");
    setPassword("");
    setNewPassword("");
  };

  const handleSave = async () => {
    if (editingField === "password") {
      // ✅ Password change logic
      if (!password.trim() || !newPassword.trim()) {
        setMessageType("error");
        setMessage("Both current and new passwords are required");
        return;
      }

      if (password === newPassword) {
        setMessageType("error");
        setMessage("New password cannot be the same as current password");
        return;
      }

      setIsLoading(true);
      const token = localStorage.getItem("token");

      try {
        const res = await fetch("http://localhost:5000/api/auth/profile/password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ currentPassword: password, newPassword }),
        });

        const data = await res.json();

        if (res.ok) {
          setMessageType("success");
          setMessage("Password updated successfully!");
          handleCancel();
        } else {
          setMessageType("error");
          setMessage(data.message || "Failed to update password");
        }
      } catch (err) {
        console.error(err);
        setMessageType("error");
        setMessage("Server error while updating password");
      } finally {
        setIsLoading(false);
      }

      return; // ✅ prevent running username/email logic
    }

    // ✅ Username/Email logic
    if (!fieldValue.trim() || !password.trim()) {
      setMessageType("error");
      setMessage("Both field value and password are required");
      return;
    }

    if (fieldValue === user[editingField]) {
      setMessageType("error");
      setMessage(`New ${editingField} cannot be the same as current`);
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/auth/profile/${editingField}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [editingField]: fieldValue, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessageType("success");
        setMessage(`${editingField} updated successfully!`);
        setEditingField(null);
        setFieldValue("");
        setPassword("");
        if (updateUser) updateUser(data.user);
      } else {
        setMessageType("error");
        if (data.message && data.message.toLowerCase().includes("already exists")) {
          setMessage(`${editingField} already exists. Please choose a different one.`);
        } else {
          setMessage(data.message || `Failed to update ${editingField}`);
        }
      }
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Server error while updating");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {isAuthenticated && user && (
        <div className={styles.UserCard}>
          <h2 className={styles.title}>Account Information</h2>

          <div className={styles.userInfo}>
            {/* Username */}
            <div className={styles.infoItem}>
              <span className={styles.label}>Username:</span>
              {editingField === "username" ? (
                <div className={styles.editGroup}>
                  <input
                    type="text"
                    value={fieldValue}
                    onChange={(e) => setFieldValue(e.target.value)}
                    className={styles.inputInline}
                    disabled={isLoading}
                  />
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.inputInline}
                    disabled={isLoading}
                  />
                  <button onClick={handleSave} disabled={isLoading} className={styles.iconButton}>
                    <Check size={18} />
                  </button>
                  <button onClick={handleCancel} className={styles.iconButton}>
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <span className={styles.username}>
                  {user.username}
                  <button className={styles.iconButton} onClick={() => handleEditClick("username", user.username)}>
                    <Edit2 size={16} />
                  </button>
                </span>
              )}
            </div>

            {/* Email */}
            <div className={styles.infoItem}>
              <span className={styles.label}>Email:</span>
              {editingField === "email" ? (
                <div className={styles.editGroup}>
                  <input
                    type="email"
                    value={fieldValue}
                    onChange={(e) => setFieldValue(e.target.value)}
                    className={styles.inputInline}
                    disabled={isLoading}
                  />
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.inputInline}
                    disabled={isLoading}
                  />
                  <button onClick={handleSave} disabled={isLoading} className={styles.iconButton}>
                    <Check size={18} />
                  </button>
                  <button onClick={handleCancel} className={styles.iconButton}>
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <span className={styles.usermail}>
                  {user.email}
                  <button className={styles.iconButton} onClick={() => handleEditClick("email", user.email)}>
                    <Edit2 size={16} />
                  </button>
                </span>
              )}
            </div>

            {/* Password */}
            <div className={styles.infoItem}>
              <span className={styles.label}>Password:</span>
              {editingField === "password" ? (
                <div className={styles.editGroup}>
                  <input
                    type="password"
                    placeholder="Current password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.inputInline}
                    disabled={isLoading}
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={styles.inputInline}
                    disabled={isLoading}
                  />
                  <button onClick={handleSave} disabled={isLoading} className={styles.iconButton}>
                    <Check size={18} />
                  </button>
                  <button onClick={handleCancel} className={styles.iconButton}>
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <span className={styles.passwordField}>
                  ********
                  <button className={styles.iconButton} onClick={() => handleEditClick("password")}>
                    <Edit2 size={16} />
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div className={`${styles.message} ${styles[messageType]}`}>
              {message}
              <button
                className={styles.dismissButton}
                onClick={() => {
                  setMessage("");
                  setMessageType("");
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Logout */}
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
