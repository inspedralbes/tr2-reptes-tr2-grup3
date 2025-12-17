import Card from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";

const RequestWizardSteps = () => {
  const steps = [
    "Selecciona talleres",
    "Define preferencias",
    "Revisa y envía",
  ];

  return (
    <Card title="Solicitud de talleres">
      <ol style={{ paddingLeft: "18px", display: "grid", gap: "6px" }}>
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div style={{ marginTop: "12px" }}>
        <Button variant="primary">Continuar</Button>
      </div>
    </Card>
  );
};

export default RequestWizardSteps;
