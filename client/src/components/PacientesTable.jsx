// src/components/PacientesTable.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getPacientes } from "../services/api.js";

// Modales
import PacienteModal from "./PacienteModal.jsx"; // crear
import PacienteEditModal from "./PacienteEditModal.jsx"; // editar (precargado)
import PacienteFilesModal from "./PacienteFilesModal.jsx"; // documentos
import { exportFichaPacientePDF } from "../utils/pacientesPdf.js";
import PacienteActions from "./PacientesActions.jsx";

const norm = (s) =>
  (s ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const fmtFecha = (val) => {
  if (!val) return "—";
  const [y, m, d] = String(val).split("T")[0].split("-");
  return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y.slice(-2)}`;
};

const cleanTel = (t) => (t || "").replace(/[^\d]/g, "");

export default function PacientesTable() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  // crear/editar/docs
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [openFiles, setOpenFiles] = useState(false);
  const [pacSel, setPacSel] = useState(null);

  // filtros
  const [q, setQ] = useState(""); // búsqueda global
  const [activo, setActivo] = useState("todos"); // todos | si | no

  // paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const filteredPaged = useMemo(() => {
    const g = norm(q);

    let data = rows.filter((p) => {
      const txt = norm(
        `${p.apellidos} ${p.nombres} ${p.dni} ${p.email} ${p.telefono || ""} ${
          p.sexo || ""
        } ${p.patologias || ""} ${p.alergias || ""} ${p.direccion || ""}`
      );
      const okG = !g || txt.includes(g);
      const okA =
        activo === "todos" ? true : activo === "si" ? p.activo : !p.activo;
      return okG && okA;
    });

    const total = data.length;
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    const p = Math.min(page, maxPage);
    data = data.slice((p - 1) * pageSize, p * pageSize);

    return { data, total, maxPage, page: p };
  }, [rows, q, activo, page, pageSize]);

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
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            style={{ width: 260 }}
          />
          <select
            className="filter-input"
            value={activo}
            onChange={(e) => {
              setActivo(e.target.value);
              setPage(1);
            }}
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
              <th>Alergias</th>
              <th>Fecha de nacimiento</th>
              <th>Dirección</th>
              <th>Activo</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>

          <tbody>
            {filteredPaged.data.map((p) => (
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
                <td className="truncate">{p.alergias || "—"}</td>
                <td className="truncate">{fmtFecha(p.fecha_nacimiento)}</td>
                <td className="truncate">{p.direccion || "—"}</td>
                <td>{p.activo ? "Sí" : "No"}</td>

                <td style={{ textAlign: "right" }}>
                  <PacienteActions
                    onEdit={() => {
                      setEditId(p.id);
                      setOpenEdit(true);
                    }}
                    onDocs={() => {
                      setPacSel(p);
                      setOpenFiles(true);
                    }}
                    onDownload={() => exportFichaPacientePDF(p)} // ← Descargar datos
                  />
                </td>
              </tr>
            ))}

            {filteredPaged.data.length === 0 && (
              <tr>
                <td colSpan="11" className="muted">
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* paginación */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 10,
        }}
      >
        <div className="muted">Total: {filteredPaged.total}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(+e.target.value);
              setPage(1);
            }}
            className="filter-input"
            style={{ width: 93 }}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}/pág.
              </option>
            ))}
          </select>
          <button
            className="btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={filteredPaged.page <= 1}
          >
            ‹ Anterior
          </button>
          <span className="muted">
            Pag. {filteredPaged.page} / {filteredPaged.maxPage}
          </span>
          <button
            className="btn"
            onClick={() =>
              setPage((p) => Math.min(filteredPaged.maxPage, p + 1))
            }
            disabled={filteredPaged.page >= filteredPaged.maxPage}
          >
            Siguiente ›
          </button>
        </div>
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
      <PacienteEditModal
        open={openEdit}
        pacienteId={editId}
        onClose={() => setOpenEdit(false)}
        onUpdated={() => {
          setOpenEdit(false);
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
