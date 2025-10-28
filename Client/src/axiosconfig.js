// NUCLEAR NETLIFY CACHE CLEAR - Force complete rebuild
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://forum-backend-production-0589.up.railway.app/api",
  withCredentials: true,
});

// Force cache busting
console.log("🚀 Frontend connecting to:", axiosInstance.defaults.baseURL);

export default axiosInstance;