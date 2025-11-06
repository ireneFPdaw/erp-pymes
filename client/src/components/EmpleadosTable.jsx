import React, { useEffect, useState } from "react";
import { getEmpleados } from "../services/api.js";

export default function EmpleadosTable() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setRows(await getEmpleados());
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  return (
    <section className="panel paper table-panel" aria-labelledby="empleados-title">
      <h2 id="empleados-title">Empleados</h2>
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
              <th>Rol</th>
              <th>Alta</th>
              <th>Activo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td>#{e.id}</td>
                <td>
                  {e.apellidos}, {e.nombres}
                </td>
                <td>{e.dni}</td>
                <td>{e.email}</td>
                <td>{e.telefono || "—"}</td>
                <td className="tag">{e.rol}</td>
                <td>{new Date(e.fecha_contratacion).toLocaleDateString()}</td>
                <td>{e.activo ? "Sí" : "No"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="8" className="muted">
                  Sin empleados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
