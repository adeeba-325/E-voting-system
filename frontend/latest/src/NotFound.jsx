import React from 'react'


const NotFound = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1 className="main-heading">404 - Page Not Found</h1>
      <p style={{ color: 'white', fontSize: '1.2rem', margin: '20px 0' }}>The page you are looking for does not exist.</p>
      <a href="/" style={{ color: '#00e6ff', textDecoration: 'none', fontSize: '1.1rem', padding: '10px 20px', border: '2px solid #00e6ff', borderRadius: '5px', transition: 'all 0.3s' }}>Go back to Home</a>
    </div>
  )
}

export default NotFound