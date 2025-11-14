// client/src/pages/CitasPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  getCitas,
  createCita,
  updateCita,
  deleteCita,
  getEmpleados,
  getPacientes,
  getDisponibilidadEmpleado,
} from "../services/api.js";
import CitasCalendar from "../components/CitasCalendar.jsx";
import CitaForm from "../components/CitaForm.jsx";
import DisponibilidadModal from "../components/DisponibilidadModal.jsx";

// ---- Helpers para nombres y fecha bonita ----
function getEmpleadoNombreById(id, empleados) {
  const emp = empleados.find((e) => String(e.id) === String(id));
  if (!emp) return "—";
  return emp.nombres && emp.apellidos
    ? `${emp.apellidos}, ${emp.nombres}`
    : emp.nombre || `Empleado ${emp.id}`;
}

function getPacienteNombreById(id, pacientes) {
  const pac = pacientes.find((p) => String(p.id) === String(id));
  if (!pac) return "—";
  return pac.nombres && pac.apellidos
    ? `${pac.apellidos}, ${pac.nombres}`
    : pac.nombre || `Paciente ${pac.id}`;
}

function formatFechaBonita(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CitasPage() {
  const [empleados, setEmpleados] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [empleadoId, setEmpleadoId] = useState("all"); // filtro del calendario
  const [citas, setCitas] = useState([]);
  const [rango, setRango] = useState({ from: "", to: "" });
  const [seleccionada, setSeleccionada] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [citaAEliminar, setCitaAEliminar] = useState(null);
  const [formError, setFormError] = useState("");
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [editandoDisponibilidad, setEditandoDisponibilidad] = useState(false);

  // cargar empleados y pacientes
  useEffect(() => {
    getEmpleados().then(setEmpleados).catch(console.error);
    getPacientes().then(setPacientes).catch(console.error);
  }, []);

  // cargar citas cuando cambia rango o empleado (filtro calendario)
  useEffect(() => {
    if (!rango.from || !rango.to) return;
    setCargando(true);
    const params = { from: rango.from, to: rango.to };
    if (empleadoId !== "all") params.empleadoId = empleadoId;

    getCitas(params)
      .then(setCitas)
      .catch((err) => setMensaje("❌ " + err.message))
      .finally(() => setCargando(false));
  }, [rango, empleadoId]);

  // cargar disponibilidad para el profesional seleccionado (para pintar el calendario)
  useEffect(() => {
    if (empleadoId === "all") {
      setDisponibilidad([]);
      return;
    }
    getDisponibilidadEmpleado(empleadoId)
      .then(setDisponibilidad)
      .catch((err) => console.error(err));
  }, [empleadoId]);

  // todos los empleados
  const profesionales = useMemo(() => empleados, [empleados]);

  async function handleSubmit(cita) {
    try {
      setMensaje("");
      setFormError(""); // limpiamos error del modal

      if (cita.id) {
        await updateCita(cita.id, cita);
        setMensaje("✅ Cita actualizada");
      } else {
        await createCita(cita);
        setMensaje("✅ Cita creada");
      }

      setSeleccionada(null);

      // recargar citas
      const params = { from: rango.from, to: rango.to };
      if (empleadoId !== "all") params.empleadoId = empleadoId;
      const data = await getCitas(params);
      setCitas(data);
    } catch (err) {
      // mostramos el error dentro del modal
      setFormError(err.message || "Error al guardar la cita");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteCita(id);
      setMensaje("✅ Cita eliminada");
      const params = { from: rango.from, to: rango.to };
      if (empleadoId !== "all") params.empleadoId = empleadoId;
      const data = await getCitas(params);
      setCitas(data);
      setSeleccionada(null);
    } catch (err) {
      setMensaje("❌ " + err.message);
    }
  }

  return (
    <div className="paper citas-page">
<header className="citas-header">
  <div className="citas-header-main">
    <h2>Citas</h2>
    <p className="muted">
      Vista semanal de las agendas de fisioterapeutas, gerentes y
      secretaría.
    </p>
  </div>

  <div className="citas-filtros">
    <label className="citas-filtro-label">
      <span>Profesional:</span>
      <select
        value={empleadoId}
        onChange={(e) => setEmpleadoId(e.target.value)}
      >
        <option value="all">Todos</option>
        {profesionales.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nombres && e.apellidos
              ? `${e.nombres} ${e.apellidos}`
              : e.nombre || `Empleado ${e.id}`}
          </option>
        ))}
      </select>
    </label>

    <button
      type="button"
      className="btn ghost citas-filtro-btn"
      onClick={() => setEditandoDisponibilidad(true)}
    >
      Disponibilidad
    </button>
  </div>
</header>


      {mensaje && (
        <p
          className={`msg ${mensaje.startsWith("✅") ? "ok" : "err"}`}
          style={{ marginBottom: 12 }}
        >
          {mensaje}
        </p>
      )}

      <CitasCalendar
        citas={citas}
        empleados={profesionales}
        empleadoFiltro={empleadoId}
        disponibilidad={disponibilidad}
        onRangeChange={setRango}
        onSelectCita={setSeleccionada}
        onCreateCita={(slot) =>
          setSeleccionada({
            ...slot,
            empleadoId: empleadoId !== "all" ? Number(empleadoId) : "",
          })
        }
      />

      {cargando && (
        <p className="muted" style={{ marginTop: 8 }}>
          Cargando citas…
        </p>
      )}

      {seleccionada && (
        <CitaForm
          cita={seleccionada}
          empleados={profesionales}
          pacientes={pacientes}
          error={formError}
          onSubmit={handleSubmit}
          onDelete={
            seleccionada.id ? () => setCitaAEliminar(seleccionada) : null
          }
          onClose={() => {
            setFormError("");
            setSeleccionada(null);
          }}
        />
      )}
      {editandoDisponibilidad && (
        <DisponibilidadModal
          profesionales={profesionales}
          empleadoIdInicial={empleadoId !== "all" ? String(empleadoId) : null}
          semanaRango={rango} // 👈 Asegúrate de tener esto
          onClose={() => setEditandoDisponibilidad(false)}
          onSaved={(empleadoIdGuardado, bloquesActualizados) => {
            setEmpleadoId(String(empleadoIdGuardado));
            setDisponibilidad(bloquesActualizados);
            setEditandoDisponibilidad(false);
          }}
        />
      )}

      {/* Popup de confirmación de borrado */}
      {citaAEliminar && (
        <div className="modal-backdrop" onClick={() => setCitaAEliminar(null)}>
          <div
            className="modal modal-confirm"
            onClick={(e) => e.stopPropagation()}
            aria-modal="true"
            role="dialog"
          >
            <header className="modal-header">
              <h3>Eliminar cita</h3>
              <button
                className="icon-btn"
                onClick={() => setCitaAEliminar(null)}
              >
                ✕
              </button>
            </header>

            <div className="modal-body">
              <p>¿Seguro que quieres eliminar esta cita?</p>

              <p className="muted" style={{ marginTop: 8 }}>
                <strong>{formatFechaBonita(citaAEliminar.fecha)}</strong> ·{" "}
                {citaAEliminar.horaInicio}–{citaAEliminar.horaFin}
              </p>

              <p className="muted" style={{ marginTop: 8 }}>
                Profesional:{" "}
                <strong>
                  {getEmpleadoNombreById(
                    citaAEliminar.empleadoId,
                    profesionales
                  )}
                </strong>
                <br />
                Paciente:{" "}
                <strong>
                  {getPacienteNombreById(citaAEliminar.pacienteId, pacientes)}
                </strong>
              </p>
            </div>

            <footer className="modal-footer">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setCitaAEliminar(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => {
                  handleDelete(citaAEliminar.id);
                  setCitaAEliminar(null);
                }}
              >
                Eliminar
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
