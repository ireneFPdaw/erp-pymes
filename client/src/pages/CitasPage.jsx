import React, { useEffect, useMemo, useState } from "react";
import {
  getCitas,
  createCita,
  updateCita,
  deleteCita,
  getEmpleados,
  getPacientes,
} from "../services/api.js";
import CitasCalendar from "../components/CitasCalendar.jsx";
import CitaForm from "../components/CitaForm.jsx";

export default function CitasPage() {
  const [empleados, setEmpleados] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [empleadoId, setEmpleadoId] = useState("all");
  const [citas, setCitas] = useState([]);
  const [rango, setRango] = useState({ from: "", to: "" });
  const [seleccionada, setSeleccionada] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  // cargar empleados y pacientes
  useEffect(() => {
    getEmpleados().then(setEmpleados).catch(console.error);
    getPacientes().then(setPacientes).catch(console.error);
  }, []);

  // cargar citas cuando cambia rango o empleado
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

  const profesionales = useMemo(
    () =>
      empleados.filter((e) =>
        ["fisioterapeuta", "gerente", "secretario"].includes(
          (e.rol || "").toLowerCase()
        )
      ),
    [empleados]
  );

  async function handleSubmit(cita) {
    try {
      setMensaje("");
      if (cita.id) {
        await updateCita(cita.id, cita);
        setMensaje("✅ Cita actualizada");
      } else {
        await createCita(cita);
        setMensaje("✅ Cita creada");
      }
      setSeleccionada(null);
      // recargar
      const params = { from: rango.from, to: rango.to };
      if (empleadoId !== "all") params.empleadoId = empleadoId;
      const data = await getCitas(params);
      setCitas(data);
    } catch (err) {
      setMensaje("❌ " + err.message);
    }
  }

  async function handleDelete(id) {
    try {
      if (!window.confirm("¿Eliminar esta cita?")) return;
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
    <div className="paper">
      <header className="citas-header">
        <div className="citas-header-main">
          <h2>Citas</h2>
          <p className="muted">
            Vista semanal de las agendas de fisioterapeutas, gerentes y
            secretaría.
          </p>
        </div>

        <div className="citas-filtros">
          <label>
            Profesional:
            <select
              value={empleadoId}
              onChange={(e) => setEmpleadoId(e.target.value)}
            >
              <option value="all">Todos</option>
              {profesionales.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </label>
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
          onSubmit={handleSubmit}
          onDelete={
            seleccionada.id ? () => handleDelete(seleccionada.id) : null
          }
          onClose={() => setSeleccionada(null)}
        />
      )}
    </div>
  );
}
