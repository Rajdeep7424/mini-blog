import './App.css'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import {AuthProvider} from './context/AuthContext'
import Home from './pages/Home'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Register from './pages/register/index'
import Login from './pages/login/index'
import Bloglist from './pages/BlogList/index'
import CreateBlog from './pages/CreateBlog'
import BlogDetails from './pages/BlogDetails/index';

function App() {
 

  return (
    <AuthProvider>

      <Router>

        <Navbar/>

        <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path='/bloglist' element={<Bloglist/>}/> 
          <Route path='/createBlog' element={<CreateBlog/>}/>
          <Route path="/blogs/:id" element={<BlogDetails />} />

        </Routes>

        <Footer/>

      </Router>

    </AuthProvider>
  )
}
export default App
