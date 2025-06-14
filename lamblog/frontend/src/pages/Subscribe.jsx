import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { usePaystackPayment } from "react-paystack";
import AuthContext from "../context/AuthContext";
import axios from "axios";

const Subscribe = () => {
  const { user, updateUserProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fallback email
  const email = user?.email || "user@example.com";

  const config = {
    reference: new Date().getTime().toString(),
    email: email,
    amount: 10000, // ₦500 in kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    plan: "PLN_jpid681yvrnqut2",
    channels: ["card"]
  };

  const onSuccess = async (reference) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/users/verify-subscription`, { reference: reference.reference }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      updateUserProfile(res.data.user);
      alert("Subscription successful!");
      navigate("/");
    } catch (error) {
      console.error("Verification failed", error);
      alert("Payment verified but user update failed.");
    }
  };

  const onClose = () => {
    alert("Payment window closed.");
  };

  const initializePayment = usePaystackPayment(config);

  return (
    <div className="subscribe-page">
      <h2>Subscribe to Premium</h2>
      <p>₦500 per month for full blog access</p>
      <button onClick={() => initializePayment(onSuccess, onClose)}>Subscribe Now</button>
    </div>
  );
};

export default Subscribe;
