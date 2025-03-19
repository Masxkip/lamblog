import { createContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
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


    // Function to update user profile in context
    const updateUserProfile = (updatedUser) => {
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser)); // Persist updated user
    };

  return (
    <AuthContext.Provider value={{ user, login, updateUserProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
