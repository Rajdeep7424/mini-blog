import styles from './Home.module.css';
import { useAuth } from '../../context/AuthContext'; // Import your auth context

export default function Home() {
  const { user, isAuthenticated } = useAuth(); // Get user data and auth status

  return (
    <>
      {/* Show welcome message only if user is logged in */}
      {isAuthenticated && user && (
        <div className={styles.welcomeMessage}>
          <p>Hello, <span className={styles.username}>{user.username}</span>! 👋</p>
        </div>
      )}
      
      <h1>Welcome to</h1>
      <h1 className={styles.title}>BlogPost</h1>
      
      <p className={styles.para}>
        Blogpost is a site where you can upload blogs. These blogs will be available only to you 
        and they will be stored in your own device (localstorage of your browser to be specific). 
        So basically you can use this site as your Personal Diary or Journal.
      </p>
    </>
  );
}