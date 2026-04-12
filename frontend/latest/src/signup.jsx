import { useState } from "react";
import './signup.css';
import { Link, useNavigate } from "react-router-dom";
import { addUserToServer } from "./services/connect";

function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    name: "",
    branch: "",
    scholarNumber: "",
    section: "",
    year: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState({});

  // ✅ VALIDATION FUNCTION
  const validate = (data = formData) => {
    let newErrors = {};

    // Name
    if (!data.name.trim()) {
      newErrors.name = "Name is required";
    } else if (data.name.length < 3) {
      newErrors.name = "Minimum 3 characters required";
    } else if (!/^[a-zA-Z\s]+$/.test(data.name)) {
      newErrors.name = "Only letters allowed";
    }

    // Email
    if (!data.email.endsWith("@stu.manit.ac.in")) {
      newErrors.email = "Must be MANIT email";
    }

    // Scholar Number
    if (!data.scholarNumber) {
      newErrors.scholarNumber = "Scholar number required";
    } else if (data.email && data.scholarNumber !== data.email.split("@")[0]) {
      newErrors.scholarNumber = "Must match email prefix";
    }

    // Password
    if (data.password.length < 8) {
      newErrors.password = "Min 8 characters";
    } else if (!/[A-Z]/.test(data.password)) {
      newErrors.password = "Must include uppercase";
    } else if (!/[a-z]/.test(data.password)) {
      newErrors.password = "Must include lowercase";
    } else if (!/[!@#$%^&*()_.?\-,;{}|]/.test(data.password)) {
      newErrors.password = "Must include special character";
    }

    // Confirm Password
    if (data.confirmPassword !== data.password) {
      newErrors.confirmPassword = "Passwords must match";
    }

    // Other fields
    if (!data.branch) newErrors.branch = "Select branch";
    if (!data.year) newErrors.year = "Select year";
    if (!data.section) newErrors.section = "Select section";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ HANDLE CHANGE
  const handleChange = (e) => {
    const updatedData = {
      ...formData,
      [e.target.name]: e.target.value
    };

    setFormData(updatedData);
    validate(updatedData); // real-time validation
  };

  // ✅ HANDLE SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!validate()) return;

    try {
      const res = await addUserToServer({ userInfo: formData });
      setMessage(res.message);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setMessage(err.message);
    }
  };

  // ✅ BUTTON ENABLE CONDITION
  const isFormValid =
    Object.keys(errors).length === 0 &&
    Object.values(formData).every(val => val !== "");

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2>MANIT Voting Portal</h2>
        <p className="subtitle">Student Signup</p>

        <form onSubmit={handleSubmit}>

          <input type="text" name="name" placeholder="Full Name" onChange={handleChange} />
          {errors.name && <p className="error">{errors.name}</p>}

          <select name="branch" onChange={handleChange}>
            <option value="">Select Branch</option>
            <option value="CSE">CSE</option>
            <option value="MDS">MDS</option>
            <option value="ECE">ECE</option>
            <option value="EE">EE</option>
            <option value="ME">ME</option>
            <option value="CE">CE</option>
            <option value="CHE">CHE</option>
            <option value="MME">MME</option>
            <option value="Architecture">Architecture</option>
            <option value="Planning">Planning</option>
            <option value="Management">MBA</option>
          </select>
          {errors.branch && <p className="error">{errors.branch}</p>}

          <input type="text" name="scholarNumber" placeholder="Scholar Number" onChange={handleChange} />
          {errors.scholarNumber && <p className="error">{errors.scholarNumber}</p>}

          <select name="year" onChange={handleChange}>
            <option value="">Select year</option>
            <option value="first">1st</option>
            <option value="second">2nd</option>
            <option value="third">3rd</option>
            <option value="fourth">4th</option>
          </select>
          {errors.year && <p className="error">{errors.year}</p>}

          <select name="section" onChange={handleChange}>
            <option value="">Select Section</option>
            <option value="1">Section 1</option>
            <option value="2">Section 2</option>
            <option value="3">Section 3</option>
          </select>
          {errors.section && <p className="error">{errors.section}</p>}

          <div className="email-box">
            <input type="text" name="email" placeholder="College ID" onChange={handleChange} />
            <span>@stu.manit.ac.in</span>
          </div>
          {errors.email && <p className="error">{errors.email}</p>}

          <div className="password-box">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter Password"
              onChange={handleChange}
            />
            <span onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>
          {errors.password && <p className="error">{errors.password}</p>}

          <div className="password-box">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Re-enter Password"
              onChange={handleChange}
            />
            <span onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? "Hide" : "Show"}
            </span>
          </div>
          {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}

          <button type="submit" disabled={!isFormValid}>
            Create Account
          </button>
        </form>

        <p>{message}</p>

        <div className="signin-link">
          <Link to="/">Already have an account? Sign-in</Link>
        </div>
      </div>
    </div>
  );
}
export default Signup;