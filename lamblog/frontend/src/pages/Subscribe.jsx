import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL;

const Subscribe = () => {
  const { user, updateUserProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  const handlePaystack = () => {
    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY, // Must be pk_live_xxx
      email: user.email,
      plan: "PLN_jpid681yvrnqut2", // ✅ Your active plan
      ref: new Date().getTime().toString(), // Unique transaction ref
      callback: function (response) {
        verifyPayment(response.reference);
      },
      onClose: function () {
        alert("Transaction was cancelled.");
      },
    });

    handler.openIframe();
  };

  const verifyPayment = async (reference) => {
    try {
      const res = await axios.post(
        `${API_URL}/users/verify-subscription`,
        { reference },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      updateUserProfile(res.data.user);
      alert("🎉 Subscription activated!");
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("Payment succeeded, but verification failed.");
    }
  };

  return (
    <div>
      <h2>Subscribe to Premium</h2>
      <p>Full blog access for ₦500/month.</p>
      <button onClick={handlePaystack}>Subscribe Now</button>
    </div>
  );
};

export default Subscribe;
