// src/pages/HistoriaClinica.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getPaciente,
  getPacienteArchivos,
  urlVerPacienteArchivo,
} from "../services/api.js";

const fmtFecha = (val) => {
  if (!val) return "—";
  const [y, m, d] = String(val).split("T")[0].split("-");
  return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
};

export default function HistoriaClinica() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState("");

  // ✅ Cabecera visible siempre
  const Header = () => (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
      }}
    >
      <h2>
        Historia clínica —{" "}
        {paciente
          ? `${paciente.nombres} ${paciente.apellidos}`
          : `Paciente #${id}`}
      </h2>
      <button className="btn" onClick={() => navigate(-1)}>
        ← Volver
      </button>
    </header>
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setError("");
        const [p, archivos] = await Promise.all([
          getPaciente(id),
          getPacienteArchivos(id),
        ]);
        if (!alive) return;
        setPaciente(p);
        setDocs(archivos || []);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "No se pudo cargar la historia clínica");
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <section className="panel paper" style={{ padding: 20 }}>
      <Header />

      {error && <p className="msg err">{error}</p>}
      {!error && !paciente && <p>Cargando…</p>}

      {paciente && (
        <>
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h3>Datos del paciente</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginTop: 8,
              }}
            >
              <Field k="DNI" v={paciente.dni} />
              <Field k="Email" v={paciente.email} type="link" />
              <Field k="Teléfono" v={paciente.telefono} />
              <Field k="Sexo" v={paciente.sexo || "—"} />
              <Field
                k="Fecha nacimiento"
                v={fmtFecha(paciente.fecha_nacimiento)}
              />
              <Field k="Dirección" v={paciente.direccion || "—"} />
              <Field k="Alergias" v={paciente.alergias || "—"} full />
              <Field k="Patologías" v={paciente.patologias || "—"} full />
              <Field
                k="Historia Clínica"
                v={paciente.historia_clinica || "—"}
                full
              />
              <Field k="Activo" v={paciente.activo ? "Sí" : "No"} />
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3>Documentos</h3>
            {docs.length === 0 ? (
              <p className="muted">No hay documentos.</p>
            ) : (
              <ul style={{ marginTop: 8 }}>
                {docs.map((f) => (
                  <li key={f.id} style={{ marginBottom: 6 }}>
                    <a
                      href={urlVerPacienteArchivo(id, f.id)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {f.nombre} ({Math.round((f.tamanio || 0) / 1024)} KB)
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function Field({ k, v, type, full }) {
  const content =
    type === "link" && v ? (
      <a href={`mailto:${v}`}>{v}</a>
    ) : (
      <span>{v || "—"}</span>
    );
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        gridColumn: full ? "1 / span 2" : "auto",
      }}
    >
      <strong style={{ minWidth: 180 }}>{k}</strong>
      <div style={{ flex: 1 }}>{content}</div>
    </div>
  );
}
