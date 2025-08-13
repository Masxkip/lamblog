import { useContext, useState } from "react";
import { PaystackButton } from "react-paystack";
import AuthContext from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Flame } from "lucide-react";

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

      await refreshUser(); // update user data

   localStorage.setItem("justSubscribedLogin", "true");
   localStorage.setItem("justSubscribedHome", "true");
   navigate("/login");

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
    <div className="subscribe-page">
      <div className="subscribe-box">
      <div className="badge">
          <Flame size={16} /> Best Value
        </div>

        <h2 className="subscribe-title">Go Premium</h2>
        <p className="subscribe-price">₦100 / month</p>
        <p className="subscribe-subtext">Enjoy full access to premium features</p>

        <ul className="benefits-list">
          <li>
            <CheckCircle className="check-icon" size={18} /> Reach a wider audience with your posts
          </li>
          <li>
            <CheckCircle className="check-icon" size={18} /> Add and download music in your posts
          </li>
          <li>
            <CheckCircle className="check-icon" size={18} /> Create exclusive premium posts
          </li>
          <li>
            <CheckCircle className="check-icon" size={18} /> Discover premium content faster
          </li>
          <li>
            <CheckCircle className="check-icon" size={18} /> Support the SEEK community
          </li>
        </ul>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <PaystackButton {...componentProps} />
    </div>
    </div>
    
  );
}

export default Subscribe;
