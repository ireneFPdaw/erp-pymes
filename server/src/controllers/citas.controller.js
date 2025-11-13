// server/src/controllers/citas.controller.js
import { query } from "../db.js";
const SALAS_FISIO = ["F1", "F2", "F3"];
const SALA_DESPACHO = "DESPACHO";
// ---- LISTAR CITAS ----
export async function listarCitas(req, res, next) {
  try {
    const { from, to, empleadoId, pacienteId } = req.query;

    const desde = from || "2000-01-01";
    const hasta = to || "2100-01-01";

    let sql = `
      SELECT
        id,
        empleadoid AS "empleadoId",
        pacienteid AS "pacienteId",
        to_char(fecha, 'YYYY-MM-DD')     AS "fecha",
        to_char(horainicio, 'HH24:MI')   AS "horaInicio",
        to_char(horafin, 'HH24:MI')      AS "horaFin",
        tipo,
        estado,
        sala,
        notas
      FROM public.citas
      WHERE fecha BETWEEN $1 AND $2
    `;
    const valores = [desde, hasta];
    let idx = valores.length + 1;

    if (empleadoId) {
      sql += ` AND empleadoid = $${idx++}`;
      valores.push(Number(empleadoId));
    }

    if (pacienteId) {
      sql += ` AND pacienteid = $${idx++}`;
      valores.push(Number(pacienteId));
    }

    sql += " ORDER BY fecha ASC, horainicio ASC";

    const result = await query(sql, valores);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// ---- OBTENER UNA CITA ----
// GET /api/citas/:id
export async function obtenerCita(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      `
      SELECT
        id,
        empleadoid AS "empleadoId",
        pacienteid AS "pacienteId",
        to_char(fecha, 'YYYY-MM-DD')     AS "fecha",
        to_char(horainicio, 'HH24:MI')   AS "horaInicio",
        to_char(horafin, 'HH24:MI')      AS "horaFin",
        tipo,
        estado,
        sala,
        notas
      FROM public.citas
      WHERE id = $1
    `,
      [Number(id)]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Cita no encontrada" });

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// ---- CREAR CITA ----
// POST /api/citas
export async function crearCita(req, res, next) {
  try {
    const {
      empleadoId,
      pacienteId,
      fecha,
      horaInicio,
      horaFin,
      tipo = "sesion",
      estado = "programada",
      sala,
      notas = null,
    } = req.body;

    const salaFinal = sala || null;

    // Validar tipo/sala
    if (tipo === "sesion" && salaFinal && !SALAS_FISIO.includes(salaFinal)) {
      return res.status(400).json({
        error: "Las sesiones deben reservar una sala de fisio (F1, F2 o F3).",
      });
    }
    if (tipo !== "sesion" && salaFinal && salaFinal !== SALA_DESPACHO) {
      return res
        .status(400)
        .json({ error: "Las citas no clínicas deben usar la sala DESPACHO." });
    }

    // Comprobación de solapamiento para el mismo profesional
    const conflictoProfesional = await query(
      `
  SELECT 1
  FROM public.citas
  WHERE empleadoid = $1
    AND fecha = $2
    AND (horainicio < $4 AND horafin > $3)
`,
      [Number(empleadoId), fecha, horaInicio, horaFin]
    );

    if (conflictoProfesional.rowCount > 0) {
      return res.status(409).json({
        error: "El profesional ya tiene una cita en ese horario.",
      });
    }

    if (salaFinal) {
      const conflictoSala = await query(
        `
    SELECT 1
    FROM public.citas
    WHERE fecha = $1
      AND sala = $2
      AND (horainicio < $4 AND horafin > $3)
  `,
        [fecha, salaFinal, horaInicio, horaFin]
      );

      if (conflictoSala.rowCount > 0) {
        return res.status(409).json({
          error: "La sala seleccionada ya está ocupada en ese horario.",
        });
      }
    }

    if (pacienteId) {
      const conflictoPaciente = await query(
        `
    SELECT 1
    FROM public.citas
    WHERE pacienteid = $1
      AND fecha = $2
      AND (horainicio < $4 AND horafin > $3)
  `,
        [Number(pacienteId), fecha, horaInicio, horaFin]
      );

      if (conflictoPaciente.rowCount > 0) {
        return res.status(409).json({
          error: "El paciente ya tiene una cita en ese horario.",
        });
      }
    }
    const result = await query(
      `
      INSERT INTO public.citas
        (empleadoid, pacienteid, fecha, horainicio, horafin,
         tipo, estado, sala, notas)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id,
        empleadoid AS "empleadoId",
        pacienteid AS "pacienteId",
        to_char(fecha, 'YYYY-MM-DD')   AS "fecha",
        to_char(horainicio, 'HH24:MI') AS "horaInicio",
        to_char(horafin, 'HH24:MI')    AS "horaFin",
        tipo,
        estado,
        sala,
        notas
    `,
      [
        Number(empleadoId),
        Number(pacienteId),
        fecha,
        horaInicio,
        horaFin,
        tipo,
        estado,
        salaFinal,
        notas,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// ---- ACTUALIZAR CITA ----
// PUT /api/citas/:id
export async function actualizarCita(req, res, next) {
  try {
    const { id } = req.params;
    let {
      empleadoId,
      pacienteId,
      fecha,
      horaInicio,
      horaFin,
      tipo,
      estado,
      sala,
      notas,
    } = req.body;

    // 1) Cargar cita actual
    const actualResult = await query(
      "SELECT * FROM public.citas WHERE id = $1",
      [Number(id)]
    );
    if (actualResult.rowCount === 0) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }
    const actual = actualResult.rows[0];

    // Valores finales teniendo en cuenta lo que viene en el body
    const empleadoFinal = empleadoId ?? actual.empleadoid;
    const pacienteFinal = pacienteId ?? actual.pacienteid;
    const fechaFinal = fecha ?? actual.fecha;
    const horaInicioFinal = horaInicio ?? actual.horainicio;
    const horaFinFinal = horaFin ?? actual.horafin;
    const tipoFinal = tipo ?? actual.tipo;
    const salaFinal = sala ?? actual.sala;

    // 2) Validar coherencia tipo/sala
    if (
      tipoFinal === "sesion" &&
      salaFinal &&
      !SALAS_FISIO.includes(salaFinal)
    ) {
      return res.status(400).json({
        error: "Las sesiones deben reservar una sala de fisio (F1, F2 o F3).",
      });
    }

    if (tipoFinal !== "sesion" && salaFinal && salaFinal !== SALA_DESPACHO) {
      return res.status(400).json({
        error: "Las citas no clínicas deben usar la sala DESPACHO.",
      });
    }

    // 3) Comprobar solapamiento por PROFESIONAL
    const conflicto = await query(
      `
      SELECT 1
      FROM public.citas
      WHERE empleadoid = $1
        AND fecha = $2
        AND id <> $3
        AND (horainicio < $5 AND horafin > $4)
    `,
      [
        Number(empleadoFinal),
        fechaFinal,
        Number(id),
        horaInicioFinal,
        horaFinFinal,
      ]
    );

    if (conflicto.rowCount > 0) {
      return res.status(409).json({
        error: "El profesional ya tiene una cita en ese horario.",
      });
    }

    // 4) Comprobar solapamiento por SALA
    if (salaFinal) {
      const conflictoSala = await query(
        `
        SELECT 1
        FROM public.citas
        WHERE fecha = $1
          AND sala = $2
          AND id <> $3
          AND (horainicio < $5 AND horafin > $4)
      `,
        [fechaFinal, salaFinal, Number(id), horaInicioFinal, horaFinFinal]
      );

      if (conflictoSala.rowCount > 0) {
        return res.status(409).json({
          error: "La sala seleccionada ya está ocupada en ese horario.",
        });
      }
    }

    // 5) 💡 Comprobar solapamiento por PACIENTE
    if (pacienteFinal) {
      const conflictoPaciente = await query(
        `
        SELECT 1
        FROM public.citas
        WHERE pacienteid = $1
          AND fecha = $2
          AND id <> $3
          AND (horainicio < $5 AND horafin > $4)
      `,
        [
          Number(pacienteFinal),
          fechaFinal,
          Number(id),
          horaInicioFinal,
          horaFinFinal,
        ]
      );

      if (conflictoPaciente.rowCount > 0) {
        return res.status(409).json({
          error: "El paciente ya tiene una cita en ese horario.",
        });
      }
    }

    // 6) UPDATE dinámico solo con lo que venga en el body
    const campos = [];
    const valores = [];
    let idx = 1;

    if (empleadoId !== undefined) {
      campos.push(`empleadoid = $${idx++}`);
      valores.push(Number(empleadoId));
    }
    if (pacienteId !== undefined) {
      campos.push(`pacienteid = $${idx++}`);
      valores.push(Number(pacienteId));
    }
    if (fecha !== undefined) {
      campos.push(`fecha = $${idx++}`);
      valores.push(fecha);
    }
    if (horaInicio !== undefined) {
      campos.push(`horainicio = $${idx++}`);
      valores.push(horaInicio);
    }
    if (horaFin !== undefined) {
      campos.push(`horafin = $${idx++}`);
      valores.push(horaFin);
    }
    if (tipo !== undefined) {
      campos.push(`tipo = $${idx++}`);
      valores.push(tipo);
    }
    if (estado !== undefined) {
      campos.push(`estado = $${idx++}`);
      valores.push(estado);
    }
    if (sala !== undefined) {
      campos.push(`sala = $${idx++}`);
      valores.push(sala);
    }
    if (notas !== undefined) {
      campos.push(`notas = $${idx++}`);
      valores.push(notas);
    }

    if (campos.length === 0) {
      return res.status(400).json({ error: "No se enviaron cambios" });
    }

    valores.push(Number(id));
    const sql = `
      UPDATE public.citas
      SET ${campos.join(", ")}
      WHERE id = $${idx}
      RETURNING
        id,
        empleadoid AS "empleadoId",
        pacienteid AS "pacienteId",
        to_char(fecha, 'YYYY-MM-DD')   AS "fecha",
        to_char(horainicio, 'HH24:MI') AS "horaInicio",
        to_char(horafin, 'HH24:MI')    AS "horaFin",
        tipo,
        estado,
        sala,
        notas
    `;

    const result = await query(sql, valores);
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// ---- ELIMINAR CITA ----
// DELETE /api/citas/:id
export async function eliminarCita(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM public.citas WHERE id = $1", [
      Number(id),
    ]);
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Cita no encontrada" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
