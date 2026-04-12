import React, { useState, useEffect } from "react";
import "./IndexMain.css";
import { FaUserGraduate, FaUserShield, FaEnvelope, FaLock } from "react-icons/fa";
import { Link, useNavigate } from "react-router";
import { loginUser } from "./services/fetch";

function Signin() {
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    if (localStorage.getItem('isLoggedIn') === 'true') {
      navigate('/homeUser');
    }
  }, [navigate]);

  const validateEmail = () => {
    if (role === "student" && !email.endsWith("@stu.manit.ac.in")) {
      return "Student email must end with @stu.manit.ac.in";
    }
    if (role === "admin" && !email.endsWith("@manit.ac.in")) {
      return "Admin email must end with @manit.ac.in";
    }
    return "";
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const validationError = validateEmail();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await loginUser(email, password);
      // On success, store login status and redirect to homeUser
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userRole', role);
      navigate('/homeUser');
    } catch (error) {
      setError("Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="login-box">
        <h1>🗳 Vote Management System</h1>

        {!role ? (
          <div className="role-selection">
            <button className="student-btn" onClick={() => setRole("student")}>
              <FaUserGraduate className="icon" />
              Login as Student
            </button>

            <button className="admin-btn" onClick={() => setRole("admin")}>
              <FaUserShield className="icon" />
              Login as Admin
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <h2>
              {role === "student" ? (
                <>
                  <FaUserGraduate /> Student Login
                </>
              ) : (
                <>
                  <FaUserShield /> Admin Login
                </>
              )}
            </h2>

            <div className="input-group">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                placeholder="Enter Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="login-btn" disabled={loading || !email || !password}>
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="extra-links">
              <a href="#">Forgot Password?</a>
             <Link to="/signup">New User? Sign Up</Link>
            </div>

            <button
              type="button"
              className="back-btn"
              onClick={() => setRole("")}
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Signin;