import { createContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false); 
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };


    // Function to update user profile
    const updateUserProfile = (updatedUser) => {
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser)); // Persist updated user
    };

  return (
    <AuthContext.Provider value={{ user, login, updateUserProfile, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
