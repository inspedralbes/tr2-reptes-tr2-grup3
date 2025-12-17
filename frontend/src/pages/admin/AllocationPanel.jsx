import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";

const AllocationPanel = () => {
  const handleRun = () => {
    // Wire to /api/allocation/run when backend is ready
    console.log("Running allocation...");
  };

  return (
    <Card title="Asignación automática">
      <p>Ejecuta la lógica de asignación y revisa los resultados.</p>
      <Button onClick={handleRun} variant="primary">
        Ejecutar asignación
      </Button>
    </Card>
  );
};

export default AllocationPanel;
