import { createContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_BACKEND_URL;
const IDLE_LIMIT_MS = 60 * 60 * 1000;          // 60 minutes inactivity = logout
const REFRESH_EARLY_MS = 5 * 60 * 1000;        // refresh 5 min before expiry

const parseJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // timers & flags
  const idleTimerRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const axiosReqInterceptorRef = useRef(null);
  const axiosResInterceptorRef = useRef(null);
  const isRefreshingRef = useRef(false);
  const refreshWaitersRef = useRef([]); // pending requests waiting for a new token

  const broadcastLogout = () => {
    try {
      localStorage.setItem("forceLogout", String(Date.now()));
    } catch {
  /* ignore storage errors */
}
  };

  const logout = useCallback((reason) => {
    broadcastLogout();
    if (reason) {
      try {
        localStorage.setItem("logoutReason", reason);
      } catch {
  /* ignore storage errors */
}
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, []);

  const setToken = (token) => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  };

  // ----- idle (inactivity) logout -----
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    try {
      localStorage.setItem("lastActivity", String(Date.now()));
    } catch {
  /* ignore storage errors */
}
    idleTimerRef.current = setTimeout(() => logout("inactive"), IDLE_LIMIT_MS);
  }, [logout]);

  const startIdleTimer = useCallback(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  // ----- schedule silent token refresh before exp -----
  const notifyRefreshWaiters = (newToken) => {
    refreshWaitersRef.current.forEach((resume) => resume(newToken));
    refreshWaitersRef.current = [];
  };

  const refreshAccessToken = useCallback(async () => {
    if (isRefreshingRef.current) {
      // someone else is refreshing; return a promise that resolves when done
      return new Promise((resolve, reject) => {
        refreshWaitersRef.current.push((newToken) => {
          if (newToken) resolve(newToken);
          else reject(new Error("Refresh failed"));
        });
      });
    }
    isRefreshingRef.current = true;
    try {
      const oldToken = localStorage.getItem("token");
      if (!oldToken) throw new Error("No token");
      const res = await axios.post(
        `${API_URL}/auth/refresh-token`,
        {},
        { headers: { Authorization: `Bearer ${oldToken}` } }
      );
      const newToken = res.data?.token;
      if (!newToken) throw new Error("No token in refresh");
      setToken(newToken);
      scheduleTokenRefresh(newToken); // schedules next silent refresh
      notifyRefreshWaiters(newToken);
      return newToken;
    } catch (e) {
      notifyRefreshWaiters(null);
      throw e;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [scheduleTokenRefresh]); // <-- include helper

  const scheduleTokenRefresh = useCallback((token) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const payload = parseJwt(token);
    const expMs = payload?.exp ? payload.exp * 1000 : 0;
    let msUntilRefresh = expMs - Date.now() - REFRESH_EARLY_MS;
    if (!expMs) return; // invalid token
    if (msUntilRefresh < 5000) msUntilRefresh = 5000; // avoid tight loop
    refreshTimerRef.current = setTimeout(() => {
      refreshAccessToken().catch(() => logout("session_expired"));
    }, msUntilRefresh);
  }, [logout, refreshAccessToken]); // <-- include both

  // ----- login AFTER helpers so deps can be listed -----
  const login = useCallback((userData, token) => {
    setToken(token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    scheduleTokenRefresh(token);
    startIdleTimer();
  }, [scheduleTokenRefresh, startIdleTimer]); // <-- add missing deps

  const updateUserProfile = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedUser = res.data;
      // keep token as is
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch {
      logout("session_expired");
    }
  }, [logout]);

  // ----- boot: restore session -----
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      scheduleTokenRefresh(token);
      startIdleTimer();
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [scheduleTokenRefresh, startIdleTimer]);

  // ----- global activity listeners & cross-tab sync -----
  useEffect(() => {
    if (!user) return;

    const onActivity = () => resetIdleTimer();
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));

    const onStorage = (e) => {
      if (e.key === "forceLogout") logout();
      if (e.key === "lastActivity") resetIdleTimer();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, onActivity));
      window.removeEventListener("storage", onStorage);
    };
  }, [user, resetIdleTimer, logout]);

  // ----- axios interceptors: attach token; on 401 try one refresh & retry -----
  useEffect(() => {
    axiosReqInterceptorRef.current = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    axiosResInterceptorRef.current = axios.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config;
        const status = error?.response?.status;
        const msg = error?.response?.data?.message;

        // Only try once per request
        if (
          status === 401 &&
          (msg === "TokenExpired" || msg === "Invalid Token" || msg === "InvalidToken") &&
          !original._retry
        ) {
          original._retry = true;
          try {
            const newToken = await refreshAccessToken();
            original.headers.Authorization = `Bearer ${newToken}`;
            return axios(original); // retry once
          } catch {
            logout("session_expired");
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      if (axiosReqInterceptorRef.current !== null) {
        axios.interceptors.request.eject(axiosReqInterceptorRef.current);
      }
      if (axiosResInterceptorRef.current !== null) {
        axios.interceptors.response.eject(axiosResInterceptorRef.current);
      }
    };
  }, [refreshAccessToken, logout]);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      updateUserProfile,
      logout,
      refreshUser,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
