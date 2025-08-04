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

  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const amount = 10000; // NGN 100 in kobo
  const planCode = "PLN_wneh0dnfabvv1cq";

  const handleSuccess = async (reference) => {
    try {
      setLoading(true);
      await axios.post(
        `${backendURL}/api/users/verify-subscription`,
        { reference: reference.reference },
        { withCredentials: true }
      );
      await refreshUser(); // update context
      navigate("/"); // or navigate to premium page
    } catch (err) {
      console.error("Verification error:", err);
      setError("Subscription verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    console.log("Payment window closed");
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
      <p>Access exclusive content for just ₦100/month</p>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <PaystackButton {...componentProps} />
    </div>
  );
}

export default Subscribe;
