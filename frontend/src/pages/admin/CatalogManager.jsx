import { useEffect, useState } from "react";
import Card from "../../components/ui/Card.jsx";
import { listWorkshops } from "../../api/catalog.js";

const CatalogManager = () => {
  const [workshops, setWorkshops] = useState([]);

  useEffect(() => {
    listWorkshops().then(setWorkshops).catch(console.error);
  }, []);

  return (
    <Card title="Catálogo de talleres">
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
            <th>Título</th>
            <th>Proveedor</th>
            <th>Plazas</th>
          </tr>
        </thead>
        <tbody>
          {workshops.map((w) => (
            <tr key={w.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td>{w.title}</td>
              <td>{w.provider}</td>
              <td>{w.seats}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

export default CatalogManager;
