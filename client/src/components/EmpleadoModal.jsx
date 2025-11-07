import React, { useEffect, useState } from "react";
import { createEmpleado } from "../services/api.js";
import imageCompression from "browser-image-compression";

const init = {
  nombres: "",
  apellidos: "",
  dni: "",
  email: "",
  telefono: "",
  direccion: "",
  rol: "fisioterapeuta",
  fecha_nacimiento: "",
  fecha_contratacion: "",
  salario: "",
  activo: true,
  foto_base64: "", // opcional
};

export default function EmpleadoModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(init);
  const [err, setErr] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [fileName, setFileName] = useState("");
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

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result; // data:<mime>;base64,xxxx
        const base64 = (result || "").toString().split(",")[1] || "";
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;

    // 1) Rechazo rápido si es gigantesca (opcional)
    const MAX_MB = 2;
    const MAX_BYTES = MAX_MB * 1024 * 1024;

    // 2) Opciones de compresión
    const options = {
      maxSizeMB: 2, // intenta no superar 2 MB
      maxWidthOrHeight: 1024, // redimensiona si es muy grande
      useWebWorker: true,
    };

    try {
      // 3) Comprimir
      const compressedFile = await imageCompression(f, options);

      // 4) Si aun así supera 2MB, avisamos
      if (compressedFile.size > MAX_BYTES) {
        setErr(
          `La imagen sigue superando ${MAX_MB} MB. Por favor elige otra más pequeña.`
        );
        return;
      }

      // 5) Convertir a Base64 (sin el prefijo data:)
      const b64 = await toBase64(compressedFile);
      setForm((prev) => ({ ...prev, foto_base64: b64 }));
      setFileName(compressedFile.name || f.name);
    } catch (err) {
      console.error(err); // <- ya usamos la variable, ESLint contento
      setErr("No se pudo comprimir o leer la imagen.");
    }
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

      const payload = { ...form };

      // ✅ Asegurar boolean
      payload.activo = Boolean(form.activo);

      if (payload.salario === "") payload.salario = null;

      await createEmpleado(payload);

      onCreated?.(); // refresca tabla
      onClose?.();
    } catch (e) {
      setErr(e.message);
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
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-h">
          <h3 id="modal-title">Nuevo empleado</h3>
          <button className="icon-btn" onClick={onClose} title="Cerrar">
            ✕
          </button>
        </header>

        {err && (
          <p className="msg err" role="alert">
            {err}
          </p>
        )}

        <form onSubmit={onSubmit} className="grid-form">
          <label>
            Nombres*
            <input
              className="control"
              name="nombres"
              type="text"
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
              type="text"
              value={form.apellidos}
              onChange={handleChange}
            />
          </label>
          <label>
            DNI*
            <input
              className="control"
              name="dni"
              type="text"
              value={form.dni}
              onChange={handleChange}
            />
          </label>
          <label>
            Email*
            <input
              className="control"
              name="email"
              type="text"
              value={form.email}
              onChange={handleChange}
            />
          </label>
          <label>
            Teléfono
            <input
              className="control"
              name="telefono"
              type="text"
              value={form.telefono}
              onChange={handleChange}
            />
          </label>
          <label>
            Dirección
            <input
              className="control"
              name="direccion"
              type="text"
              value={form.direccion}
              onChange={handleChange}
            />
          </label>
          <label>
            Rol*
            <select
              className="control"
              name="rol"
              value={form.rol}
              onChange={handleChange}
            >
              <option value="gerente">gerente</option>
              <option value="secretario">secretario</option>
              <option value="fisioterapeuta">fisioterapeuta</option>
            </select>
          </label>
          <label>
            Fecha nacimiento
            <input
              className="control"
              name="fecha_nacimiento"
              type="date"
              value={form.fecha_nacimiento}
              onChange={handleChange}
            />
          </label>
          <label>
            Fecha contratación
            <input
              className="control"
              name="fecha_contratacion"
              type="date"
              value={form.fecha_contratacion}
              onChange={handleChange}
            />
          </label>
          <label>
            Salario (€)
            <input
              className="control"
              name="salario"
              type="number"
              step="0.01"
              value={form.salario}
              onChange={handleChange}
            />
          </label>
          <label className="label-inline field-activo">
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
        <label className="field-foto">
            Foto
            <div className="file-field">
              <input
                id="foto"
                type="file"
                accept="image/*"
                onChange={handleFile}
              />
              <label htmlFor="foto" className="btn">
                Seleccionar archivo
              </label>
              <span className="file-name">
                {fileName || "Sin archivos seleccionados"}
              </span>
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
