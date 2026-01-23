import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import LoginForm from "../components/forms/LoginForm";

const Login = () => {
    const { login, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === "ADMIN") navigate("/admin");
            else if (user.role === "COORDINATOR") navigate("/center"); // Or /center/dashboard
            else if (user.role === "TEACHER") navigate("/teacher");
            else navigate("/");
        }
    }, [isAuthenticated, user, navigate]);

    const handleLogin = async (email, password) => {
        try {
            setError(null);
            setLoading(true);
            await login(email, password);
            // Navigation handled by useEffect
        } catch (err) {
            setError(err.message || "Error en iniciar sessió");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            height: "100vh", padding: "20px", gap: "20px"
        }}>
            <img src="/CEB_logo_blau.png" alt="Logo" style={{ height: "60px" }} />
            <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Accés usuaris</h1>
            {error && <div style={{ color: "red" }}>{error}</div>}
            <LoginForm onSubmit={handleLogin} loading={loading} />
        </div>
    );
};

export default Login;
