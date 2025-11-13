import React, { useEffect, useState } from "react";

const ESTADOS = ["programada", "realizada", "cancelada", "no acude"];

export default function CitaForm({
  cita,
  empleados,
  pacientes,
  onSubmit,
  onDelete,
  onClose,
}) {
  const [form, setForm] = useState({
    id: null,
    empleadoId: "",
    pacienteId: "",
    fecha: "",
    horaInicio: "09:00",
    horaFin: "10:00",
    tipo: "sesion",
    estado: "programada",
    sala: "",
    notas: "",
  });

  useEffect(() => {
    if (cita) {
      setForm((prev) => ({
        ...prev,
        ...cita,
        empleadoId: cita.empleadoId || "",
        pacienteId: cita.pacienteId || "",
      }));
    }
  }, [cita]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit?.({
      ...form,
      empleadoId: Number(form.empleadoId),
      pacienteId: Number(form.pacienteId),
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        aria-modal="true"
        role="dialog"
      >
        <header className="modal-header">
          <h3>{form.id ? "Editar cita" : "Nueva cita"}</h3>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </header>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Profesional
              <select
                name="empleadoId"
                value={form.empleadoId}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona profesional</option>
                {empleados.map((e) => (
                  <option key={e.id} value={e.id}>
                    {/* usa nombres/apellidos de tu tabla */}
                    {e.nombres && e.apellidos
                      ? `${e.apellidos}, ${e.nombres}`
                      : e.nombre || `Empleado ${e.id}`}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Paciente
              <select
                name="pacienteId"
                value={form.pacienteId}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona paciente</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombres && p.apellidos
                      ? `${p.apellidos}, ${p.nombres}`
                      : p.nombre || `Paciente ${p.id}`}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Fecha
              <input
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Hora inicio
              <input
                type="time"
                name="horaInicio"
                value={form.horaInicio}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Hora fin
              <input
                type="time"
                name="horaFin"
                value={form.horaFin}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Tipo
              <input
                type="text"
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
              />
            </label>

            <label>
              Estado
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Sala
              <input
                type="text"
                name="sala"
                value={form.sala}
                onChange={handleChange}
              />
            </label>
          </div>

          <label>
            Notas
            <textarea
              name="notas"
              rows={3}
              value={form.notas}
              onChange={handleChange}
            />
          </label>

          <footer className="modal-footer">
            {onDelete && form.id && (
              <button
                type="button"
                className="btn danger"
                onClick={onDelete}
              >
                Eliminar
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn primary">
              Guardar
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
