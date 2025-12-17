import { useEffect, useState } from "react";
import Card from "../../components/ui/Card.jsx";
import { listWorkshops } from "../../api/catalog.js";

const CatalogBrowser = () => {
  const [workshops, setWorkshops] = useState([]);

  useEffect(() => {
    listWorkshops().then(setWorkshops).catch(console.error);
  }, []);

  return (
    <Card title="Catálogo disponible">
      <div style={{ display: "grid", gap: "12px" }}>
        {workshops.map((w) => (
          <div key={w.id} style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: "8px" }}>
            <div style={{ fontWeight: 600 }}>{w.title}</div>
            <div style={{ color: "#6b7280" }}>{w.provider}</div>
            <div style={{ fontSize: "14px" }}>Plazas: {w.seats}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default CatalogBrowser;
