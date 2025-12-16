import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>🎓 Enginy - Sistema de Gestión de Talleres</h1>
      <p>Bienvenido al sistema de gestión de talleres escolares</p>

      <div style={{ marginTop: "20px" }}>
        <button onClick={() => setCount((count) => count + 1)}>
          Contador: {count}
        </button>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          backgroundColor: "#f0f0f0",
          borderRadius: "5px",
        }}
      >
        <h3>✅ Proyecto configurado correctamente</h3>
        <p>
          La estructura del frontend está lista. Ahora puedes empezar a
          desarrollar.
        </p>
      </div>
    </div>
  );
}

export default App;
