import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../axiosInterceptor";



function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await axios.post(`/api/auth/forgot-password`, { email });
      setMessage(response.data.message);
      setEmail("");

      setTimeout(() => {
        navigate("/login");
      }, 6000);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    }

    setTimeout(() => setError(""), 5000);
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
          <h2>Forgot Password</h2>

          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message} Redirecting to login...</p>}

          <form onSubmit={handleForgotPassword}>
            <div className="form-control">
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-button">Send Reset Link</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
