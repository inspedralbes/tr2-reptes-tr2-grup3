const Card = ({ title, children }) => {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "16px",
        background: "white",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      {title ? <h3 style={{ marginTop: 0 }}>{title}</h3> : null}
      {children}
    </div>
  );
};

export default Card;
