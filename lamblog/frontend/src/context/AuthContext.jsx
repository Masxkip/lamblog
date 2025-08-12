import { createContext, useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_BACKEND_URL;

// Config
const INACTIVITY_MS = 60 * 60 * 1000;    // 1 hour
const REFRESH_EVERY_MS = 5 * 60 * 1000;  // every 5 mins

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const lastActiveRef = useRef(Date.now());
  const isLoggingOutRef = useRef(false);

  // --- Mark activity helper ---
  const markActive = useCallback(() => {
    const now = Date.now();
    lastActiveRef.current = now;
    localStorage.setItem("lastActive", String(now)); // sync across tabs
  }, []);

  // ✅ Login: persist token + user
  const login = useCallback((userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    markActive();
  }, [markActive]);

  // ✅ Logout: clear all + sync across tabs
  const logout = useCallback(() => {
    if (isLoggingOutRef.current) return; // prevent double calls
    isLoggingOutRef.current = true;

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);

    localStorage.setItem("authEvent", `logout:${Date.now()}`);

    setTimeout(() => { isLoggingOutRef.current = false; }, 500);
  }, []);

  // ✅ Update user profile manually
  const updateUserProfile = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    markActive();
  }, [markActive]);

  // ✅ Refresh user from backend
  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedUser = res.data;
      login(updatedUser, token);
    } catch (err) {
      console.error("Failed to refresh user:", err);
      logout();
    }
  }, [login, logout]);

  // Load user + lastActive on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }

    const storedLast = Number(localStorage.getItem("lastActive"));
    lastActiveRef.current = Number.isFinite(storedLast) ? storedLast : Date.now();

    setLoading(false);
  }, []);

  // Track activity events
  useEffect(() => {
    const events = ["click", "keydown", "mousemove", "scroll", "touchstart", "focus"];
    events.forEach((ev) => window.addEventListener(ev, markActive, { passive: true }));
    return () => events.forEach((ev) => window.removeEventListener(ev, markActive));
  }, [markActive]);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "lastActive" && e.newValue) {
        const v = Number(e.newValue);
        if (Number.isFinite(v)) lastActiveRef.current = v;
      }
      if (e.key === "authEvent" && e.newValue?.startsWith("logout:")) {
        logout();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [logout]);

  // Background checker: logout if idle ≥ 1h, else refresh
  useEffect(() => {
    const tick = async () => {
      const last = Number(localStorage.getItem("lastActive")) || lastActiveRef.current;
      const idleFor = Date.now() - last;

      if (idleFor >= INACTIVITY_MS) {
        logout();
      } else {
        await refreshUser();
      }
    };

    const immediate = setTimeout(tick, 1000);
    const interval = setInterval(tick, REFRESH_EVERY_MS);

    return () => {
      clearTimeout(immediate);
      clearInterval(interval);
    };
  }, [refreshUser, logout]);

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
