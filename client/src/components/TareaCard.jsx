import React from "react";

export default function TareaCard({
  tarea,
  onToggleDone,
  onMove,
  onEdit,
  onDelete,
}) {
  const color =
    tarea.estado === "por_hacer"
      ? "pink"
      : tarea.estado === "en_proceso"
      ? ""
      : tarea.estado === "bloqueadas"
      ? "mint"
      : "pink";

  return (
    <li
      className={`note ${tarea.estado === "terminadas" ? "done" : ""}`}
      data-color={color}
      tabIndex={0}
    >
      <h3>{tarea.titulo}</h3>
      <p>{tarea.descripcion || "—"}</p>

      <div className="note-footer">
        <span className="badge">#{tarea.id}</span>
        <div className="controls" role="group" aria-label="Acciones">
          <button
            className="icon-btn"
            title={
              tarea.estado === "terminadas"
                ? "Marcar como pendiente"
                : "Marcar como terminada"
            }
            onClick={() => onToggleDone(tarea)}
          >
            {tarea.estado === "terminadas" ? "☑" : "☐"}
          </button>

          <select
            aria-label="Mover a columna"
            value={tarea.estado}
            onChange={(e) => onMove(tarea, e.target.value)}
            className="icon-btn status-select" // 👈 añade esta clase
          >
            <option value="por_hacer">Por hacer</option>
            <option value="en_proceso">En proceso</option>
            <option value="bloqueadas">Bloqueadas</option>
            <option value="terminadas">Terminadas</option>
          </select>

          <button
            className="icon-btn"
            title="Editar"
            onClick={() => onEdit(tarea)}
          >
            ✎
          </button>
          <button
            className="icon-btn"
            title="Eliminar"
            onClick={() => onDelete(tarea.id)}
          >
            🗑
          </button>
        </div>
      </div>
    </li>
  );
}
