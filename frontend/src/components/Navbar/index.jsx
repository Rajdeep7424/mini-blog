import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <nav className={styles.nav}>
      <h1><NavLink to="/" onClick={() => setIsOpen(false)}>BlogPost</NavLink></h1>

      {/* Hamburger Button (only visible on small screens) */}
      <div
        className={`${styles.hamburger} ${isOpen ? styles.active : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Menu */}
      <ul className={`${styles.menu} ${isOpen ? styles.open : ""}`}>
        {!isAuthenticated && (
          <>
            <li>
              <NavLink to="/register" onClick={() => setIsOpen(false)}>
                Register
              </NavLink>
            </li>
            <li>
              <NavLink to="/login" onClick={() => setIsOpen(false)}>
                Login
              </NavLink>
            </li>
          </>
        )}

        {isAuthenticated && (
          <>
            <li>
              <NavLink to="/bloglist" onClick={() => setIsOpen(false)}>
                BlogList
              </NavLink>
            </li>
            <li>
              <NavLink to="/games" onClick={() => setIsOpen(false)}>
                Games
              </NavLink>
            </li>
            <li>
              <NavLink to="/myblogs" onClick={() => setIsOpen(false)}>
                MyBlogs
              </NavLink>
            </li>
            <li>
              <NavLink to="/createBlog" onClick={() => setIsOpen(false)}>
                CreateBlog
              </NavLink>
            </li>
            <li>
              <NavLink to="/account" onClick={() => setIsOpen(false)}>
                Account
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
