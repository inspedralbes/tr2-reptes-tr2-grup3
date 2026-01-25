import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoginForm from "../../components/forms/LoginForm.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { LogIn, AlertCircle } from "lucide-react";

/**
 * Login.jsx
 * Página de inicio de sesión con diseño responsive.
 */
const Login = () => {
  const { login, loading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);

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

      const userRole = result?.user?.role || "ADMIN";
      const savedPath = location.state?.from?.pathname;
      const allowedPrefix = getAllowedPrefix(userRole);
      const isValidRedirect = savedPath && savedPath.startsWith(allowedPrefix);
      const redirectTo = isValidRedirect ? savedPath : getRedirectPath(userRole);

      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.error || err.message || "Error d'autenticació"
      );
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getRedirectPath(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Card container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
              <LogIn className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white">Accés Enginy</h1>
            <p className="text-blue-100 mt-2 text-sm">
              Plataforma de gestió de tallers educatius
            </p>
          </div>

          {/* Form section */}
          <div className="p-6">
            {error && (
              <div className="flex items-start gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <AlertCircle className="shrink-0 mt-0.5" size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <LoginForm onSubmit={handleSubmit} loading={loading} />

            {/* Test credentials: admin, coordinadores y profesores */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-3 uppercase tracking-wider font-semibold">
                Usuaris de prova (totes les fases)
              </p>
              <div className="grid gap-2 text-xs">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Admin:</span>
                  <code className="text-gray-900 font-mono">admin@enginy.cat</code>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Coordinadors:</span>
                  <code className="text-gray-900 font-mono">coord@elroure.cat</code>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">coord@mediterrani.cat</span>
                  <code className="text-gray-900 font-mono">coord@mediterrani.cat</code>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">coord@lamarina.cat</span>
                  <code className="text-gray-900 font-mono">coord@lamarina.cat</code>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">coord@lescorts.cat</span>
                  <code className="text-gray-900 font-mono">coord@lescorts.cat</code>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">coord@santjordi.cat</span>
                  <code className="text-gray-900 font-mono">coord@santjordi.cat</code>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">coord@gaudi.cat</span>
                  <code className="text-gray-900 font-mono">coord@gaudi.cat</code>
                </div>
                <p className="text-xs text-gray-400 text-center mt-3 mb-1 font-semibold">Professors (fase execució):</p>
                <div className="grid gap-1 text-xs">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">jordi.lopez@elroure.cat</span>
                    <code className="text-gray-900 font-mono">jordi.lopez@elroure.cat</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">marta.sanchez@elroure.cat</span>
                    <code className="text-gray-900 font-mono">marta.sanchez@elroure.cat</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">carles.prat@mediterrani.cat</span>
                    <code className="text-gray-900 font-mono">carles.prat@mediterrani.cat</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">nuria.camps@mediterrani.cat</span>
                    <code className="text-gray-900 font-mono">nuria.camps@mediterrani.cat</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">albert.riera@mediterrani.cat</span>
                    <code className="text-gray-900 font-mono">albert.riera@mediterrani.cat</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">elena.ruiz@lamarina.cat</span>
                    <code className="text-gray-900 font-mono">elena.ruiz@lamarina.cat</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">david.moreno@lamarina.cat</span>
                    <code className="text-gray-900 font-mono">david.moreno@lamarina.cat</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">cristina.valls@lescorts.cat</span>
                    <code className="text-gray-900 font-mono">cristina.valls@lescorts.cat</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">sergi.mas@lescorts.cat</span>
                    <code className="text-gray-900 font-mono">sergi.mas@lescorts.cat</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">rosa.blanc@santjordi.cat</span>
                    <code className="text-gray-900 font-mono">rosa.blanc@santjordi.cat</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">pau.vilar@santjordi.cat</span>
                    <code className="text-gray-900 font-mono">pau.vilar@santjordi.cat</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">gemma.rius@santjordi.cat</span>
                    <code className="text-gray-900 font-mono">gemma.rius@santjordi.cat</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">xavier.costa@gaudi.cat</span>
                    <code className="text-gray-900 font-mono">xavier.costa@gaudi.cat</code>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">laia.pujol@gaudi.cat</span>
                    <code className="text-gray-900 font-mono">laia.pujol@gaudi.cat</code>
                  </div>
                </div>
                <p className="text-center text-gray-400 mt-2">
                  Contrasenya per a tots: <code className="font-mono text-gray-600">admin123</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
