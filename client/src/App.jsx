import React, { useState } from "react";
import { createTarea, getTarea, updateTarea } from "./services/api.js";
import TareaForm from "./components/TareaForm.jsx";
import TareaBoard from "./components/TareaBoard.jsx";
import EmpleadosTable from "./components/EmpleadosTable.jsx";
import PacientesTable from "./components/PacientesTable.jsx";

export default function App() {
  const [editando, setEditando] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [vista, setVista] = useState("tablero"); // 'tablero' | 'empleados' | 'pacientes'

  async function onSubmit(form) {
    try {
      setMensaje("");
      if (editando) {
        await updateTarea(editando.id, form);
        setMensaje("✅ Tarea actualizada");
      } else {
        await createTarea(form);
        setMensaje("✅ Tarea creada");
      }
      setEditando(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setMensaje("❌ " + err.message);
    }
  }

  async function onEdit(tarea) {
    try {
      setCargando(true);
      const t = await getTarea(tarea.id);
      setEditando(t);
    } catch (err) {
      setMensaje("❌ " + err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="app">
      <header className="header" role="banner">
        <div className="wrap">
          <h1>Centro Fisioterapia Madrid</h1>
          <small aria-live="polite">
            API:{" "}
            <code>
              {import.meta.env.VITE_API_URL || "http://localhost:4000/api"}
            </code>
          </small>
        </div>
      </header>

      <nav className="tabs wrap">
        <button
          className={`tab-btn ${vista === "tablero" ? "active" : ""}`}
          onClick={() => setVista("tablero")}
        >
          Tareas
        </button>
        <button
          className={`tab-btn ${vista === "empleados" ? "active" : ""}`}
          onClick={() => setVista("empleados")}
        >
          Empleados
        </button>
        <button
          className={`tab-btn ${vista === "pacientes" ? "active" : ""}`}
          onClick={() => setVista("pacientes")}
        >
          Pacientes
        </button>
      </nav>

      {vista === "tablero" ? (
        <main className="main" role="main">
          <section className="panel paper" aria-labelledby="form-title">
            <h2 id="form-title">{editando ? "Editar tarea" : "Nueva tarea"}</h2>
            {mensaje && (
              <p
                className={`msg ${mensaje.startsWith("✅") ? "ok" : "err"}`}
                role="status"
              >
                {mensaje}
              </p>
            )}
            <TareaForm
              tareaSeleccionada={editando}
              onCancel={() => setEditando(null)}
              onSubmit={onSubmit}
            />
          </section>

          <section aria-labelledby="board-title" className="board-section">
            <h2 id="board-title" className="visually-hidden">
              Tablero Kanban
            </h2>
            <div className="board-wrap kanban" aria-label="Tablero Kanban">
              <TareaBoard
                onEdit={onEdit}
                refreshKey={refreshKey}
                onRefreshing={setCargando}
              />
            </div>
            {cargando && (
              <p className="muted" aria-live="polite">
                Cargando…
              </p>
            )}
          </section>
        </main>
      ) : (
        <main
          className="wrap-narrow"
          style={{
            maxWidth: "1200px",
            margin: "22px auto 46px",
            padding: "0 16px",
          }}
        >
          {vista === "empleados" ? <EmpleadosTable /> : <PacientesTable />}
        </main>
      )}
    </div>
  );
}
