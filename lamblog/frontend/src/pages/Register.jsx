import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        username,
        email,
        password,
      });

      setSuccess(response.data.message);

      // Redirect to verify email
      navigate("/verify-email", { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        {/* Left-side content */}
        <div className="auth-info">
          <h3>Already have an account?</h3>
          <Link to="/login" className="auth-link">Sign in</Link>
        </div>

        {/* Form side */}
        <div className="auth-form">
          <h2>Register</h2>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <form onSubmit={handleSubmit}>
          <div className="form-control">
  <label>Username:</label>
  <input
    type="text"
    value={username}
    onChange={(e) => setUsername(e.target.value)}
    required
  />
</div>

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
            <button type="submit" className="auth-button">Register</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
