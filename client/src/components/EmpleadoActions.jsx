import React, { useEffect, useRef, useState } from "react";

export default function EmpleadoActions({ onEdit }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  return (
    <div className="menu-wrap" ref={ref}>
      <button
        className="icon-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Acciones"
      >
        ⋯
      </button>
      {open && (
        <div className="menu">
          <button
            className="menu-item"
            onClick={() => {
              setOpen(false);
              onEdit?.();
            }}
          >
            Editar
          </button>
          {/* aquí podrás agregar Eliminar si luego quieres */}
        </div>
      )}
    </div>
  );
}
