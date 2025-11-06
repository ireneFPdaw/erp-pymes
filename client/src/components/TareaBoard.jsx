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

  async function moveTo(t, newEstado) {
    try {
      await updateTarea(t.id, { estado: newEstado });
      await cargar();
    } catch (err) { setError(err.message); }
  }

  async function toggleDone(t) {
    // Marcado rápido: alterna entre terminadas y por_hacer
    const next = t.estado === 'terminadas' ? 'por_hacer' : 'terminadas';
    await moveTo(t, next);
  }

  async function remove(id) {
    if (!confirm(`¿Eliminar tarea #${id}?`)) return;
    try {
      await deleteTarea(id);
      await cargar();
    } catch (err) { setError(err.message); }
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
          <div key={c.key} className="lane" aria-label={c.title}>
            <header className={`lane-h lane-${c.key}`}>
              <h3>{c.title}</h3>
              <span className="count">{porColumna[c.key].length}</span>
            </header>

            <ul className="lane-list">
              {porColumna[c.key].map(t => (
                <TareaCard
                  key={t.id}
                  tarea={t}
                  onEdit={onEdit}
                  onMove={moveTo}
                  onToggleDone={toggleDone}
                  onDelete={remove}
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
