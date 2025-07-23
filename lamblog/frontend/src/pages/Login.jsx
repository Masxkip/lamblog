import { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Detect post-subscription login
  const subscribed = new URLSearchParams(location.search).get("subscribed") === "true";

  useEffect(() => {
    if (subscribed) {
      setSuccess("🎉 Subscription successful! Please log in to access premium features.");
    }
  }, [subscribed]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      const { token, user } = response.data;
      login(user, token);

      // ✅ After login, banner will be shown in Home.jsx via sessionStorage
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };


  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        {/* Left side content */}
        <div className="auth-info">
          <h3>Don’t have an account? Register one Today</h3>
          <Link to="/register" className="auth-link">Register</Link>
        </div>

        {/* Right side form */}
        <div className="auth-form">
          <h2>Login</h2>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <form onSubmit={handleSubmit}>
            <div className="form-control">
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-control password-field">
              <label>Password:</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </span>
            </div>

            <button type="submit" className="auth-button">Login</button>
          </form>

          <p style={{ marginTop: "10px" }}>
            <Link to="/forgot-password" className="auth-link">Forgot Password?</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
