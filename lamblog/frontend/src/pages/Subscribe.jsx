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
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY, // ✅ your public key
      email: defaultEmail,
      plan: "PLN_jpid681yvrnqut2", // ✅ Plan for subscriptions
      ref: new Date().getTime().toString(),
      callback: function (response) {
        // ✅ On success
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
    return (
      <div style={styles.container}>
        <h2>Please log in to subscribe.</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔒 Subscribe for Premium Access</h1>
      <p style={styles.description}>
        Get instant access to music downloads, exclusive posts, and real-time content.
      </p>
      <button style={styles.button} onClick={handlePaystack}>
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
