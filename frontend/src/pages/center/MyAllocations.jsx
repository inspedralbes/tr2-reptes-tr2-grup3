import Card from "../../components/ui/Card.jsx";

const MyAllocations = () => {
  const allocations = [
    { id: "a-1", workshop: "Robótica básica", status: "confirmada" },
    { id: "a-2", workshop: "Impresión 3D", status: "pendiente" },
  ];

  return (
    <Card title="Mis asignaciones">
      <ul style={{ paddingLeft: "18px" }}>
        {allocations.map((a) => (
          <li key={a.id}>
            {a.workshop} — {a.status}
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default MyAllocations;
