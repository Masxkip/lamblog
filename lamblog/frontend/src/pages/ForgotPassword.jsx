import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // ✅ Add navigation hook

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
      setMessage(response.data.message);
      setEmail(""); // ✅ Clear email field after success

      // ✅ Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    }

    // ✅ Clear error after 5 seconds
    setTimeout(() => setError(""), 5000);
  };

  return (
    <div className="auth-container">
      <h2>Forgot Password</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message} Redirecting to login...</p>} {/* ✅ Show redirect message */}
      <form onSubmit={handleForgotPassword}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit">Send Reset Link</button>
      </form>
    </div>
  );
}

export default ForgotPassword;
