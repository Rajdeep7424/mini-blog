import { useState } from "react";
import { register } from "../../services/authService";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./Register.module.css";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
    setSuccess("");

    try {
      const res = await register(formData);
      setSuccess("Registration successful! Please log in.");
      setFormData({ username: "", email: "", password: "" });

      // redirect to login after 1.5 sec
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message || "Registration failed");
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>Register</h2>

        <input
          type="text"
          name="username"
          placeholder="Name"
          autoFocus
          value={formData.username}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
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
        {success && <p style={{ color: "green" }}>{success}</p>}

        <span>
          <button type="submit">Submit</button>
          <NavLink to="/login">← Already have an account?</NavLink>
        </span>
      </form>
    </>
  );
}
