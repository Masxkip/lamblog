// axiosInterceptor.js
import axios from "axios";

// Get backend URL from .env
const API_URL = import.meta.env.VITE_BACKEND_URL;

// Create a custom Axios instance
const API = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Request Interceptor – attach token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor – handle expired token (401)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear user session
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;
