// FORCE NETLIFY REDEPLOY - Updated Railway URL
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://forum-backend-production-0589.up.railway.app/api",
  withCredentials: true, // Re-enabled now that we have the correct backend
});

export default axiosInstance;