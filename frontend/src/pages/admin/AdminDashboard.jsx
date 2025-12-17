import Card from "../../components/ui/Card.jsx";

const AdminDashboard = () => {
  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <Card title="Resumen general">
        <p>Talleres activos: 12</p>
        <p>Solicitudes pendientes: 5</p>
        <p>Asignaciones recientes: 42</p>
      </Card>
      <Card title="Acciones rápidas">
        <ul style={{ paddingLeft: "18px" }}>
          <li>Gestionar catálogo</li>
          <li>Revisar solicitudes</li>
          <li>Ejecutar asignación</li>
        </ul>
      </Card>
    </div>
  );
};

export default AdminDashboard;
