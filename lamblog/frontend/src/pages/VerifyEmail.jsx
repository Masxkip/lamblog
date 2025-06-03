import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function VerifyEmail() {
  const location = useLocation();
  const email = location.state?.email || "";
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();


  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await axios.post(`${API_URL}/api/auth/verify-email`, {
        email,
        code,
      });

      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 2000); // Redirect to login after success
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    }
  };

  return (
    <div className="verify-container">
      
      <h2>Email Verification</h2>
      <form onSubmit={handleVerify}>
        <input
          type="text"
          placeholder="Enter verification code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <button type="submit">Verify</button>

<p style={{ marginTop: "10px" }}>
  Didn’t get a code?{" "}
  <button
    type="button"
    onClick={async () => {
      try {
        const res = await axios.post(`${API_URL}/api/auth/resend-code`, {
          email,
        });
        setMessage(res.data.message);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to resend code");
      }
    }}
    style={{ background: "none", border: "none", color: "blue", cursor: "pointer" }}
  >
    Resend Code
  </button>
</p>
      </form>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default VerifyEmail;
