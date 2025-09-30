import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useGame } from './context/GameContext'

import Home from './pages/Home'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Register from './pages/register/index'
import Login from './pages/Login/index'
import Bloglist from './pages/BlogList/index'
import CreateBlog from './pages/CreateBlog'
import BlogDetails from './pages/BlogDetails/index'
import MyBlogList from './pages/MyBlogs/index'
import MyBlogDetails from './pages/MyBlogDetail'
import Account from './pages/Account/Account'
import ForgotPassword from './pages/auth/ForgetPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Games from './pages/Games/Games'
import TicTacToe from './pages/Games/TicTacToe/TicTacToe'
import TictactoeMultiplayer from './pages/Games/TicTacToe/TictactoeMultiplayer'
import CarRace from './pages/Games/CarRace/CarRace'
import Minesweeper from './pages/Games/MineSweeper/MineSweeper'
import Aviator from './pages/Games/Aviator/Aviator'
import Wheel from './pages/Games/Wheels/Wheels'

function AppWrapper() {
  const { match, gameResult } = useGame(); // get gameResult too
  const isFullScreen = Boolean(match && !gameResult); // hide nav/footer only during active match

  return (
    <>
      {!isFullScreen && <Navbar />}
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/account' element={<Account />} />
        <Route path='/register' element={<Register />} />
        <Route path='/login' element={<Login />} />
        <Route path='/games' element={<Games />} />
        <Route path='/tictactoe' element={<TicTacToe />} />
        <Route path='/carrace' element={<CarRace />} />
        <Route path='/tictactoe-multiplayer' element={<TictactoeMultiplayer />} />
        <Route path="/minesweeper" element={<Minesweeper />} />
        <Route path="/aviator" element={<Aviator />} />
        <Route path="/wheel" element={<Wheel />} />
        <Route path='/bloglist' element={<Bloglist />} />
        <Route path='/myblogs' element={<MyBlogList />} />
        <Route path='/myblogs/:id' element={<MyBlogDetails />} />
        <Route path='/createBlog' element={<CreateBlog />} />
        <Route path='/blogs/:id' element={<BlogDetails />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/reset-password/:token' element={<ResetPassword />} />
      </Routes>
      {!isFullScreen && <Footer />}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppWrapper />
      </Router>
    </AuthProvider>
  )
}

export default App
