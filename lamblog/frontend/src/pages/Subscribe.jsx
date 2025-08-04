import { useContext, useState } from "react";
import { PaystackButton } from "react-paystack";
import AuthContext from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Subscribe() {
  const { user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false); // ✅ new state

  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const amount = 10000; // NGN 100 in kobo
  const planCode = "PLN_wneh0dnfabvv1cq";

  const handleSuccess = async (reference) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      await axios.post(
        `${backendURL}/api/users/verify-subscription`,
        { reference: reference.reference },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      await refreshUser(); // ✅ update UI immediately
      setSuccess(true); // ✅ show success message

      // ✅ redirect after short delay
      setTimeout(() => {
        navigate("/");
      }, 2500);
    } catch (err) {
      console.error("Verification error:", err);
      setError("Subscription verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    console.log("Payment popup closed.");
  };

  const componentProps = {
    email: user.email,
    amount,
    plan: planCode,
    publicKey,
    text: loading ? "Processing..." : "Subscribe Now",
    onSuccess: handleSuccess,
    onClose: handleClose,
    disabled: loading,
    className: "subscribe-button",
  };

  return (
    <div className="subscribe-container">
      <h2>Subscribe to Premium</h2>
      <p>Get full access for ₦100/month</p>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>🎉 Subscription successful! Redirecting...</p>}

      {!success && <PaystackButton {...componentProps} />}
    </div>
  );
}

export default Subscribe;
