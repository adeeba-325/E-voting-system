import './App.css'
import Signin from '.'
import Signup from './signup'
import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import HomeUser from './views/User/homeUser'
import NotFound from './NotFound'
import Register from './views/User/registerUser'
import Vote from './views/User/vote'
import ViewResults from './views/User/result'
import AdminLogin from './admin/pages/AdminLogin'
import AdminRegister from './admin/pages/AdminRegister'
import AdminForgotPassword from './admin/pages/AdminForgotPassword'
import AdminDashboard from './admin/pages/AdminDashboard'

function App() {
  const location = useLocation();
  const showGlobalHeading = !location.pathname.startsWith('/admin');

  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin');
    document.body.classList.toggle('admin-route-active', isAdminRoute);
    return () => document.body.classList.remove('admin-route-active');
  }, [location.pathname]);

  return (
    <>
      <div className="app-shell">
        {showGlobalHeading && (
          <div className="main-heading">
            Welcome to MANIT Voting Portal
          </div>
        )}
      <Routes>
        <Route path="/" element={<Signin/>} />
        <Route path="/signup" element={<Signup/>} />
        <Route path='/home' element={<HomeUser/>} />
        <Route path='/homeUser' element={<HomeUser/>} />
        <Route path='/register' element={<Register/>} />
        <Route path='/vote' element={<Vote/>} />
        <Route path='/result' element={<ViewResults/>} />
        <Route path='/admin/login' element={<AdminLogin/>} />
        <Route path='/admin/signup' element={<AdminRegister/>} />
        <Route path='/admin/register' element={<AdminRegister/>} />
        <Route path='/admin/forgot-password' element={<AdminForgotPassword/>} />
        <Route path='/admin/dashboard' element={<AdminDashboard/>} />
        <Route path='/admin/dashboard/:department' element={<AdminDashboard/>} />
        <Route path='/admin/dashboard/:department/:section' element={<AdminDashboard/>} />
        <Route path="*" element={<NotFound />} />

      </Routes>

        </div>
    </>
  )
}

export default App
