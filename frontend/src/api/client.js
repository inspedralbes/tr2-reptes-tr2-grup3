import axios from "axios";

/**
 * Cliente HTTP configurado para comunicarse con el backend
 * Incluye interceptores para JWT automático y manejo de errores 401
 */
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: añade token JWT a cada petición
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("enginy_token");
  // Check for valid token (not null, not "null" string, not "undefined" string)
  if (token && token !== "null" && token !== "undefined") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: redirige a login si token expira (401)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo redirigir a login si es 401 Y NO es del endpoint de login
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login")
    ) {
      localStorage.removeItem("enginy_token");
      localStorage.removeItem("enginy_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default client;
