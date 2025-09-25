import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import styles from './Games.module.css'

export default function Games(){
    const { isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    if (!isAuthenticated) return null;

    const games = [
        { name: "TicTacToe", link: "/tictactoe", theme: styles.tictactoe },
        { name: "Car Race", link: "/carrace", theme: styles.carrace },
        { name: "Mine Sweeper", link: "/minesweeper", theme: styles.minesweeper },
        { name: "Aviator", link: "/aviator", theme: styles.tictactoe },
        { name: "Spin Wheel", link: "/wheel", theme: styles.carrace },
    ];

    return(
        <div>
            <h1 className={styles.head}>Games</h1>
            <ul className={styles.gamelist}>
                {games.map(game => (
                    <li key={game.name} className={`${styles.gameobject} ${game.theme}`}>
                        <NavLink to={game.link} onClick={() => setIsOpen(false)}>
                            {game.name}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </div>
    )
}
