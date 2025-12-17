import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p>Loading session...</p>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;

  return children;
};

export default ProtectedRoute;
