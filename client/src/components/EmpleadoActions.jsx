import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function EmpleadoActions({ onEdit }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  // coloca el menú junto al botón, ajustado a viewport
  function place() {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const W = 160, H = 44, GAP = 8, M = 8;

    let left = r.right - W;         // alineado al borde derecho del botón
    let top  = r.bottom + GAP;      // debajo del botón

    // clamp a viewport
    left = Math.max(M, Math.min(window.innerWidth - W - M, left));
    top  = Math.max(M, Math.min(window.innerHeight - H - M, top));

    setPos({ top, left });
  }

  // abrir/cerrar + colocar
  const toggle = () => {
    setOpen(o => {
      const next = !o;
      if (next) place();
      return next;
    });
  };

  // cerrar al click fuera o Escape
  useEffect(() => {
    if (!open) return;

    const onDocClick = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    const onScroll = () => place();
    const onResize = () => place();

    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      document.removeEventListener("click", onDocClick, true);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        className="icon-btn"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Acciones"
      >
        ⋯
      </button>

      {open &&
        createPortal(
          <div
            className="menu-portal"
            role="menu"
            style={{ top: pos.top, left: pos.left }}
          >
            <button
              className="menu-item"
              onClick={() => { setOpen(false); onEdit?.(); }}
              role="menuitem"
            >
              Editar
            </button>
            {/* aquí puedes añadir más items */}
          </div>,
          document.body
        )}
    </>
  );
}
