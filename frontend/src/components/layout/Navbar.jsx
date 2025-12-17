import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 24px",
        borderBottom: "1px solid #e5e7eb",
        background: "#fff",
      }}
    >
      <Link to="/" style={{ fontWeight: 700, textDecoration: "none", color: "#111" }}>
        Enginy
      </Link>
      <nav style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        {isAuthenticated && user ? <span style={{ color: "#374151" }}>{user.email}</span> : null}
        {isAuthenticated ? (
          <button onClick={logout} style={{ padding: "8px 12px", cursor: "pointer" }}>
            Logout
          </button>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
