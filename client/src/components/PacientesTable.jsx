import React, { useEffect, useState } from "react";
import { getPacientes } from "../services/api.js";

export default function PacientesTable() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setRows(await getPacientes());
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  return (
    <section className="panel paper table-panel" aria-labelledby="pacientes-title">
      <h2 id="pacientes-title">Pacientes</h2>
      {error && <p className="msg err">{error}</p>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>DNI</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Sexo</th>
              <th>Patologías</th>
              <th>Activo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>#{p.id}</td>
                <td>
                  {p.apellidos}, {p.nombres}
                </td>
                <td>{p.dni || "—"}</td>
                <td>{p.email || "—"}</td>
                <td>{p.telefono || "—"}</td>
                <td>{p.sexo}</td>
                <td className="truncate" title={p.patologias || ""}>
                  {p.patologias || "—"}
                </td>
                <td>{p.activo ? "Sí" : "No"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="8" className="muted">
                  Sin pacientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
