import { useState, useContext,  useEffect } from "react";
import { Link, useNavigate} from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import LoadingButton from "../components/LoadingButton";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [justSubscribed, setJustSubscribed] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true); 

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      const { token, user } = response.data;
      login(user, token);
      setSuccess(`Welcome, ${user.username}!`);

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };


useEffect(() => {
  const wasSubscribed = localStorage.getItem("justSubscribed") === "true";
  if (wasSubscribed) {
    setJustSubscribed(true);
    localStorage.removeItem("justSubscribed"); // ✅ Clear it immediately
    setTimeout(() => setJustSubscribed(false), 5000); // Hide after 5s
  }
}, []);


  return (
    <div className="auth-wrapper">

 {justSubscribed && (
  <div className="subscription-success-banner">
  Congratulations! You’re now a SLXXK Premium member. Enjoy exclusive content.
  </div>
)}
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


            <LoadingButton
  isLoading={loading}
  type="submit"
  className={`submit-btn ${loading ? "loading" : ""}`}
>
  Login
</LoadingButton>
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
