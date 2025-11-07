import React, { useEffect, useState } from "react";
import {
  getEmpleadoArchivos,
  uploadEmpleadoArchivo,
  deleteEmpleadoArchivo,
  urlVerEmpleadoArchivo,
} from "../services/api.js";

export default function EmpleadoFilesModal({ open, empleado, onClose }) {
  const [docs, setDocs] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // estado para el popup de confirmación
  const [confirm, setConfirm] = useState({ open: false, id: null, nombre: "" });

  useEffect(() => {
    if (!open || !empleado?.id) return;
    setErr("");
    setBusy(true);
    getEmpleadoArchivos(empleado.id)
      .then(setDocs)
      .catch((e) => setErr(e.message || "Error cargando archivos"))
      .finally(() => setBusy(false));
  }, [open, empleado?.id]);

  if (!open) return null;

  async function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setErr("");
      setBusy(true);
      await uploadEmpleadoArchivo(empleado.id, file);
      const fresh = await getEmpleadoArchivos(empleado.id);
      setDocs(fresh);
    } catch (e) {
      setErr(e.message || "No se pudo subir el archivo");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  function askDelete(file) {
    setConfirm({ open: true, id: file.id, nombre: file.nombre });
  }

  async function doDelete() {
    const fileId = confirm.id;
    if (!fileId) return;
    try {
      setErr("");
      setBusy(true);
      await deleteEmpleadoArchivo(empleado.id, fileId);
      setDocs((d) => d.filter((x) => x.id !== fileId));
    } catch (e) {
      setErr(e.message || "No se pudo eliminar");
    } finally {
      setBusy(false);
      setConfirm({ open: false, id: null, nombre: "" });
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-h">
          <h3>
            Documentos de {empleado?.apellidos}, {empleado?.nombres}
          </h3>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </header>

        {err && <p className="msg err">{err}</p>}

        <label className="btn">
          Subir archivo ...
          <input
            type="file"
            style={{ display: "none" }}
            onChange={onUpload}
            disabled={busy}
          />
        </label>

        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tamaño</th>
                <th>Tipo</th>
                <th>Subido</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td className="truncate">{d.nombre}</td>
                  <td>{(d.bytes / 1024).toFixed(1)} KB</td>
                  <td>{d.mime}</td>
                  <td>{new Date(d.created_at).toLocaleString()}</td>
                  <td style={{ textAlign: "right" }}>
                    <a
                      className="btn btn-ver"
                      href={urlVerEmpleadoArchivo(empleado.id, d.id)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver
                    </a>
                    <button
                      className="btn btn-borrar"
                      onClick={() => askDelete(d)}
                      disabled={busy}
                    >
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
              {docs.length === 0 && (
                <tr>
                  <td colSpan="5" className="muted">
                    Sin documentos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Popup de confirmación */}
        {confirm.open && (
          <div
            className="confirm-backdrop"
            onClick={() => setConfirm({ open: false, id: null, nombre: "" })}
          >
            <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
              <h4>Eliminar archivo</h4>
              <p>
                ¿Seguro que deseas eliminar <strong>{confirm.nombre}</strong>?
              </p>
              <div className="confirm-actions">
                <button
                  className="btn"
                  onClick={() =>
                    setConfirm({ open: false, id: null, nombre: "" })
                  }
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-danger"
                  onClick={doDelete}
                  disabled={busy}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
