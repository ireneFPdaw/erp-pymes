// src/components/EmpleadosTable.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getEmpleados } from "../services/api.js";
import EmpleadoModal from "./EmpleadoModal.jsx";
import EmpleadoEditModal from "./EmpleadoEditModal.jsx";
import EmpleadoFilesModal from "./EmpleadoFilesModal.jsx";
import Avatar from "./Avatar.jsx";
import EmpleadoActions from "./EmpleadoActions.jsx";
import { ArrowUpDown } from "lucide-react";

/** Cabecera de tabla ordenable con indicador ↑/↓ */
function SortableTH({ label, colKey, sort, onSort, style }) {
  const active = sort.key === colKey;
  const dir = active ? sort.dir : null; // "asc" | "desc" | null
  return (
    <th
      role="button"
      onClick={() => onSort(colKey)}
      title={`Ordenar por ${label}`}
      style={{ userSelect: "none", cursor: "pointer", ...style }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        {label}
        {active ? (
          <span
            aria-hidden
            style={{
              fontSize: 12,
              opacity: 0.9,
              lineHeight: 1,
              marginLeft: 2,
            }}
          >
            {dir === "asc" ? "▲" : "▼"}
          </span>
        ) : (
          <ArrowUpDown size={14} style={{ opacity: 0.55 }} />
        )}
      </span>
    </th>
  );
}

export default function EmpleadosTable() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  // modales
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [openFiles, setOpenFiles] = useState(false);
  const [empSel, setEmpSel] = useState(null);

  // filtros por columna
  const [filters, setFilters] = useState({
    nombre: "",
    dni: "",
    email: "",
    telefono: "",
  });

  // 🔍 búsqueda global + filtro Activo
  const [q, setQ] = useState(""); // global
  const [activo, setActivo] = useState("todos"); // 'todos' | 'si' | 'no'

  // 📊 sort & paginación
  const [sort, setSort] = useState({ key: "apellidos", dir: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const norm = (s) =>
    (s ?? "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const limpiarTel = (t) => (t || "").replace(/[^\d]/g, "");

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

  // comparador genérico
  const cmp = (a, b, key) => {
    const va = a?.[key],
      vb = b?.[key];
    if (va == null && vb == null) return 0;
    if (va == null) return -1;
    if (vb == null) return 1;
    // fechas/números/strings
    const na = typeof va === "number" ? va : isNaN(+va) ? null : +va;
    const nb = typeof vb === "number" ? vb : isNaN(+vb) ? null : +vb;
    if (na != null && nb != null) return na - nb;
    return norm(String(va)).localeCompare(norm(String(vb)));
  };

  const sortedPaged = useMemo(() => {
    let data = rows;

    // filtros por columna
    const fNombre = norm(filters.nombre);
    const fDni = norm(filters.dni);
    const fEmail = norm(filters.email);
    const fTel = norm(filters.telefono);

    data = data.filter((e) => {
      const nombre = norm(`${e.apellidos}, ${e.nombres}`);
      const dni = norm(e.dni);
      const email = norm(e.email);
      const tel = norm(e.telefono || "");
      const pasaCols =
        (!fNombre || nombre.includes(fNombre)) &&
        (!fDni || dni.includes(fDni)) &&
        (!fEmail || email.includes(fEmail)) &&
        (!fTel || tel.includes(fTel));

      // 🔍 global
      const g = norm(q);
      const texto = norm(
        `${e.apellidos}, ${e.nombres} ${e.dni} ${e.email} ${e.telefono || ""} ${
          e.rol || ""
        }`
      );
      const pasaGlobal = !g || texto.includes(g);

      // filtro activo
      const pasaActivo =
        activo === "todos" ? true : activo === "si" ? e.activo : !e.activo;

      return pasaCols && pasaGlobal && pasaActivo;
    });

    // sort
    data = [...data].sort((a, b) =>
      sort.dir === "asc" ? cmp(a, b, sort.key) : -cmp(a, b, sort.key)
    );

    // paginación
    const total = data.length;
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    const p = Math.min(page, maxPage);
    const slice = data.slice((p - 1) * pageSize, p * pageSize);

    return { data: slice, total, maxPage, page: p };
  }, [rows, filters, q, activo, sort, page, pageSize]);

  const onFilter = (key) => (ev) =>
    setFilters((f) => ({ ...f, [key]: ev.target.value }));
  const setSortCol = (key) => {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

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
          gap: 12,
        }}
      >
        <h2 id="empleados-title">Empleados</h2>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* 🔍 búsqueda global */}
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

          {/* Filtro Activo */}
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
            + Nuevo empleado
          </button>
        </div>
      </header>

      {error && <p className="msg err">{error}</p>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 56 }}>AVATAR</th>

              <SortableTH
                label="Nombre"
                colKey="apellidos"
                sort={sort}
                onSort={setSortCol}
              />

              <SortableTH
                label="DNI"
                colKey="dni"
                sort={sort}
                onSort={setSortCol}
              />

              <th>Email</th>

              <SortableTH
                label="Teléfono"
                colKey="telefono"
                sort={sort}
                onSort={setSortCol}
              />

              <th>Rol</th>

              <SortableTH
                label="Alta"
                colKey="fecha_contratacion"
                sort={sort}
                onSort={setSortCol}
              />

              <SortableTH
                label="Salario"
                colKey="salario"
                sort={sort}
                onSort={setSortCol}
              />

              <th>Activo</th>
              <th style={{ width: 40 }}></th>
            </tr>

            {/* filtros por columna */}
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
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {sortedPaged.data.map((e) => (
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

                {/* 📞 contacto rápido */}
                <td className="truncate">
                  <a href={`mailto:${e.email}`}>{e.email}</a>
                </td>
                <td>
                  {e.telefono ? (
                    <>
                      <a href={`tel:${limpiarTel(e.telefono)}`} title="Llamar">
                        {e.telefono}
                      </a>{" "}
                      ·{" "}
                      <a
                        href={`https://wa.me/${limpiarTel(e.telefono)}`}
                        target="_blank"
                        rel="noreferrer"
                        title="WhatsApp"
                      >
                        WhatsApp
                      </a>
                    </>
                  ) : (
                    "—"
                  )}
                </td>

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
                    onDocs={() => {
                      setEmpSel(e);
                      setOpenFiles(true);
                    }}
                  />
                </td>
              </tr>
            ))}

            {sortedPaged.data.length === 0 && (
              <tr>
                <td colSpan="10" className="muted">
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 📄 paginación */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 10,
        }}
      >
        <div className="muted">Total: {sortedPaged.total}</div>
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
            disabled={sortedPaged.page <= 1}
          >
            ‹ Anterior
          </button>
          <span className="muted">
            Pag. {sortedPaged.page} / {sortedPaged.maxPage}
          </span>
          <button
            className="btn"
            onClick={() => setPage((p) => Math.min(sortedPaged.maxPage, p + 1))}
            disabled={sortedPaged.page >= sortedPaged.maxPage}
          >
            Siguiente ›
          </button>
        </div>
      </div>

      {/* Modales */}
      <EmpleadoModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={() => {
          setOpenCreate(false);
          cargar();
        }}
      />
      <EmpleadoFilesModal
        open={openFiles}
        empleado={empSel}
        onClose={() => setOpenFiles(false)}
      />
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
