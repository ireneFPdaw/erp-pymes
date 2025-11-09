import React, { useEffect, useState } from "react";
import { getPaciente, updatePaciente } from "../services/api.js";

const init = {
  nombres: "", apellidos: "", dni: "", email: "",
  telefono: "", direccion: "", sexo: "", patologias: "",
  fecha_nacimiento: "", activo: true,
};

export default function PacienteEditModal({ open, pacienteId, onClose, onUpdated }) {
  const [form, setForm] = useState(init);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !pacienteId) return;
    setErr("");
    setBusy(true);
    getPaciente(pacienteId)
      .then((p) => {
        setForm({
          ...init,
          ...p,
          fecha_nacimiento: p.fecha_nacimiento?.slice(0,10) || "",
          telefono: p.telefono || "",
          direccion: p.direccion || "",
          sexo: p.sexo || "",
          patologias: p.patologias || "",
          activo: !!p.activo,
        });
      })
      .catch((e) => setErr(e.message || "Error al cargar"))
      .finally(() => setBusy(false));
  }, [open, pacienteId]);

  if (!open) return null;

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      setBusy(true);
      const payload = { ...form };
      if (payload.fecha_nacimiento === "") payload.fecha_nacimiento = null;
      await updatePaciente(pacienteId, payload);
      onUpdated?.();
      onClose?.();
    } catch (e) {
      setErr(e.message || "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-h">
          <h3>Editar paciente</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </header>

        {err && <p className="msg err">{err}</p>}

        <form className="grid-form" onSubmit={onSubmit}>
          <label>
            Nombres*
            <input className="control" name="nombres" value={form.nombres} onChange={onChange} />
          </label>
          <label>
            Apellidos*
            <input className="control" name="apellidos" value={form.apellidos} onChange={onChange} />
          </label>
          <label>
            DNI*
            <input className="control" name="dni" value={form.dni} onChange={onChange} />
          </label>
          <label>
            Email*
            <input className="control" name="email" value={form.email} onChange={onChange} />
          </label>
          <label>
            Teléfono
            <input className="control" name="telefono" value={form.telefono} onChange={onChange} />
          </label>
          <label>
            Dirección
            <input className="control" name="direccion" value={form.direccion} onChange={onChange} />
          </label>
          <label>
            Sexo
            <input className="control" name="sexo" value={form.sexo} onChange={onChange} />
          </label>
          <label>
            Patologías
            <input className="control" name="patologias" value={form.patologias} onChange={onChange} />
          </label>
          <label>
            Fecha nacimiento
            <input
              className="control"
              type="date"
              name="fecha_nacimiento"
              value={form.fecha_nacimiento}
              onChange={onChange}
            />
          </label>
          <label className="label-inline">
            <span>Activo</span>
            <div className="switch">
              <input
                type="checkbox"
                name="activo"
                checked={!!form.activo}
                onChange={onChange}
              />
              <span>{form.activo ? "Sí" : "No"}</span>
            </div>
          </label>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn primary" disabled={busy}>
              {busy ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
