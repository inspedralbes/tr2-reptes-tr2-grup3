import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoginForm from "../../components/forms/LoginForm.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { LogIn, AlertCircle } from "lucide-react";
import client from "../../api/client";

/**
 * Login.jsx
 * Página de inicio de sesión con diseño responsive.
 */
const Login = () => {
  const { login, loading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [activePhase, setActivePhase] = useState(null);

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

  useEffect(() => {
    // Load active enrollment period to know current phase (used to show teacher accounts)
    const loadActivePeriod = async () => {
      try {
        const periodsRes = await client.get("/enrollment/periods?status=ACTIVE");
        if (periodsRes.data && periodsRes.data.length > 0) {
          setActivePhase(periodsRes.data[0].current_phase);
        }
      } catch (err) {
        // ignore errors here (login page should still work offline/test)
        console.debug("Could not load active period:", err?.message || err);
      }
    };

    loadActivePeriod();
  }, []);

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

            {/* Test credentials: grouped and conditional teachers */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-3 uppercase tracking-wider font-semibold">
                Comptes de prova (contrassenya comuna)
              </p>

              {/* Accounts that always use admin password */}
              <div className="grid gap-2 text-xs">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Admin</span>
                  <code className="text-gray-900 font-mono">admin@enginy.cat</code>
                </div>

                <div className="text-xs text-gray-500 font-semibold mt-2 mb-1">Coordinadors</div>
                {[
                  "coord@elroure.cat",
                  "coord@mediterrani.cat",
                  "coord@lamarina.cat",
                  "coord@lescorts.cat",
                  "coord@santjordi.cat",
                  "coord@gaudi.cat",
                ].map((c) => (
                  <div key={c} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">{c}</span>
                    <code className="text-gray-900 font-mono">{c}</code>
                  </div>
                ))}

                <p className="text-center text-gray-400 mt-2">
                  Contrasenya per a tots: <code className="font-mono text-gray-600">admin123</code>
                </p>
              </div>

              {/* Teachers: either shown only in EJECUCION with password 123, or always grouped above */}
              {activePhase === "EJECUCION" ? (
                <div className="mt-4">
                  <p className="text-xs text-gray-400 text-center mt-3 mb-2 font-semibold">Professors (creats - fase EJECUCIÓ)</p>
                  <div className="grid gap-1 text-xs">
                    {[
                      "jordi.lopez@elroure.cat",
                      "marta.sanchez@elroure.cat",
                      "carles.prat@mediterrani.cat",
                      "nuria.camps@mediterrani.cat",
                      "albert.riera@mediterrani.cat",
                      "elena.ruiz@lamarina.cat",
                      "david.moreno@lamarina.cat",
                      "cristina.valls@lescorts.cat",
                      "sergi.mas@lescorts.cat",
                      "rosa.blanc@santjordi.cat",
                      "pau.vilar@santjordi.cat",
                      "gemma.rius@santjordi.cat",
                      "xavier.costa@gaudi.cat",
                      "laia.pujol@gaudi.cat",
                    ].map((t) => (
                      <div key={t} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">{t}</span>
                        <code className="text-gray-900 font-mono">123</code>
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-gray-400 mt-2">En fase d'execució, les contrasenyes generades es mostraran aquí (per ara: <code className="font-mono">123</code>).</p>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-xs text-gray-400 text-center mt-3 mb-2 font-semibold">Professors (visibles a execució)</p>
                  <p className="text-center text-gray-400 text-xs">Els comptes de professors i les seves contrasenyes automàtiques es mostraran quan la fase arribi a <strong>EXECUCIÓ</strong>.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
