import React, { useEffect, useState } from "react";
import { getEmpleados } from "../services/api.js";
import EmpleadoModal from "./EmpleadoModal.jsx";
import EmpleadoEditModal from "./EmpleadoEditModal.jsx";
import Avatar from "./Avatar.jsx";
import EmpleadoActions from "./EmpleadoActions.jsx";

export default function EmpleadosTable() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [openCreate, setOpenCreate] = useState(false);

  // edición
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState(null);

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
        <button className="btn primary" onClick={() => setOpenCreate(true)}>
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
              <th>Salario</th>
              <th>Activo</th>
              <th style={{ width: 40 }}></th> {/* acciones */}
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
                <td className="truncate">{e.email}</td>
                <td>{e.telefono || "—"}</td>
                <td className="rol">
                  <span className="tag" data-rol={(e.rol || "").toLowerCase()}>
                    {e.rol}
                  </span>
                </td>
                <td>
                  {e.fecha_contratacion
                    ? new Date(e.fecha_contratacion).toLocaleDateString()
                    : "—"}
                </td>
                  <td>{e.salario}€</td>
                <td>{e.activo ? "Sí" : "No"}</td>
                <td style={{ textAlign: "right" }}>
                  <EmpleadoActions
                    onEdit={() => {
                      setEditId(e.id);
                      setOpenEdit(true);
                    }}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="10" className="muted">
                  Sin empleados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Crear */}
      <EmpleadoModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={() => {
          setOpenCreate(false);
          cargar();
        }}
      />

      {/* Editar */}
      <EmpleadoEditModal
        open={openEdit}
        empleadoId={editId}
        onClose={() => setOpenEdit(false)}
        onUpdated={() => {
          setOpenEdit(false);
          cargar();
        }}
      />
    </section>
  );
}
