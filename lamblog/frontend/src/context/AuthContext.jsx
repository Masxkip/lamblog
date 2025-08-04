import { createContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_BACKEND_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Load user from localStorage AND refresh from backend
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));

      // Immediately refresh to get latest subscription status
      axios.get(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        const updatedUser = res.data;
        login(updatedUser, token); // sync localStorage + state
      })
      .catch((err) => {
        console.error("Auto-refresh failed:", err);
        logout(); // fallback if token is invalid
      });
    } else {
      setUser(null);
    }

    setLoading(false);
  }, []);

  // ✅ Login: persist token + user
  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  // ✅ Logout: clear all
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // ✅ Manual profile update (edit profile)
  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  // ✅ Manual refresh call (e.g. after payment success)
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedUser = res.data;
      login(updatedUser, token); // re-sync
    } catch (err) {
      console.error("Failed to refresh user:", err);
      logout(); // fallback
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        updateUserProfile,
        logout,
        refreshUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
