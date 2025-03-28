import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/auth/reset-password/${token}`, { password });
      setMessage(response.data.message);
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    }

    setTimeout(() => setError(""), 5000);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-box" style={{ width: "100%", justifyContent: "center" }}>
        <div className="auth-form">
          <h2>Reset Password</h2>

          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}

          <form onSubmit={handleResetPassword}>
            <div className="form-control">
              <label>New Password:</label>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "🙈" : "👁️"}
                </span>
              </div>
            </div>

            <div className="form-control">
              <label>Confirm Password:</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-button">Reset Password</button>
          </form>

          {/* Resend link */}
          <p style={{ marginTop: "10px", textAlign: "center" }}>
            Didn’t get a reset link?{" "}
            <Link to="/forgot-password" style={{ color: "#a855f7" }}>
              Resend Link
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
