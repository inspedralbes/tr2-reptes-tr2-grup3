import { useNavigate, useLocation } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import LoginForm from "../../components/forms/LoginForm.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const Login = () => {
  const { login, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (email, password) => {
    await login(email, password);
    const redirectTo = location.state?.from?.pathname || "/admin";
    navigate(redirectTo, { replace: true });
  };

  if (isAuthenticated) {
    navigate("/admin", { replace: true });
  }

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "70vh" }}>
      <Card title="Acceso Enginy">
        <LoginForm onSubmit={handleSubmit} loading={loading} />
      </Card>
    </div>
  );
};

export default Login;
