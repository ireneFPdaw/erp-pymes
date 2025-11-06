import React, { useState } from 'react';
import { createTarea, getTarea, updateTarea } from './services/api.js';
import TareaForm from './components/TareaForm.jsx';
import TareaBoard from './components/TareaBoard.jsx'; // nuevo nombre

export default function App() {
  const [editando, setEditando] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  async function onSubmit(form) {
    try {
      setMensaje('');
      if (editando) {
        await updateTarea(editando.id, form);
        setMensaje('✅ Tarea actualizada');
      } else {
        await createTarea(form);
        setMensaje('✅ Tarea creada');
      }
      setEditando(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setMensaje('❌ ' + err.message);
    }
  }

  async function onEdit(tarea) {
    try {
      setCargando(true);
      const t = await getTarea(tarea.id);
      setEditando(t);
    } catch (err) {
      setMensaje('❌ ' + err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="app">
      <header className="header" role="banner">
        <div className="wrap">
          <h1>Tablero de tareas</h1>
        </div>
      </header>

      <main className="main" role="main">
        <section className="panel paper" aria-labelledby="form-title">
          <h2 id="form-title">{editando ? 'Editar tarea' : 'Nueva tarea'}</h2>
          {mensaje && (
            <p className={`msg ${mensaje.startsWith('✅') ? 'ok' : 'err'}`} role="status">
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
          <h2 id="board-title" className="visually-hidden">Tablero Kanban</h2>
          <div className="board-wrap kanban" aria-label="Tablero Kanban">
            <TareaBoard
              onEdit={onEdit}
              refreshKey={refreshKey}
              onRefreshing={setCargando}
            />
          </div>
          {cargando && <p className="muted" aria-live="polite">Cargando…</p>}
        </section>
      </main>
    </div>
  );
}
