/**
 * Componente Button reutilizable
 * Props: children, onClick, type, variant, disabled, className
 */
const Button = ({ children, onClick, type = "button", variant = "primary", disabled = false, className = "" }) => {
  const baseStyles = {
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.2s",
  };

  const variants = {
    primary: {
      background: "#2563eb",
      color: "white",
      border: "none",
    },
    secondary: {
      background: "white",
      color: "#111",
      border: "1px solid #e5e7eb",
    },
    danger: {
      background: "#dc2626",
      color: "white",
      border: "none",
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        ...baseStyles,
        ...variants[variant],
      }}
    >
      {children}
    </button>
  );
};

export default Button;
