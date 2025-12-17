const Button = ({ children, onClick, type = "button", variant = "primary" }) => {
  const styles = {
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
  };

  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        padding: "10px 14px",
        borderRadius: "8px",
        cursor: "pointer",
        ...styles[variant],
      }}
    >
      {children}
    </button>
  );
};

export default Button;
