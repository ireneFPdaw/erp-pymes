// src/components/PacienteFilesModal.jsx
import React, { useEffect, useState } from "react";
import {
  getPacienteArchivos,
  deletePacienteArchivo,
  urlVerPacienteArchivo,
} from "../services/api.js";

const kindIcon = (mime) => {
  if (!mime) return "📄";
  if (mime.startsWith("image/")) return "🖼️";
  if (mime === "application/pdf") return "📄";
  if (mime.includes("zip")) return "📦";
  if (mime.includes("word") || mime.includes("msword")) return "📝";
  if (mime.includes("sheet") || mime.includes("excel")) return "📊";
  return "📄";
};

export default function PacienteFilesModal({ open, paciente, onClose }) {
  const [docs, setDocs] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [confirm, setConfirm] = useState({ open: false, id: null });

  useEffect(() => {
    if (!open || !paciente?.id) return;
    setErr("");
    setBusy(true);
    getPacienteArchivos(paciente.id)
      .then(setDocs)
      .catch((e) => setErr(e.message || "Error cargando archivos"))
      .finally(() => setBusy(false));
  }, [open, paciente?.id]);

  if (!open) return null;

  async function refetch() {
    const fresh = await getPacienteArchivos(paciente.id);
    setDocs(fresh);
  }

  function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    setBusy(true);
    setProgress(0);

    const fd = new FormData();
    fd.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `${
        import.meta.env.VITE_API_URL || "http://localhost:4000"
      }/api/pacientes/${paciente.id}/archivos`,
      true
    );
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable)
        setProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = async () => {
      setBusy(false);
      setProgress(0);
      if (xhr.status >= 200 && xhr.status < 300) {
        await refetch();
      } else {
        setErr("No se pudo subir el archivo");
      }
      e.target.value = "";
    };
    xhr.onerror = () => {
      setBusy(false);
      setProgress(0);
      setErr("Error de red al subir");
      e.target.value = "";
    };
    xhr.send(fd);
  }

  async function doDelete() {
    if (!confirm.id) return;
    try {
      setBusy(true);
      setErr("");
      await deletePacienteArchivo(paciente.id, confirm.id);
      setDocs((d) => d.filter((x) => x.id !== confirm.id));
    } catch (e) {
      setErr(e.message || "No se pudo eliminar");
    } finally {
      setBusy(false);
      setConfirm({ open: false, id: null });
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-h">
          <h3>
            Documentos de {paciente?.apellidos}, {paciente?.nombres}
          </h3>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </header>

        {err && <p className="msg err">{err}</p>}

        <label className="btn">
          Subir archivo …
          <input
            type="file"
            style={{ display: "none" }}
            onChange={onUpload}
            disabled={busy}
          />
        </label>

        {progress > 0 && (
          <div
            style={{
              margin: "10px 0",
              height: 8,
              background: "#eef1ff",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#5a6bff",
                transition: "width .2s",
              }}
            />
          </div>
        )}

        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Nombre</th>
                <th>Tamaño</th>
                <th>Tipo</th>
                <th>Subido</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => {
                const isImg = (d.mime || "").startsWith("image/");
                const url = urlVerPacienteArchivo(paciente.id, d.id);
                return (
                  <tr key={d.id}>
                    <td style={{ width: 48, textAlign: "center" }}>
                      {isImg ? (
                        <img
                          src={url}
                          alt=""
                          style={{
                            width: 36,
                            height: 36,
                            objectFit: "cover",
                            borderRadius: 6,
                            boxShadow: "0 0 0 1px #eee",
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 18 }}>{kindIcon(d.mime)}</span>
                      )}
                    </td>
                    <td className="truncate">{d.nombre}</td>
                    <td>{(d.bytes / 1024).toFixed(1)} KB</td>
                    <td>{d.mime}</td>
                    <td>{new Date(d.created_at).toLocaleString()}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <a
                        className="btn btn-ver"
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver
                      </a>
                      <a className="btn" href={url} download>
                        Descargar
                      </a>
                      <button
                        className="btn btn-borrar"
                        onClick={() => setConfirm({ open: true, id: d.id })}
                        disabled={busy}
                      >
                        Borrar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {docs.length === 0 && (
                <tr>
                  <td colSpan="6" className="muted">
                    Sin documentos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {confirm.open && (
          <div
            className="confirm-backdrop"
            onClick={() => setConfirm({ open: false, id: null })}
          >
            <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
              <h4>Eliminar archivo</h4>
              <p>¿Seguro que deseas eliminar este archivo?</p>
              <div className="confirm-actions">
                <button
                  className="btn"
                  onClick={() => setConfirm({ open: false, id: null })}
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
