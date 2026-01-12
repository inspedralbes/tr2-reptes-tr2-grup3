import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import LoginForm from "../../components/forms/LoginForm.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

/**
 * Login.jsx
 *
 * Página de inicio de sesión.
 * Redirige según el rol del usuario:
 * - ADMIN -> /admin
 * - CENTER_COORD -> /center
 * - TEACHER -> /teacher
 */
const Login = () => {
  const { login, loading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);

  /**
   * Determina la ruta de redirección según el rol
   */
  const getRedirectPath = (role) => {
    switch (role) {
      case "ADMIN":
        return "/admin";
      case "CENTER_COORD":
        return "/center";
      case "TEACHER":
        return "/teacher";
      default:
        return "/login";
    }
  };

  const handleSubmit = async (email, password) => {
    try {
      setError(null);
      const result = await login(email, password);
      const getAllowedPrefix = (role) => {
        switch (role) {
          case "ADMIN":
            return "/admin";
          case "CENTER_COORD":
            return "/center";
          case "TEACHER":
            return "/teacher";
          default:
            return "/";
        }
      };

      // Usar el rol del usuario para redirigir
      const userRole = result?.user?.role || "ADMIN";

      const savedPath = location.state?.from?.pathname;
      const allowedPrefix = getAllowedPrefix(userRole);

      // Solo redirigir a 'savedPath' si empieza por el prefijo permitido para ese rol
      const isValidRedirect = savedPath && savedPath.startsWith(allowedPrefix);

      const redirectTo = isValidRedirect
        ? savedPath
        : getRedirectPath(userRole);

      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.error || err.message || "Error de autenticación"
      );
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getRedirectPath(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "70vh" }}>
      <Card title="Acceso Enginy">
        {error && (
          <div
            style={{
              padding: "12px",
              marginBottom: "16px",
              backgroundColor: "#fee2e2",
              border: "1px solid #ef4444",
              borderRadius: "8px",
              color: "#dc2626",
            }}
          >
            ❌ {error}
          </div>
        )}
        <LoginForm onSubmit={handleSubmit} loading={loading} />
        <div className="mt-4 text-sm text-gray-500 text-center">
          <p>Usuarios de prueba:</p>
          <p>admin@enginy.cat / admin123</p>
          <p>coord1@escola1.cat / admin123</p>
          <p>teacher@enginy.cat / admin123</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
