import React, { useEffect, useMemo, useState } from "react";
import { SALAS_COLORS } from "../constants/salas";


const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i);

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

function normalizeTime(t) {
  if (!t) return "";
  return t.slice(0, 5);
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
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
  disponibilidad,
  onRangeChange,
  onSelectCita,
  onCreateCita,
}) {
  const [currentWeek, setCurrentWeek] = useState(() =>
    startOfWeek(new Date())
  );


  useEffect(() => {
    const from = toISODate(currentWeek);
    const to = toISODate(addDays(currentWeek, 6));
    onRangeChange?.({ from, to });
  }, [currentWeek, onRangeChange]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i)),
    [currentWeek]
  );

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
    const emp = empleados.find((e) => e.id === id);
    if (!emp) return "";
    if (emp.nombres && emp.apellidos) return `${emp.apellidos}, ${emp.nombres}`;
    return emp.nombre || `Empleado ${emp.id}`;
  }

  return (
    <div className="citas-calendar">
      {/* ────────────────────────────────────────────── */}
      {/* Toolbar de navegación */}
      {/* ────────────────────────────────────────────── */}
      <div className="citas-calendar-toolbar">
        <button onClick={() => setCurrentWeek(addDays(currentWeek, -7))}>
          ◀ Semana anterior
        </button>

        <div className="citas-calendar-title">
          Semana del{" "}
          {days[0].toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
          })}{" "}
          al{" "}
          {days[6].toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>

        <button onClick={() => setCurrentWeek(addDays(currentWeek, 7))}>
          Semana siguiente ▶
        </button>
      </div>

      {/* ────────────────────────────────────────────── */}
      {/* Leyenda de salas */}
      {/* ────────────────────────────────────────────── */}
      <div className="salas-legend">
        <div>
          <span
            className="legend-color"
            style={{ background: SALAS_COLORS.F1 }}
          />
          Sala F1
        </div>
        <div>
          <span
            className="legend-color"
            style={{ background: SALAS_COLORS.F2 }}
          />
          Sala F2
        </div>
        <div>
          <span
            className="legend-color"
            style={{ background: SALAS_COLORS.F3 }}
          />
          Sala F3
        </div>
        <div>
          <span
            className="legend-color"
            style={{ background: SALAS_COLORS.DESPACHO }}
          />
          Despacho
        </div>
      </div>

      {/* ────────────────────────────────────────────── */}
      {/* GRID DEL CALENDARIO */}
      {/* ────────────────────────────────────────────── */}
      <div className="citas-grid">
        {/* Cabecera días */}
        <div className="citas-grid-header hour-col" />
        {days.map((d) => (
          <div key={d.toISOString()} className="citas-grid-header">
            <div className="dow">
              {d.toLocaleDateString("es-ES", { weekday: "short" })}
            </div>
            <div className="date">
              {d.toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
              })}
            </div>
          </div>
        ))}

        {/* Horas x días */}
        {HOURS.map((h) => (
          <React.Fragment key={h}>
            <div className="hour-col">{String(h).padStart(2, "0")}:00</div>

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


              const diaSemana = (() => {
                const js = d.getDay();
                return js === 0 ? 7 : js;
              })();

              const bloquesDia = (disponibilidad || []).filter(
                (b) => Number(b.diaSemana) === diaSemana
              );

              const isDisponible =
                empleadoFiltro === "all"
                  ? true
                  : bloquesDia.some(
                      (b) => horaStr >= b.horaInicio && horaStr < b.horaFin
                    );

              return (
                <div
                  key={fecha + h}
                  className="citas-cell"
                  style={{
                    background: !isDisponible ? "#f8f8f8" : undefined,
                    opacity: !isDisponible ? 0.45 : 1,
                    cursor: !isDisponible ? "not-allowed" : "pointer",
                  }}
                  onClick={(e) => {
                    if (!isDisponible) return;
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
                      style={{
                        background:
                          SALAS_COLORS[c.sala] || SALAS_COLORS.DEFAULT,
                      }}
                      onClick={() => onSelectCita?.(c)}
                    >
                      <span className="cita-chip-hora">
                        {normalizeTime(c.horaInicio)}–
                        {normalizeTime(c.horaFin)}
                      </span>

                      <span className="cita-chip-txt">
                        {getEmpleadoNombre(c.empleadoId)}
                      </span>

                      {c.tipo && (
                        <span className="cita-chip-tipo">{c.tipo}</span>
                      )}

                      {c.sala && (
                        <span className="cita-chip-sala">({c.sala})</span>
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
