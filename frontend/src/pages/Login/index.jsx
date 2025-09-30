import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const user = await login(formData);

      if (user) {
        setFormData({ email: "", password: "" });
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Invalid credentials");
    }
  }

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2>Login</h2>

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          autoFocus
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <span>
          <button type="submit">Submit</button>
          <NavLink to="/register">← Don&apos;t have an account?</NavLink>
        </span>

        {/* 🔑 Forgot password link */}
        <p style={{ marginTop: "10px" }}>
          <NavLink to="/forgot-password">Forgot Password?</NavLink>
        </p>
      </form>
    </>
  );
}
