import { createContext, useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_BACKEND_URL;

// Inactivity window
const INACTIVITY_MS = 60 * 60 * 1000; // 1 hour

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Refs for idle tracking
  const lastActiveRef = useRef(Date.now());
  const logoutTimerRef = useRef(null);

  // --- core helpers ---
  const clearLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const scheduleLogout = useCallback(() => {
    clearLogoutTimer();

    const last = lastActiveRef.current;
    const timeSince = Date.now() - last;
    const timeLeft = INACTIVITY_MS - timeSince;

    if (timeLeft <= 0) {
      // Already idle long enough
      localStorage.setItem("authEvent", `logout:${Date.now()}`);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      return;
    }

    logoutTimerRef.current = setTimeout(() => {
      // Idle reached -> log out
      localStorage.setItem("authEvent", `logout:${Date.now()}`);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }, timeLeft);
  }, [clearLogoutTimer]);

  const markActive = useCallback(() => {
    const now = Date.now();
    lastActiveRef.current = now;
    localStorage.setItem("lastActive", String(now)); // optional cross-tab sync
    scheduleLogout();
  }, [scheduleLogout]);

  // --- auth actions ---
  const login = useCallback((userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    // (Re)start activity clock on login
    if (!localStorage.getItem("lastActive")) {
      localStorage.setItem("lastActive", String(Date.now()));
    }
    lastActiveRef.current = Number(localStorage.getItem("lastActive")) || Date.now();
    scheduleLogout();
  }, [scheduleLogout]);

  const logout = useCallback(() => {
    localStorage.setItem("authEvent", `logout:${Date.now()}`); // cross-tab
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    clearLogoutTimer();
  }, [clearLogoutTimer]);

  const updateUserProfile = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    markActive();
  }, [markActive]);

  // Keep this available (e.g., for profile screens), but don't auto-call it.
  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedUser = res.data;
      // re-apply login to keep localStorage + state synced
      login(updatedUser, token);
    } catch (err) {
      const status = err?.response?.status;
      // Only hard-logout on real auth failures; keep session on network hiccups
      if (status === 401 || status === 403) {
        logout();
      } else {
        console.warn("refreshUser failed (network or server). Keeping session.", err);
      }
    }
  }, [login, logout]);

  // --- initial load ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }

    // Restore lastActive (don’t force logout on simple page refresh)
    const storedLast = Number(localStorage.getItem("lastActive"));
    lastActiveRef.current = Number.isFinite(storedLast) ? storedLast : Date.now();
    if (!Number.isFinite(storedLast)) {
      localStorage.setItem("lastActive", String(lastActiveRef.current));
    }

    // Schedule logout precisely when inactivity hits 1h
    scheduleLogout();

    setLoading(false);
  }, [scheduleLogout]);

  // --- track activity (resets the single timeout) ---
  useEffect(() => {
    const events = ["click", "keydown", "mousemove", "scroll", "touchstart", "focus"];
    events.forEach((ev) => window.addEventListener(ev, markActive, { passive: true }));
    return () => events.forEach((ev) => window.removeEventListener(ev, markActive));
  }, [markActive]);

  // --- optional: cross-tab sync for lastActive + centralized logout ---
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "lastActive" && e.newValue) {
        const v = Number(e.newValue);
        if (Number.isFinite(v)) {
          lastActiveRef.current = v;
          scheduleLogout();
        }
      }
      if (e.key === "authEvent" && e.newValue?.startsWith("logout:")) {
        // another tab logged out
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        clearLogoutTimer();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [scheduleLogout, clearLogoutTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearLogoutTimer();
  }, [clearLogoutTimer]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        updateUserProfile,
        logout,
        refreshUser, // available, but not auto-called
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
