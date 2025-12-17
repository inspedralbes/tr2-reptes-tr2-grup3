import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const linkStyle = ({ isActive }) => ({
  padding: "10px 14px",
  display: "block",
  textDecoration: "none",
  color: isActive ? "#111" : "#374151",
  background: isActive ? "#e0f2fe" : "transparent",
  borderRadius: "8px",
});

const Sidebar = () => {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isCenter = user?.role === 'CENTER_COORD';
  const isTeacher = user?.role === 'TEACHER';

  return (
    <aside
      style={{
        width: "220px",
        borderRight: "1px solid #e5e7eb",
        padding: "16px",
        background: "#f9fafb",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: "12px" }}>Navegación</div>
      {!isAuthenticated ? (
        <NavLink to="/login" style={linkStyle}>
          Login
        </NavLink>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* ==================== ZONA ADMIN ==================== */}
          {isAdmin && (
            <>
              <span style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>Admin</span>
              <NavLink to="/admin" style={linkStyle}>
                📊 Dashboard
              </NavLink>
              <NavLink to="/admin/enrollment" style={linkStyle}>
                📅 Períodos
              </NavLink>
              <NavLink to="/admin/catalog" style={linkStyle}>
                📚 Catálogo
              </NavLink>
              <NavLink to="/admin/requests" style={linkStyle}>
                📋 Solicitudes
              </NavLink>
              <NavLink to="/admin/allocation" style={linkStyle}>
                🎯 Asignación
              </NavLink>
            </>
          )}

          {/* ==================== ZONA CENTRO ==================== */}
          {isCenter && (
            <>
              <span style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>Centro</span>
              <NavLink to="/center" style={linkStyle}>
                🏫 Dashboard
              </NavLink>
              <NavLink to="/center/catalog" style={linkStyle}>
                🔍 Explorar Catálogo
              </NavLink>
              <NavLink to="/center/request" style={linkStyle}>
                📝 Nueva Solicitud
              </NavLink>
              <NavLink to="/center/requests" style={linkStyle}>
                📄 Mis Solicitudes
              </NavLink>
              <NavLink to="/center/allocations" style={linkStyle}>
                📋 Mis Asignaciones
              </NavLink>
            </>
          )}

          {/* ==================== ZONA PROFESOR ==================== */}
          {isTeacher && (
            <>
              <span style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>Profesor</span>
              <NavLink to="/teacher" style={linkStyle}>
                🎓 Mis Talleres
              </NavLink>
            </>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
