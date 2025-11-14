import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { createTarea, getTarea, updateTarea } from "./services/api.js";
import TareaForm from "./components/TareaForm.jsx";
import TareaBoard from "./components/TareaBoard.jsx";
import EmpleadosTable from "./components/EmpleadosTable.jsx";
import PacientesTable from "./components/PacientesTable.jsx";
import HistoriaClinica from "./pages/HistoriaClinica.jsx";
import CitasPage from "./pages/CitasPage.jsx";

export default function App() {
  const [editando, setEditando] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [vista, setVista] = useState("tablero");

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
    <Routes>
      <Route
        path="/"
        element={
          <div className="app">
            <header className="header" role="banner">
              <div className="wrap">
                <h1>Centro Fisioterapia Madrid</h1>
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
              <button
                className={`tab-btn ${vista === "citas" ? "active" : ""}`}
                onClick={() => setVista("citas")}
              >
                Citas
              </button>
            </nav>

            {vista === "tablero" && (
              <main className="main" role="main">
                <section className="panel paper" aria-labelledby="form-title">
                  <h2 id="form-title">
                    {editando ? "Editar tarea" : "Nueva tarea"}
                  </h2>
                  {mensaje && (
                    <p
                      className={`msg ${
                        mensaje.startsWith("✅") ? "ok" : "err"
                      }`}
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

                <section
                  aria-labelledby="board-title"
                  className="board-section"
                >
                  <h2 id="board-title" className="visually-hidden">
                    Tablero Kanban
                  </h2>
                  <div
                    className="board-wrap kanban"
                    aria-label="Tablero Kanban"
                  >
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
            )}

            {vista === "empleados" && (
              <main
                className="wrap-narrow"
                style={{
                  maxWidth: "2200px",
                  margin: "22px auto 46px",
                  padding: "0 16px",
                }}
              >
                <EmpleadosTable />
              </main>
            )}

            {vista === "pacientes" && (
              <main
                className="wrap-narrow"
                style={{
                  maxWidth: "2200px",
                  margin: "22px auto 46px",
                  padding: "0 16px",
                }}
              >
                <PacientesTable />
              </main>
            )}

            {vista === "citas" && (
              <main
                className="wrap-narrow"
                style={{
                  maxWidth: "2200px",
                  margin: "22px auto 46px",
                  padding: "0 16px",
                }}
              >
                <CitasPage />
              </main>
            )}
          </div>
        }
      />

      <Route path="/pacientes/:id" element={<HistoriaClinica />} />
    </Routes>
  );

}