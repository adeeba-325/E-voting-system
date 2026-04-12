import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Index from '.'
import './App.css'
import Signin from '.'
import Signup from './signup'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomeUser from './views/User/homeUser'
import NotFound from './NotFound'

function App() {

  return (
    <>
      <div>
        <div className="main-heading">
  Welcome to MANIT Voting Portal
</div>
      <Routes>
        <Route path="/" element={<Signin/>} />
        <Route path="/signup" element={<Signup/>} />
        <Route path='/homeUser' element={<HomeUser/>} />
        <Route path="*" element={<NotFound />} />

      </Routes>

        </div>
    </>
  )
}

export default App
