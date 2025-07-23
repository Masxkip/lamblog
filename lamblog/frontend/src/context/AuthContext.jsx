import { createContext, useState, useEffect } from "react";
import axios from "axios"; // ✅ Required for API call

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on first mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login: persist token + user
  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  // Logout: clear all
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // Update user after subscription or profile change
  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  // ✅ NEW: Refresh user from backend
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !user?._id) return;

      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/users/${user._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, updateUserProfile, refreshUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
