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
    <div className="subscribe-box">
      <h2 className="subscribe-title">Go Premium</h2>
      <p className="subscribe-price">₦500 / month</p>
      <p className="subscribe-subtext">Enjoy full access to premium features</p>

      <ul className="benefits-list">
        <li><span className="checkmark">✔</span> Reach a wider audience with your posts</li>
        <li><span className="checkmark">✔</span> Add and download music in your posts</li>
        <li><span className="checkmark">✔</span> Create exclusive premium posts</li>
        <li><span className="checkmark">✔</span> Discover all premium content faster</li>
        <li><span className="checkmark">✔</span> Support the SLXXK community</li>
      </ul>

      <button className="subscribe-btn" onClick={() => initializePayment(onSuccess, onClose)}>
        Subscribe Now
      </button>
    </div>
  </div>
);

};

export default Subscribe;
