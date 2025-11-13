import React, { useEffect, useMemo, useState } from "react";

const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i); // 8:00–20:00

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

function normalizeTime(t) {
  if (!t) return "";
  // "10:00:00" -> "10:00"
  return t.slice(0, 5);
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 domingo - 6 sábado
  const diff = (day === 0 ? -6 : 1) - day; // queremos lunes
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export default function CitasCalendar({
  citas,
  empleados,
  empleadoFiltro,
  onRangeChange,
  onSelectCita,
  onCreateCita,
}) {
  const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date()));

  // avisar al padre del rango actual
  useEffect(() => {
    const from = toISODate(currentWeek);
    const to = toISODate(addDays(currentWeek, 6));
    onRangeChange?.({ from, to });
  }, [currentWeek, onRangeChange]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i)),
    [currentWeek]
  );

  // citas de la semana actual
  const citasSemana = useMemo(() => {
    const from = toISODate(currentWeek);
    const to = toISODate(addDays(currentWeek, 6));
    return (citas || []).filter((c) => c.fecha >= from && c.fecha <= to);
  }, [citas, currentWeek]);

  function handleCellClick(day, hour) {
    const fecha = toISODate(day);
    const horaInicio = `${String(hour).padStart(2, "0")}:00`;
    const horaFin = `${String(hour + 1).padStart(2, "0")}:00`;
    onCreateCita?.({ fecha, horaInicio, horaFin });
  }

  function getEmpleadoNombre(id) {
    return empleados.find((e) => e.id === id)?.nombre || "";
  }

  return (
    <div className="citas-calendar">
      <div className="citas-calendar-toolbar">
        <button onClick={() => setCurrentWeek(addDays(currentWeek, -7))}>
          ◀ Semana anterior
        </button>
        <div className="citas-calendar-title">
          Semana del{" "}
          {days[0].toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
          })}{" "}
          al{" "}
          {days[6].toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
        <button onClick={() => setCurrentWeek(addDays(currentWeek, 7))}>
          Semana siguiente ▶
        </button>
      </div>

      <div className="citas-grid">
        {/* cabecera días */}
        <div className="citas-grid-header hour-col" />
        {days.map((d) => (
          <div key={d.toISOString()} className="citas-grid-header">
            <div className="dow">
              {d.toLocaleDateString(undefined, { weekday: "short" })}
            </div>
            <div className="date">
              {d.toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
              })}
            </div>
          </div>
        ))}

        {/* columnas de horas x días */}
        {HOURS.map((h) => (
          <React.Fragment key={h}>
            <div className="hour-col">
              {String(h).padStart(2, "0")}:00
            </div>
            {days.map((d) => {
              const fecha = toISODate(d);
              const horaStr = `${String(h).padStart(2, "0")}:00`;

              const citasEnCelda = citasSemana.filter((c) => {
                const start = normalizeTime(c.horaInicio);
                const end = normalizeTime(c.horaFin);

                return (
                  c.fecha === fecha &&
                  start <= horaStr &&
                  end > horaStr &&
                  (empleadoFiltro === "all" ||
                    String(c.empleadoId) === String(empleadoFiltro))
                );
              });

              return (
                <div
                  key={fecha + h}
                  className="citas-cell"
                  onClick={(e) => {
                    // solo crear si se hace click en fondo, no en un chip
                    if (e.target === e.currentTarget) {
                      handleCellClick(d, h);
                    }
                  }}
                >
                  {citasEnCelda.map((c) => (
                    <button
                      key={c.id}
                      className="cita-chip"
                      type="button"
                      onClick={() => onSelectCita?.(c)}
                    >
                      <span className="cita-chip-hora">
                        {normalizeTime(c.horaInicio)}-
                        {normalizeTime(c.horaFin)}
                      </span>
                      <span className="cita-chip-txt">
                        {getEmpleadoNombre(c.empleadoId)}
                      </span>
                      {c.tipo && (
                        <span className="cita-chip-tipo">{c.tipo}</span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
