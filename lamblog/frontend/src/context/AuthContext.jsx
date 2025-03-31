// AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import jwtDecode from "jwt-decode"; // ✅ Decode JWT to check expiry

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Function to check if JWT is expired
  const isTokenExpired = (token) => {
    try {
      const { exp } = jwtDecode(token);
      const now = Date.now() / 1000;
      return exp < now;
    } catch {
      return true; // treat invalid token as expired
    }
  };  

  // ✅ Logout + Redirect
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/"; // force redirect to login
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (token && isTokenExpired(token)) {
      logout();
      alert("Your session has expired. Please log in again.");
    } else {
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }

    setLoading(false);
  }, []);

  // ✅ Optional: check every 60 seconds to auto-kick expired session
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem("token");
      if (token && isTokenExpired(token)) {
        logout();
        alert("Session expired. Please log in again.");
      }
    }, 60000); // every 1 min

    return () => clearInterval(interval);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{ user, login, updateUserProfile, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
