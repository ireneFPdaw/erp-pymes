import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function EmpleadoActions({ onEdit, onDocs }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null); // <-- ref del menú

  function place() {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const W = 160,
      H = 44,
      GAP = 8,
      M = 8;
    let left = r.right - W;
    let top = r.bottom + GAP;
    left = Math.max(M, Math.min(window.innerWidth - W - M, left));
    top = Math.max(M, Math.min(window.innerHeight - H - M, top));
    setPos({ top, left });
  }

  const toggle = () => {
    setOpen((o) => {
      const next = !o;
      if (next) place();
      return next;
    });
  };

  useEffect(() => {
    if (!open) return;

    const onDocClick = (e) => {
      const bt = btnRef.current;
      const mn = menuRef.current;
      if (!bt || !mn) return;
      // si el click NO fue dentro del botón ni del menú -> cerrar
      if (!bt.contains(e.target) && !mn.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => place();
    const onResize = () => place();

    // ⚠️ en burbujeo (sin "true") para no adelantarnos al click del item
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      document.removeEventListener("click", onDocClick);
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
            ref={menuRef}
            className="menu-portal"
            role="menu"
            style={{ top: pos.top, left: pos.left }}
            // por si acaso, evitamos que este contenedor burbujee al document
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="menu-item"
              onClick={() => {
                setOpen(false);
                onEdit?.();
              }}
              role="menuitem"
            >
              Editar
            </button>
            <button
              className="menu-item"
              onClick={() => {
                setOpen(false);
                onDocs?.();
              }}
            >
              Documentos
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
