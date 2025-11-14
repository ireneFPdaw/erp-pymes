// client/src/components/DisponibilidadModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  getDisponibilidadEmpleado,
  saveDisponibilidadEmpleado,
  getDisponibilidadExcepciones,
  saveDisponibilidadExcepciones,
} from "../services/api.js";

const DIAS_SEMANA = [
  { value: 1, corto: "Lun", largo: "Lunes" },
  { value: 2, corto: "Mar", largo: "Martes" },
  { value: 3, corto: "Mié", largo: "Miércoles" },
  { value: 4, corto: "Jue", largo: "Jueves" },
  { value: 5, corto: "Vie", largo: "Viernes" },
  { value: 6, corto: "Sáb", largo: "Sábado" },
  { value: 7, corto: "Dom", largo: "Domingo" },
];

function crearEstadoVacio() {
  const obj = {};
  DIAS_SEMANA.forEach((d) => {
    obj[d.value] = [];
  });
  return obj;
}

let tmpId = 0;
function nuevoId() {
  tmpId += 1;
  return `tmp-${tmpId}`;
}

function formatearFechaBonita(fechaStr) {
  if (!fechaStr) return "";
  const d = new Date(fechaStr);
  return d.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getFechasSemana(semanaRango) {
  if (!semanaRango?.from || !semanaRango?.to) return [];
  const start = new Date(semanaRango.from);
  const end = new Date(semanaRango.to);
  const fechas = [];
  let d = new Date(start);
  while (d <= end) {
    const iso = d.toISOString().slice(0, 10);
    fechas.push(iso);
    d.setDate(d.getDate() + 1);
  }
  return fechas;
}

export default function DisponibilidadModal({
  profesionales,
  empleadoIdInicial,
  semanaRango,
  onClose,
  onSaved,
}) {
  const [empleadoId, setEmpleadoId] = useState(
    empleadoIdInicial || (profesionales[0] ? String(profesionales[0].id) : null)
  );
  const [bloquesPorDia, setBloquesPorDia] = useState(crearEstadoVacio);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [excepcionesPorFecha, setExcepcionesPorFecha] = useState({});
  const [cargandoExcepciones, setCargandoExcepciones] = useState(false);

  const empleadoActual = useMemo(
    () => profesionales.find((e) => String(e.id) === String(empleadoId)),
    [profesionales, empleadoId]
  );

  const fechasSemana = useMemo(
    () => getFechasSemana(semanaRango),
    [semanaRango]
  );


  useEffect(() => {
    if (!empleadoId) return;

    setCargando(true);
    setError("");
    getDisponibilidadEmpleado(empleadoId)
      .then((bloquesBD) => {
        const nuevoEstado = crearEstadoVacio();
        (bloquesBD || []).forEach((b) => {
          const dia = Number(b.diaSemana);
          if (!nuevoEstado[dia]) nuevoEstado[dia] = [];
          nuevoEstado[dia].push({
            id: b.id ?? nuevoId(),
            horaInicio: b.horaInicio,
            horaFin: b.horaFin,
          });
        });
        setBloquesPorDia(nuevoEstado);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "No se pudo cargar la disponibilidad semanal");
      })
      .finally(() => setCargando(false));
  }, [empleadoId]);

  // Cargar excepciones de la semana visible al cambiar profesional o semana
  useEffect(() => {
    if (!empleadoId || !semanaRango?.from || !semanaRango?.to) {
      setExcepcionesPorFecha({});
      return;
    }

    setCargandoExcepciones(true);
    getDisponibilidadExcepciones(empleadoId, {
      from: semanaRango.from,
      to: semanaRango.to,
    })
      .then((rows) => {
        const mapa = {};
        (rows || []).forEach((r) => {
          const fecha = r.fecha;
          if (r.cerrado) {
            mapa[fecha] = { tipo: "cerrado", bloques: [] };
          } else {
            if (!mapa[fecha] || mapa[fecha].tipo !== "especial") {
              mapa[fecha] = { tipo: "especial", bloques: [] };
            }
            mapa[fecha].bloques.push({
              id: r.id ?? nuevoId(),
              horaInicio: r.horaInicio,
              horaFin: r.horaFin,
            });
          }
        });
        setExcepcionesPorFecha(mapa);
      })
      .catch((err) => {
        console.error(err);
        setError(
          err.message || "No se pudieron cargar las excepciones de la semana"
        );
      })
      .finally(() => setCargandoExcepciones(false));
  }, [empleadoId, semanaRango?.from, semanaRango?.to]);

  // ---- Plantilla semanal ----
  function handleChangeFranja(dia, franjaId, campo, valor) {
    setBloquesPorDia((prev) => {
      const copia = { ...prev };
      copia[dia] = copia[dia].map((f) =>
        f.id === franjaId ? { ...f, [campo]: valor } : f
      );
      return copia;
    });
  }

  function handleAddFranja(dia) {
    setBloquesPorDia((prev) => {
      const copia = { ...prev };
      const franjaNueva = {
        id: nuevoId(),
        horaInicio: "08:00",
        horaFin: "12:00",
      };
      copia[dia] = [...(copia[dia] || []), franjaNueva];
      return copia;
    });
  }

  function handleRemoveFranja(dia, franjaId) {
    setBloquesPorDia((prev) => {
      const copia = { ...prev };
      copia[dia] = (copia[dia] || []).filter((f) => f.id !== franjaId);
      return copia;
    });
  }

  function handleVaciarSemana() {
    setBloquesPorDia(crearEstadoVacio());
  }

  // ---- Excepciones por fecha ----

  function setTipoExcepcion(fecha, tipo) {
    setExcepcionesPorFecha((prev) => {
      const copia = { ...prev };
      if (tipo === "ninguna") {
        delete copia[fecha];
      } else if (tipo === "cerrado") {
        copia[fecha] = { tipo: "cerrado", bloques: [] };
      } else if (tipo === "especial") {
        const bloquesPrevios =
          copia[fecha]?.bloques && copia[fecha].bloques.length > 0
            ? copia[fecha].bloques
            : [
                {
                  id: nuevoId(),
                  horaInicio: "08:00",
                  horaFin: "12:00",
                },
              ];
        copia[fecha] = { tipo: "especial", bloques: bloquesPrevios };
      }
      return copia;
    });
  }

  function handleChangeFranjaEx(fecha, franjaId, campo, valor) {
    setExcepcionesPorFecha((prev) => {
      const copia = { ...prev };
      const estado = copia[fecha];
      if (!estado || estado.tipo !== "especial") return prev;
      const nuevosBloques = estado.bloques.map((b) =>
        b.id === franjaId ? { ...b, [campo]: valor } : b
      );
      copia[fecha] = { ...estado, bloques: nuevosBloques };
      return copia;
    });
  }

  function handleAddFranjaEx(fecha) {
    setExcepcionesPorFecha((prev) => {
      const copia = { ...prev };
      const estado = copia[fecha] || { tipo: "especial", bloques: [] };
      const nueva = {
        id: nuevoId(),
        horaInicio: "08:00",
        horaFin: "12:00",
      };
      copia[fecha] = {
        tipo: "especial",
        bloques: [...(estado.bloques || []), nueva],
      };
      return copia;
    });
  }

  function handleRemoveFranjaEx(fecha, franjaId) {
    setExcepcionesPorFecha((prev) => {
      const copia = { ...prev };
      const estado = copia[fecha];
      if (!estado || estado.tipo !== "especial") return prev;
      copia[fecha] = {
        ...estado,
        bloques: estado.bloques.filter((b) => b.id !== franjaId),
      };
      return copia;
    });
  }

  // ---- Guardar todo ----
  async function handleGuardar() {
    try {
      setError("");
      if (!empleadoId) {
        setError("Selecciona un profesional.");
        return;
      }

      // 1) Validar y preparar plantilla semanal
      const bloquesAEnviar = [];

      for (const diaInfo of DIAS_SEMANA) {
        const dia = diaInfo.value;
        const franjas = bloquesPorDia[dia] || [];

        for (const f of franjas) {
          if (!f.horaInicio || !f.horaFin) {
            setError(
              `Hay una franja incompleta el ${diaInfo.largo} (falta hora de inicio o fin).`
            );
            return;
          }
          if (f.horaInicio >= f.horaFin) {
            setError(
              `La hora de inicio debe ser anterior a la de fin el ${diaInfo.largo}.`
            );
            return;
          }

          bloquesAEnviar.push({
            diaSemana: dia,
            horaInicio: f.horaInicio,
            horaFin: f.horaFin,
          });
        }
      }

      // 2) Validar y preparar excepciones de la semana visible
      const excepcionesAEnviar = [];

      for (const fecha of fechasSemana) {
        const ex = excepcionesPorFecha[fecha];
        if (!ex) continue;

        if (ex.tipo === "cerrado") {
          excepcionesAEnviar.push({
            fecha,
            cerrado: true,
            bloques: [],
          });
        } else if (ex.tipo === "especial") {
          const bloquesValidados = [];
          for (const b of ex.bloques || []) {
            if (!b.horaInicio || !b.horaFin) {
              setError(
                `Hay una franja incompleta en la excepción del ${formatearFechaBonita(
                  fecha
                )}.`
              );
              return;
            }
            if (b.horaInicio >= b.horaFin) {
              setError(
                `La hora de inicio debe ser anterior a la de fin en la excepción del ${formatearFechaBonita(
                  fecha
                )}.`
              );
              return;
            }
            bloquesValidados.push({
              horaInicio: b.horaInicio,
              horaFin: b.horaFin,
            });
          }
          excepcionesAEnviar.push({
            fecha,
            cerrado: false,
            bloques: bloquesValidados,
          });
        }
      }

      setGuardando(true);

      // 2.1 Guardar plantilla semanal
      await saveDisponibilidadEmpleado(empleadoId, bloquesAEnviar);

      // 2.2 Guardar excepciones de la semana (si tenemos rango)
      let excepcionesGuardadas = [];
      if (semanaRango?.from && semanaRango?.to) {
        excepcionesGuardadas = await saveDisponibilidadExcepciones(empleadoId, {
          from: semanaRango.from,
          to: semanaRango.to,
          excepciones: excepcionesAEnviar,
        });
      }

      // Volvemos a cargar la disponibilidad semanal para devolverla al padre
      const dataSemana = await getDisponibilidadEmpleado(empleadoId);

      if (onSaved) {
        // De momento solo necesita la plantilla semanal;
        // las excepciones ya se aplican en backend.
        onSaved(empleadoId, dataSemana || [], excepcionesGuardadas || []);
      }
    } catch (err) {
      console.error(err);
      setError(
        err.message || "No se pudo guardar la disponibilidad y las excepciones"
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal-lg"
        onClick={(e) => e.stopPropagation()}
        aria-modal="true"
        role="dialog"
      >
        <header className="modal-header">
          <h3>Disponibilidad semanal</h3>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="modal-body">
          {semanaRango?.from && semanaRango?.to && (
            <p
              className="muted"
              style={{ marginBottom: "1rem", fontWeight: 500 }}
            >
              Semana visible:{" "}
              <strong>
                {new Date(semanaRango.from).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                })}{" "}
                –{" "}
                {new Date(semanaRango.to).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </strong>
            </p>
          )}

          <div
            className="disponibilidad-header"
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "flex-end", // ⭐ CLAVE: alinea por la base
              marginBottom: "1rem",
            }}
          >
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <label style={{ marginBottom: 4, fontWeight: 500 }}>
                Profesional
              </label>
              <select
                value={empleadoId || ""}
                onChange={(e) => setEmpleadoId(e.target.value || null)}
                style={{
                  padding: "6px 10px",
                  fontSize: "0.9rem",
                }}
              >
                {profesionales.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombres && e.apellidos
                      ? `${e.nombres} ${e.apellidos}`
                      : e.nombre || `Empleado ${e.id}`}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="btn ghost"
              style={{
                height: "38px",
                display: "flex",
                alignItems: "center",
                padding: "0 14px",
              }}
              onClick={handleVaciarSemana}
            >
              Vaciar semana
            </button>
          </div>

          {empleadoActual && (
            <p className="muted" style={{ marginBottom: 12 }}>
              Editando horario de{" "}
              <strong>
                {empleadoActual.nombres && empleadoActual.apellidos
                  ? `${empleadoActual.apellidos}, ${empleadoActual.nombres}`
                  : empleadoActual.nombre || `Empleado ${empleadoActual.id}`}
              </strong>
            </p>
          )}

          {/* PLANTILLA SEMANAL */}
          {cargando ? (
            <p className="muted">Cargando disponibilidad semanal…</p>
          ) : (
            <div className="tabla-disponibilidad">
              <h4 style={{ marginBottom: 8 }}>Plantilla semanal</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: "120px" }}>Día</th>
                    <th>Franjas horarias</th>
                  </tr>
                </thead>
                <tbody>
                  {DIAS_SEMANA.map((dia) => {
                    const franjas = bloquesPorDia[dia.value] || [];
                    return (
                      <tr key={dia.value}>
                        <td>
                          <strong>{dia.largo}</strong>
                        </td>
                        <td>
                          {franjas.length === 0 && (
                            <span className="muted">
                              No disponible ·{" "}
                              <button
                                type="button"
                                className="link-btn"
                                onClick={() => handleAddFranja(dia.value)}
                              >
                                Añadir franja
                              </button>
                            </span>
                          )}

                          {franjas.length > 0 && (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.35rem",
                              }}
                            >
                              {franjas.map((f) => (
                                <div
                                  key={f.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.35rem",
                                  }}
                                >
                                  <input
                                    type="time"
                                    value={f.horaInicio}
                                    onChange={(e) =>
                                      handleChangeFranja(
                                        dia.value,
                                        f.id,
                                        "horaInicio",
                                        e.target.value
                                      )
                                    }
                                  />
                                  <span>–</span>
                                  <input
                                    type="time"
                                    value={f.horaFin}
                                    onChange={(e) =>
                                      handleChangeFranja(
                                        dia.value,
                                        f.id,
                                        "horaFin",
                                        e.target.value
                                      )
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="icon-btn"
                                    onClick={() =>
                                      handleRemoveFranja(dia.value, f.id)
                                    }
                                    title="Eliminar franja"
                                  >
                                    🗑
                                  </button>
                                </div>
                              ))}

                              <button
                                type="button"
                                className="link-btn"
                                onClick={() => handleAddFranja(dia.value)}
                              >
                                + Añadir otra franja
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* EXCEPCIONES DE LA SEMANA */}
          <div style={{ marginTop: "1.5rem" }}>
            <h4 style={{ marginBottom: 4 }}>
              Excepciones de la semana visible
            </h4>
            <p className="muted" style={{ marginBottom: 12 }}>
              Estas excepciones sustituyen la plantilla semanal únicamente en
              los días indicados. Para el resto de días se aplica el horario de
              arriba.
            </p>

            {cargandoExcepciones ? (
              <p className="muted">Cargando excepciones…</p>
            ) : fechasSemana.length === 0 ? (
              <p className="muted">
                No hay semana seleccionada en el calendario.
              </p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: "160px" }}>Fecha</th>
                    <th style={{ width: "190px" }}>Tipo</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {fechasSemana.map((fecha) => {
                    const estado = excepcionesPorFecha[fecha];
                    const tipo = estado?.tipo || "ninguna";
                    const bloques = estado?.bloques || [];

                    return (
                      <tr key={fecha}>
                        <td>{formatearFechaBonita(fecha)}</td>
                        <td>
                          <select
                            value={tipo}
                            onChange={(e) =>
                              setTipoExcepcion(fecha, e.target.value)
                            }
                          >
                            <option value="ninguna">
                              Sin excepción (usar plantilla)
                            </option>
                            <option value="cerrado">Día no laborable</option>
                            <option value="especial">
                              Horario especial este día
                            </option>
                          </select>
                        </td>
                        <td>
                          {tipo === "ninguna" && (
                            <span className="muted">
                              Se aplicará la plantilla semanal normal.
                            </span>
                          )}

                          {tipo === "cerrado" && (
                            <span className="muted">
                              No se podrán crear citas este día.
                            </span>
                          )}

                          {tipo === "especial" && (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.35rem",
                              }}
                            >
                              {bloques.map((b) => (
                                <div
                                  key={b.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.35rem",
                                  }}
                                >
                                  <input
                                    type="time"
                                    value={b.horaInicio}
                                    onChange={(e) =>
                                      handleChangeFranjaEx(
                                        fecha,
                                        b.id,
                                        "horaInicio",
                                        e.target.value
                                      )
                                    }
                                  />
                                  <span>–</span>
                                  <input
                                    type="time"
                                    value={b.horaFin}
                                    onChange={(e) =>
                                      handleChangeFranjaEx(
                                        fecha,
                                        b.id,
                                        "horaFin",
                                        e.target.value
                                      )
                                    }
                                  />
                                  <button
                                    type="button"
                                    className="icon-btn"
                                    onClick={() =>
                                      handleRemoveFranjaEx(fecha, b.id)
                                    }
                                  >
                                    🗑
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                className="link-btn"
                                onClick={() => handleAddFranjaEx(fecha)}
                              >
                                + Añadir franja especial
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {error && (
            <p
              className="msg err"
              style={{ marginTop: "0.75rem", marginBottom: 0 }}
            >
              {error}
            </p>
          )}
        </div>

        <footer className="modal-footer">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={handleGuardar}
            disabled={guardando || cargando || cargandoExcepciones}
          >
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
        </footer>
      </div>
    </div>
  );
}
