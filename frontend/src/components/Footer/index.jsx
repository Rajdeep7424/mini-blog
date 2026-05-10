import './Footer.module.css'
export default function Footer() {
  return (
    <footer>
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
