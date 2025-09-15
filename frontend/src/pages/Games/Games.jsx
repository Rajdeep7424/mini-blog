import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";

export default function Games(){
    const { isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
return(
    <div>
        <h1>Games</h1>
    
        {isAuthenticated && (<>
            <li>
                <NavLink to="/tictactoe" onClick={() => setIsOpen(false)}>
                    TicTacToe
                </NavLink>
            </li>
        </>)}
    </div>
    )
}