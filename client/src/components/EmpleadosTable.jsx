import React, { useEffect, useMemo, useState } from "react";
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

  // 🔎 filtros por columna
  const [filters, setFilters] = useState({
    nombre: "",
    dni: "",
    email: "",
    telefono: "",
  });

  const norm = (s) =>
    (s ?? "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // sin acentos

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

  // 🧮 aplica filtros en memoria
  const filtered = useMemo(() => {
    const fNombre = norm(filters.nombre);
    const fDni = norm(filters.dni);
    const fEmail = norm(filters.email);
    const fTel = norm(filters.telefono);

    return rows.filter((e) => {
      const nombre = norm(`${e.apellidos}, ${e.nombres}`);
      const dni = norm(e.dni);
      const email = norm(e.email);
      const tel = norm(e.telefono || "");

      return (
        (!fNombre || nombre.includes(fNombre)) &&
        (!fDni || dni.includes(fDni)) &&
        (!fEmail || email.includes(fEmail)) &&
        (!fTel || tel.includes(fTel))
      );
    });
  }, [rows, filters]);

  const onFilter = (key) => (ev) =>
    setFilters((f) => ({ ...f, [key]: ev.target.value }));

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
              <th style={{ width: 56 }}>AVATAR</th>
              <th>Nombre</th>
              <th>DNI</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Alta</th>
              <th>Salario</th>
              <th>Activo</th>
              <th style={{ width: 40 }}></th>
            </tr>

            {/* 🔎 fila de filtros */}
            <tr className="filters-row">
              <th></th>
              <th>
                <input
                  className="filter-input"
                  placeholder="Filtrar nombre…"
                  value={filters.nombre}
                  onChange={onFilter("nombre")}
                />
              </th>
              <th>
                <input
                  className="filter-input"
                  placeholder="Filtrar DNI…"
                  value={filters.dni}
                  onChange={onFilter("dni")}
                />
              </th>
              <th>
                <input
                  className="filter-input"
                  placeholder="Filtrar email…"
                  value={filters.email}
                  onChange={onFilter("email")}
                />
              </th>
              <th>
                <input
                  className="filter-input"
                  placeholder="Filtrar teléfono…"
                  value={filters.telefono}
                  onChange={onFilter("telefono")}
                />
              </th>
              {/* columnas sin filtro */}
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((e) => (
              <tr key={e.id}>
                <td>
                  <Avatar
                    id={e.id}
                    nombres={e.nombres}
                    apellidos={e.apellidos}
                    visible={e.tiene_foto}
                  />
                </td>

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
            {filtered.length === 0 && (
              <tr>
                <td colSpan="10" className="muted">
                  Sin resultados.
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
