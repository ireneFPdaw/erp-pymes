import React, { useEffect, useState } from "react";
import { getEmpleados } from "../services/api.js";
import EmpleadoModal from "./EmpleadoModal.jsx";
import Avatar from "./Avatar.jsx";

export default function EmpleadosTable() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function cargar() {
    try {
      setError("");
      const data = await getEmpleados();
      setRows(data);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  return (
    <section
      className="panel paper table-panel"
      aria-labelledby="empleados-title"
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2 id="empleados-title">Empleados</h2>
        <button className="btn primary" onClick={() => setOpen(true)}>
          + Nuevo empleado
        </button>
      </header>

      {error && <p className="msg err">{error}</p>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 56 }}>Foto</th>
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
                <td>
                  <Avatar
                    id={e.id}
                    nombres={e.nombres}
                    apellidos={e.apellidos}
                    visible={e.tiene_foto}
                  />
                </td>
                <td>#{e.id}</td>
                <td>
                  {e.apellidos}, {e.nombres}
                </td>
                <td>{e.dni}</td>
                <td>{e.email}</td>
                <td>{e.telefono || "—"}</td>
                <td className="rol">
                  <span
                    className="tag"
                    data-rol={(e.rol || "").toLowerCase()} // asegura minúsculas exactas
                  >
                    {e.rol}
                  </span>
                </td>
                <td>
                  {e.fecha_contratacion
                    ? new Date(e.fecha_contratacion).toLocaleDateString()
                    : "—"}
                </td>
                <td>{e.activo ? "Sí" : "No"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="9" className="muted">
                  Sin empleados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EmpleadoModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          cargar();
        }}
      />
    </section>
  );
}
