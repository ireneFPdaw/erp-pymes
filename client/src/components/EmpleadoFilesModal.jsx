import React, { useEffect, useState } from "react";
import {
  listArchivos,
  uploadArchivo,
  downloadArchivoUrl,
  deleteArchivo,
  renameArchivo,
} from "../services/api.js";

export default function EmpleadoFilesModal({ open, empleado, onClose }) {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !empleado?.id) return;
    (async () => {
      setErr("");
      try {
        setRows(await listArchivos(empleado.id));
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [open, empleado?.id]);

  if (!open) return null;

  async function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      await uploadArchivo(empleado.id, file);
      setRows(await listArchivos(empleado.id));
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function onRename(id) {
    const nombre = prompt("Nuevo nombre:");
    if (!nombre) return;
    try {
      setBusy(true);
      await renameArchivo(empleado.id, id, nombre);
      setRows(await listArchivos(empleado.id));
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id) {
    if (!confirm("¿Eliminar archivo?")) return;
    try {
      setBusy(true);
      await deleteArchivo(empleado.id, id);
      setRows(await listArchivos(empleado.id));
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-h">
          <h3>
            Documentos de {empleado.apellidos}, {empleado.nombres}
          </h3>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </header>

        {err && <p className="msg err">{err}</p>}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <label className="btn">
            Subir archivo
            <input
              type="file"
              onChange={onUpload}
              style={{ display: "none" }}
              disabled={busy}
            />
          </label>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tamaño</th>
                <th>Tipo</th>
                <th>Subido</th>
                <th style={{ width: 120 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>{a.nombre}</td>
                  <td>{(a.bytes / 1024).toFixed(1)} KB</td>
                  <td>{a.mime}</td>
                  <td>{new Date(a.created_at).toLocaleString()}</td>
                  <td style={{ textAlign: "right" }}>
                    <a
                      className="btn"
                      href={downloadArchivoUrl(empleado.id, a.id)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver
                    </a>
                    <button className="btn" onClick={() => onRename(a.id)}>
                      Renombrar
                    </button>
                    <button className="btn" onClick={() => onDelete(a.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="5" className="muted">
                    Sin documentos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
