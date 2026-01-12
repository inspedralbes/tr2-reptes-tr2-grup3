import { useState } from "react";
import Button from "../ui/Button.jsx";

const LoginForm = ({ onSubmit, loading }) => {
  const [email, setEmail] = useState("admin@enginy.cat");
  const [password, setPassword] = useState("admin123");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "grid", gap: "12px", maxWidth: "360px" }}
    >
      <label style={{ display: "grid", gap: "4px" }}>
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
          }}
          required
        />
      </label>
      <label style={{ display: "grid", gap: "4px" }}>
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
          }}
          required
        />
      </label>
      <Button type="submit" variant="primary">
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
};

export default LoginForm;
