import React from "react";

export default function TareaCard({
  tarea,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging
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
      className={`note ${tarea.estado === "terminadas" ? "done" : ""} ${isDragging ? "dragging" : ""}`}
      data-color={color}
      tabIndex={0}
      draggable
      onDragStart={(ev) => onDragStart?.(tarea, ev)}
      onDragEnd={() => onDragEnd?.()}
      aria-grabbed={isDragging ? "true" : "false"}
      aria-roledescription="Tarjeta draggable"
    >
      <h3>{tarea.titulo}</h3>
      <p>{tarea.descripcion || "—"}</p>

      <div className="note-footer">
 
        <div className="controls" role="group" aria-label="Acciones">
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
