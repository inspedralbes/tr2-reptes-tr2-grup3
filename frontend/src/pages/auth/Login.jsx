import { useEffect } from "react";
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

  /**
   * Determina la ruta de redirección según el rol
   */
  const getRedirectPath = (role) => {
    switch (role) {
      case 'ADMIN':
        return '/admin';
      case 'CENTER_COORD':
        return '/center';
      case 'TEACHER':
        return '/teacher';
      default:
        return '/login';
    }
  };

  const handleSubmit = async (email, password) => {
    const result = await login(email, password);
    // Usar el rol del usuario para redirigir
    const userRole = result?.user?.role || 'ADMIN';
    const redirectTo = location.state?.from?.pathname || getRedirectPath(userRole);
    navigate(redirectTo, { replace: true });
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getRedirectPath(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "70vh" }}>
      <Card title="Acceso Enginy">
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
