import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GameProvider } from './context/GameContext.jsx'
const storedUser = localStorage.getItem("user");
const loggedInUser = storedUser ? JSON.parse(storedUser) : null;
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GameProvider user={loggedInUser}>
      <App />
    </GameProvider>
  </StrictMode>,
)
