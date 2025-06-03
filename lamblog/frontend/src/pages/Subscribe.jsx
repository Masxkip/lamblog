import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL;

const Subscribe = () => {
  const { user, updateUserProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  const defaultEmail = user?.email || "placeholder@example.com";

  const handlePaystack = () => {
    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY, // ✅ Must be valid pk_live_xxx
      email: defaultEmail,
      ref: new Date().getTime().toString(), // Unique transaction reference
      plan: "PLN_jpid681yvrnqut2", // ✅ Subscription plan code
      callback: function (response) {
        // ✅ Successful payment - verify with backend
        verifyPayment(response.reference);
      },
      onClose: function () {
        alert("Transaction was not completed.");
      },
    });

    handler.openIframe();
  };

  const verifyPayment = async (reference) => {
    try {
        console.log("Paystack Key:", import.meta.env.VITE_PAYSTACK_PUBLIC_KEY);
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
      alert("🎉 Subscription verified & activated!");
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("Payment succeeded but verification failed.");
    }
  };

  if (!user) {
    return <div>Please log in to subscribe.</div>;
  }

  return (
    <div>
      <h2>Subscribe for Premium</h2>
      <p>Get access to exclusive content and features.</p>
      <button onClick={handlePaystack}>Subscribe Now</button>
    </div>
  );
};

export default Subscribe;
