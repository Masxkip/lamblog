import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { usePaystackPayment } from "react-paystack";
import AuthContext from "../context/AuthContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL;

const Subscribe = () => {
  const { user, updateUserProfile } = useContext(AuthContext); // ✅ using updateUserProfile
  const navigate = useNavigate();

  // ✅ Prevent crash: fallback email if user is null
  const defaultEmail = user?.email || "placeholder@example.com";

  const config = {
    reference: new Date().getTime().toString(),
    email: defaultEmail,
    amount: 50000, // in kobo (₦2000)
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    plan: "PLN_jpid681yvrnqut2", // ✅ Replace with your real Paystack plan code
  };

  const initializePayment = usePaystackPayment(config);

  // ✅ Prevent rendering if user not logged in
  if (!user) {
    return (
      <div style={styles.container}>
        <h2>Please log in to subscribe.</h2>
      </div>
    );
  }

  const onSuccess = async (reference) => {
    try {
      const res = await axios.post(
        `${API_URL}/users/verify-subscription`,
        { reference: reference.reference },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      updateUserProfile(res.data.user); // ✅ update user context
      alert("🎉 Subscription verified & activated!");
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("Payment succeeded but subscription verification failed.");
    }
  };

  const onClose = () => {
    alert("Transaction was not completed.");
  };

  return (
    <div className="subscribe-page" style={styles.container}>
      <h1 style={styles.title}>🔒 Subscribe for Premium Access</h1>
      <p style={styles.description}>
        Get instant access to music downloads, exclusive posts, and real-time content.
      </p>
      <button style={styles.button} onClick={() => initializePayment(onSuccess, onClose)}>
        Subscribe Now
      </button>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "600px",
    margin: "auto",
    textAlign: "center",
    padding: "50px",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "20px",
  },
  description: {
    fontSize: "1rem",
    marginBottom: "30px",
  },
  button: {
    padding: "10px 20px",
    fontSize: "1rem",
    borderRadius: "8px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
};

export default Subscribe;
