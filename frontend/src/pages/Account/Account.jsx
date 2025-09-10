import styles from './Account.module.css'
import { useAuth } from '../../context/AuthContext'
import { NavLink } from "react-router-dom";

export default function Account(){
    const {user, isAuthenticated, logout} = useAuth();
    return(
        <div>
            {isAuthenticated && user && (
                <div className={styles.UserCard}>
                    <p>Username: <span className={styles.username}>{user.username}</span></p>
                    <p>Email: <span className={styles.usermail}>{user.email}</span></p>
                    <button onClick={logout}><NavLink to="/" onClick={() => setIsOpen(false)}>Logout</NavLink></button>
                </div>
            )}
        </div>
    )
}