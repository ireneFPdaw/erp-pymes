import React, { useEffect, useState } from "react";
import { getEmpleado, updateEmpleado } from "../services/api.js";
import imageCompression from "browser-image-compression";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

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
  foto_base64: "", // si no se envía, no cambia
};

export default function EmpleadoEditModal({
  open,
  empleadoId,
  onClose,
  onUpdated,
}) {
  const [form, setForm] = useState(init);
  const [err, setErr] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [fileName, setFileName] = useState("");

  const [previewUrl, setPreviewUrl] = useState(""); // muestra la foto actual o la nueva
  const [removePhoto, setRemovePhoto] = useState(false);

  useEffect(() => {
    if (open && empleadoId) {
      setErr("");
      setRemovePhoto(false);
      setPreviewUrl("");
      getEmpleado(empleadoId)
        .then((data) => {
          setForm({
            ...init,
            ...data,
            fecha_nacimiento: data.fecha_nacimiento?.slice(0, 10) || "",
            fecha_contratacion: data.fecha_contratacion?.slice(0, 10) || "",
            salario: data.salario ?? "",
          });
          if (data.tiene_foto) {
            setPreviewUrl(
              `${API}/api/empleados/${empleadoId}/foto?ts=${Date.now()}`
            );
          }
        })
        .catch((e) => setErr(e.message));
    }
  }, [open, empleadoId]);

  if (!open) return null;

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result || "";
        const base64 = result.toString().split(",")[1] || "";
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;

    const options = {
      maxSizeMB: 2,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };
    try {
      const compressedFile = await imageCompression(f, options);
      const b64 = await toBase64(compressedFile);
      setForm((prev) => ({ ...prev, foto_base64: b64 }));
      setFileName(compressedFile.name || f.name);
      setPreviewUrl(URL.createObjectURL(compressedFile));
      setRemovePhoto(false); // estamos reemplazando, no borrando
    } catch {
      setErr("No se pudo comprimir o leer la imagen.");
    }
  }

  function handleRemovePhoto() {
    setRemovePhoto(true);
    setPreviewUrl("");
    setForm((prev) => ({ ...prev, foto_base64: "" }));
    setFileName("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    const payload = { ...form };

    // normalizaciones
    const toNull = (v) => (v === "" ? null : v);
    payload.fecha_nacimiento = toNull(payload.fecha_nacimiento);
    payload.fecha_contratacion = toNull(payload.fecha_contratacion);
    payload.salario = payload.salario === "" ? null : Number(payload.salario);

    // foto:
    if (removePhoto) {
      payload.eliminar_foto = true; // backend hará foto = NULL
      delete payload.foto_base64;
    } else if (!payload.foto_base64) {
      // no se tocó la foto → no incluir campo para que no cambie
      delete payload.foto_base64;
    }

    try {
      setEnviando(true);
      await updateEmpleado(empleadoId, payload);
      onUpdated?.();
      onClose?.();
    } catch (e) {
      setErr(e.message || "Error al guardar");
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
          <h3 id="modal-title">Editar empleado</h3>
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
          {/* mismos campos que el modal de crear */}
          <label>
            {" "}
            Nombres*{" "}
            <input
              className="control"
              name="nombres"
              value={form.nombres}
              onChange={handleChange}
              autoFocus
            />
          </label>
          <label>
            {" "}
            Apellidos*{" "}
            <input
              className="control"
              name="apellidos"
              value={form.apellidos}
              onChange={handleChange}
            />
          </label>
          <label>
            {" "}
            DNI*{" "}
            <input
              className="control"
              name="dni"
              value={form.dni}
              onChange={handleChange}
            />
          </label>
          <label>
            {" "}
            Email*{" "}
            <input
              className="control"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
          </label>
          <label>
            {" "}
            Teléfono{" "}
            <input
              className="control"
              name="telefono"
              value={form.telefono || ""}
              onChange={handleChange}
            />
          </label>
          <label>
            {" "}
            Dirección{" "}
            <input
              className="control"
              name="direccion"
              value={form.direccion || ""}
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
            {" "}
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
            {" "}
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
            {" "}
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

          <label>
            Foto
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {/* preview si existe */}
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Foto del empleado"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "999px",
                    objectFit: "cover",
                    boxShadow: "0 0 0 1px #e6e8f1 inset",
                  }}
                />
              ) : (
                <div
                  className="avatar fallback"
                  style={{ width: 64, height: 64 }}
                >
                  👤
                </div>
              )}

              <div className="file-field">
                <input
                  id="foto-edit"
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                />
                <label htmlFor="foto-edit" className="btn">
                  Seleccionar archivo
                </label>
                <span className="file-name">
                  {fileName || (previewUrl ? "Foto actual" : "Sin archivos")}
                </span>
              </div>

              {/* botón para quitar foto si hay actual o nueva */}
              {(previewUrl || form.foto_base64) && (
                <button
                  type="button"
                  className="btn"
                  onClick={handleRemovePhoto}
                >
                  Quitar foto
                </button>
              )}
            </div>
          </label>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn primary" disabled={enviando}>
              {enviando ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
