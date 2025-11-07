// src/components/PacientesTable.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getPacientes } from "../services/api.js";
import PacienteModal from "./PacienteModal.jsx";
import PacienteFilesModal from "./PacienteFilesModal.jsx";
import EmpleadoActions from "./EmpleadoActions.jsx"; // reutilizamos menú con iconos

const norm = (s) =>
  (s ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
const cleanTel = (t) => (t || "").replace(/[^\d]/g, "");

export default function PacientesTable() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [openFiles, setOpenFiles] = useState(false);
  const [pacSel, setPacSel] = useState(null);

  // filtros simples
  const [q, setQ] = useState(""); // búsqueda global
  const [activo, setActivo] = useState("todos");

  async function cargar() {
    try {
      setError("");
      const data = await getPacientes();
      setRows(data);
    } catch (e) {
      setError(e.message || "Error cargando pacientes");
    }
  }
  useEffect(() => {
    cargar();
  }, []);

  const lista = useMemo(() => {
    const g = norm(q);
    return rows.filter((p) => {
      const txt = norm(
        `${p.apellidos} ${p.nombres} ${p.dni} ${p.email} ${p.telefono || ""} ${
          p.sexo || ""
        } ${p.patologias || ""}`
      );
      const okG = !g || txt.includes(g);
      const okA =
        activo === "todos" ? true : activo === "si" ? p.activo : !p.activo;
      return okG && okA;
    });
  }, [rows, q, activo]);

  return (
    <section
      className="panel paper table-panel"
      aria-labelledby="pacientes-title"
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h2 id="pacientes-title">Pacientes</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            className="filter-input"
            placeholder="Buscar en todos los campos…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: 260 }}
          />
          <select
            className="filter-input"
            value={activo}
            onChange={(e) => setActivo(e.target.value)}
            style={{ width: 140 }}
          >
            <option value="todos">Todos</option>
            <option value="si">Activos</option>
            <option value="no">Inactivos</option>
          </select>
          <button className="btn primary" onClick={() => setOpenCreate(true)}>
            + Nuevo paciente
          </button>
        </div>
      </header>

      {error && <p className="msg err">{error}</p>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>#</th>
              <th>Nombre</th>
              <th>DNI</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Sexo</th>
              <th>Patologías</th>
              <th>Activo</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.id}>
                <td>#{p.id}</td>
                <td>
                  {p.apellidos}, {p.nombres}
                </td>
                <td>{p.dni}</td>
                <td className="truncate">
                  <a href={`mailto:${p.email}`}>{p.email}</a>
                </td>
                <td>
                  {p.telefono ? (
                    <>
                      <a href={`tel:${cleanTel(p.telefono)}`}>{p.telefono}</a>
                      {" · "}
                      <a
                        href={`https://wa.me/${cleanTel(p.telefono)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp
                      </a>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{p.sexo || "—"}</td>
                <td className="truncate">{p.patologias || "—"}</td>
                <td>{p.activo ? "Sí" : "No"}</td>
                <td style={{ textAlign: "right" }}>
                  <EmpleadoActions
                    onEdit={
                      () =>
                        setOpenCreate(
                          true
                        ) /* opcional: podrías tener un PacienteEditModal */
                    }
                    onDocs={() => {
                      setPacSel(p);
                      setOpenFiles(true);
                    }}
                  />
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan="9" className="muted">
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modales */}
      <PacienteModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={() => {
          setOpenCreate(false);
          cargar();
        }}
      />
      <PacienteFilesModal
        open={openFiles}
        paciente={pacSel}
        onClose={() => setOpenFiles(false)}
      />
    </section>
  );
}
