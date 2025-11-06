import React, { useEffect, useMemo, useState } from 'react';
import { getTareas, updateTarea, deleteTarea } from '../services/api.js';
import TareaCard from './TareaCard.jsx';

const COLS = [
  { key: 'por_hacer', title: 'Por hacer' },
  { key: 'en_proceso', title: 'En proceso' },
  { key: 'bloqueadas', title: 'Bloqueadas' },
  { key: 'terminadas', title: 'Terminadas' }
];

export default function TareaBoard({ onEdit, refreshKey, onRefreshing }) {
  const [tareas, setTareas] = useState([]);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(null); // { id, estado }

  async function cargar() {
    try {
      setError('');
      onRefreshing?.(true);
      const data = await getTareas();
      setTareas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      onRefreshing?.(false);
    }
  }

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [refreshKey]);

  async function moveTo(taskId, newEstado) {
    try {
      await updateTarea(taskId, { estado: newEstado });
      await cargar();
    } catch (err) { setError(err.message); }
  }

  async function remove(id) {
    if (!confirm(`¿Eliminar tarea #${id}?`)) return;
    try {
      await deleteTarea(id);
      await cargar();
    } catch (err) { setError(err.message); }
  }

  // ---- Drag & Drop handlers ----
  function handleDragStart(tarea, ev) {
    // datos para soltar incluso si cambias de ventana
    ev.dataTransfer.setData('text/plain', String(tarea.id));
    ev.dataTransfer.effectAllowed = 'move';
    setDragging({ id: tarea.id, estado: tarea.estado });
  }

  function handleDragEnd() {
    setDragging(null);
  }

  function handleDragOver(colKey, ev) {
    // Necesario para permitir drop
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'move';
  }

  async function handleDrop(colKey, ev) {
    ev.preventDefault();
    const idStr = ev.dataTransfer.getData('text/plain') || (dragging?.id ? String(dragging.id) : null);
    if (!idStr) return;
    const id = Number(idStr);
    const task = tareas.find(t => t.id === id);
    if (!task) return;
    if (task.estado !== colKey) {
      await moveTo(id, colKey);
    }
    setDragging(null);
  }

  const porColumna = useMemo(() => {
    const map = { por_hacer: [], en_proceso: [], bloqueadas: [], terminadas: [] };
    for (const t of tareas) map[t.estado || 'por_hacer'].push(t);
    return map;
  }, [tareas]);

  return (
    <>
      {error && <p className="msg err" role="alert">{error}</p>}

      <div className="kanban-grid" role="list">
        {COLS.map(c => (
          <div
            key={c.key}
            className={`lane lane-${c.key} ${dragging ? 'lane-droppable' : ''}`}
            aria-label={c.title}
            onDragOver={(ev) => handleDragOver(c.key, ev)}
            onDrop={(ev) => handleDrop(c.key, ev)}
          >
            <header className="lane-h">
              <h3>{c.title}</h3>
              <span className="count">{porColumna[c.key].length}</span>
            </header>

            <ul className="lane-list">
              {porColumna[c.key].map(t => (
                <TareaCard
                  key={t.id}
                  tarea={t}
                  onEdit={onEdit}
                  onDelete={remove}
                  // drag & drop
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  isDragging={dragging?.id === t.id}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>

      {tareas.length === 0 && <p className="muted">Sin tareas todavía. ¡Añade tu primera!</p>}
    </>
  );
}
