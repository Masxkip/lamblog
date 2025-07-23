import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { usePaystackPayment } from "react-paystack";
import { CheckCircle, Flame } from "lucide-react";
import AuthContext from "../context/AuthContext";
import BackArrow from "../components/BackArrow";
import axios from "axios";

const Subscribe = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const email = user?.email || "user@example.com";

  const config = {
    reference: new Date().getTime().toString(),
    email: email,
    amount: 10000,
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    plan: "PLN_wneh0dnfabvv1cq",
    channels: ["card"],
  };

const onSuccess = async (reference) => {
  try {
    await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/users/verify-subscription`,
      { reference: reference.reference },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    // ✅ Set flag to show banner on Home after login
    sessionStorage.setItem("justSubscribed", "true");

    // ✅ Redirect to login with query
    navigate("/login?subscribed=true");
  } catch (error) {
    console.error("❌ Verification failed", error);
    alert("Payment verified but user update failed.");
  }
};


  const onClose = () => {
    alert("Payment window closed.");
  };

  const initializePayment = usePaystackPayment(config);

  return (
    <div className="subscribe-page">
       <BackArrow />
      <div className="subscribe-box">
        <div className="badge">
          <Flame size={16} /> Best Value
        </div>

        <h2 className="subscribe-title">Go Premium</h2>
        <p className="subscribe-price">₦500 / month</p>
        <p className="subscribe-subtext">Enjoy full access to premium features</p>

        <ul className="benefits-list">
          <li><CheckCircle className="check-icon" size={18} /> Reach a wider audience with your posts</li>
          <li><CheckCircle className="check-icon" size={18} /> Add and download music in your posts</li>
          <li><CheckCircle className="check-icon" size={18} /> Create exclusive premium posts</li>
          <li><CheckCircle className="check-icon" size={18} /> Discover premium content faster</li>
          <li><CheckCircle className="check-icon" size={18} /> Support the SLXXK community</li>
        </ul>

        <button className="subscribe-btn" onClick={() => initializePayment(onSuccess, onClose)}>
          Subscribe Now
        </button>
      </div>
    </div>
  );
};

export default Subscribe;
