// src/components/PacientesActions.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  MoreVertical,
  Pencil,
  FolderOpen,
  Download,
  FileText,
} from "lucide-react";

export default function PacienteActions({
  onEdit,
  onDocs,
  onDownload,
  onHistory,
  extraItems,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const Item = ({ icon, label, onClick }) => (
    <button
      className="menu-item"
      onClick={() => {
        setOpen(false);
        onClick?.();
      }}
      style={itemStyle}
      role="menuitem"
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="menu-wrap" ref={ref} style={{ position: "relative" }}>
      <button
        className="btn icon"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title="Acciones del paciente"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div role="menu" className="menu" style={menuStyle}>
          {onEdit && (
            <Item
              icon={<Pencil size={16} style={{ opacity: 0.85 }} />}
              label="Editar"
              onClick={onEdit}
            />
          )}
          {onDocs && (
            <Item
              icon={<FolderOpen size={16} style={{ opacity: 0.85 }} />}
              label="Documentos"
              onClick={onDocs}
            />
          )}
          {onHistory && (
            <Item
              icon={<FileText size={16} style={{ opacity: 0.85 }} />}
              label="Ir a historia clínica"
              onClick={onHistory}
            />
          )}
          {onDownload && (
            <Item
              icon={<Download size={16} style={{ opacity: 0.85 }} />}
              label="Descargar datos"
              onClick={onDownload}
            />
          )}

          {Array.isArray(extraItems) &&
            extraItems.map((it, i) => (
              <Item
                key={i}
                icon={it.icon}
                label={it.label}
                onClick={it.onClick}
              />
            ))}
        </div>
      )}
    </div>
  );
}

const menuStyle = {
  position: "absolute",
  right: 0,
  top: "calc(100% + 6px)",
  minWidth: 180,
  background: "#fff",
  boxShadow: "0 8px 20px rgba(0,0,0,.12), 0 2px 6px rgba(0,0,0,.06)",
  borderRadius: 10,
  padding: 6,
  zIndex: 99999,  // ← A tope
};
const itemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  background: "transparent",
  border: "none",
  cursor: "pointer",
};
