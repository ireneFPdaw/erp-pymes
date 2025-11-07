import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Avatar({ id, nombres = "", apellidos = "", visible }) {
  const [error, setError] = useState(false);
  const [hover, setHover] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef(null);

  const iniciales = `${nombres[0] || ""}${apellidos?.[0] || ""}`.toUpperCase();
  const src = `${API}/api/empleados/${id}/foto`;
  const showImage = visible && !error; // <- decide render, pero hooks arriba

  function placePreview() {
    if (!wrapperRef.current) return;
    const r = wrapperRef.current.getBoundingClientRect();

    const W = 200, H = 200, GAP = 12, MARGIN = 8;
    let left = r.right + GAP;
    let top  = r.top + r.height / 2 - H / 2;

    // Clamp vertical
    top = Math.max(MARGIN, Math.min(window.innerHeight - H - MARGIN, top));

    // Si no entra a la derecha, colócalo a la izquierda
    if (left + W + MARGIN > window.innerWidth) {
      left = r.left - GAP - W;
    }

    setPos({ top, left });
  }

  useEffect(() => {
    // ejecuta SIEMPRE el hook; activa listeners sólo en hover + con imagen
    if (!hover || !showImage) return;

    const onScroll = () => placePreview();
    const onResize = () => placePreview();

    placePreview();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [hover, showImage]); // deps claras

  // ---------- Render ----------
  if (!showImage) {
    return (
      <div className="avatar fallback" aria-hidden>
        {iniciales || "👤"}
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="avatar-wrapper"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <img
        className="avatar"
        src={src}
        alt={`${nombres} ${apellidos}`}
        onError={() => setError(true)}
        loading="lazy"
        width={40}
        height={40}
      />

      {hover &&
        createPortal(
          <div
            className="avatar-preview-fixed"
            style={{ top: pos.top, left: pos.left }}
            aria-hidden
          >
            <img src={src} alt="" />
          </div>,
          document.body
        )}
    </div>
  );
}
