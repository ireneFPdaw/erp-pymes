// src/components/PacienteModal.jsx
import React, { useEffect, useState } from "react";
import { createPaciente } from "../services/api.js";

const init = {
  nombres: "",
  apellidos: "",
  dni: "",
  email: "",
  telefono: "",
  sexo: "F", // F | M | Otro
  patologias: "",
  activo: true,
};

export default function PacienteModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(init);
  const [err, setErr] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(init);
      setErr("");
    }
  }, [open]);

  if (!open) return null;

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (
      !form.nombres.trim() ||
      !form.apellidos.trim() ||
      !form.dni.trim() ||
      !form.email.trim()
    ) {
      setErr("Completa nombres, apellidos, DNI y email.");
      return;
    }

    try {
      setEnviando(true);
      const payload = { ...form, activo: Boolean(form.activo) };
      await createPaciente(payload);
      onCreated?.();
      onClose?.();
    } catch (e) {
      setErr(e.message || "No se pudo crear el paciente");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-h">
          <h3>Nuevo paciente</h3>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </header>

        {err && <p className="msg err">{err}</p>}

        <form onSubmit={onSubmit} className="grid-form">
          <label>
            Nombres*
            <input
              className="control"
              name="nombres"
              value={form.nombres}
              onChange={handleChange}
              autoFocus
            />
          </label>
          <label>
            Apellidos*
            <input
              className="control"
              name="apellidos"
              value={form.apellidos}
              onChange={handleChange}
            />
          </label>
          <label>
            DNI*
            <input
              className="control"
              name="dni"
              value={form.dni}
              onChange={handleChange}
            />
          </label>
          <label>
            Email*
            <input
              className="control"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
          </label>
          <label>
            Teléfono
            <input
              className="control"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
            />
          </label>
          <label>
            Sexo
            <select
              className="control"
              name="sexo"
              value={form.sexo}
              onChange={handleChange}
            >
              <option value="F">F</option>
              <option value="M">M</option>
              <option value="Otro">Otro</option>
            </select>
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            Patologías
            <input
              className="control"
              name="patologias"
              value={form.patologias}
              onChange={handleChange}
            />
          </label>

          <label className="label-inline">
            <span>Activo</span>
            <div className="switch">
              <input
                type="checkbox"
                name="activo"
                checked={!!form.activo}
                onChange={handleChange}
              />
              <span>{form.activo ? "Sí" : "No"}</span>
            </div>
          </label>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn primary" disabled={enviando}>
              {enviando ? "Guardando…" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
