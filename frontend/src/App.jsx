import './App.css'
import { BrowserRouter  as Router, Routes, Route } from 'react-router-dom'
import {AuthProvider} from './context/AuthContext'
import Home from './pages/Home'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Register from './pages/register/index'
import Login from './pages/Login/index'
import Bloglist from './pages/BlogList/index'
import CreateBlog from './pages/CreateBlog'
import BlogDetails from './pages/BlogDetails/index';
import MyBlogList from './pages/MyBlogs/index'
import MyBlogDetails from './pages/MyBlogDetail'
import EditBlog from './pages/EditBlog'
import Account from './pages/Account/Account'
import ForgotPassword from './pages/auth/ForgetPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Games from './pages/Games/Games'
import TicTacToe from './pages/Games/TicTacToe/TicTacToe'
import Multiplayer from './pages/Games/TicTacToe/Multiplayer'
function App() {
 

  return (
    <AuthProvider>

      <Router>

        <Navbar/>

        <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path='/account' element={<Account/>} />
          <Route path="/register" element={<Register/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/games" element={<Games/>}/>
          <Route path="/tictactoe" element={<TicTacToe/>}/>
          <Route path="/multiplayer" element={<Multiplayer/>}/>
          <Route path='/bloglist' element={<Bloglist/>}/> 
          <Route path='/myblogs' element={<MyBlogList/>}/>
          <Route path='/myblogs/:id' element={<MyBlogDetails/>}/>
          <Route path='/edit/:id' element={<EditBlog/>}/>
          <Route path='/createBlog' element={<CreateBlog/>}/>
          <Route path="/blogs/:id" element={<BlogDetails />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

        </Routes>

        <Footer/>

      </Router>

    </AuthProvider>
  )
}
export default App
