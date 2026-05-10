import styles from './Footer.module.css'; // Change this line

export default function Footer() {
  return (
    /* Use the styles object here */
    <footer className={styles.footerContainer}> 
      <h2>BlogPosts</h2>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="#">About</a></li>
        <li><a href="#">Contact</a></li>
        <li><a href="#">Privacy</a></li>
      </ul>
      <p>© {new Date().getFullYear()} BlogPosts. All rights reserved.</p>
    </footer>
  );
}