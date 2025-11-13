// server/src/controllers/citas.controller.js
import { query } from "../db.js";

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
      sala = null,
      notas = null,
    } = req.body;

    // Comprobación de solapamiento para el mismo profesional
    const conflicto = await query(
      `
      SELECT 1
      FROM public.citas
      WHERE empleadoid = $1
        AND fecha = $2
        AND (horainicio < $4 AND horafin > $3)
    `,
      [Number(empleadoId), fecha, horaInicio, horaFin]
    );

    if (conflicto.rowCount > 0) {
      return res.status(409).json({
        error: "El profesional ya tiene una cita en ese horario.",
      });
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
    to_char(fecha, 'YYYY-MM-DD')     AS "fecha",
    to_char(horainicio, 'HH24:MI')   AS "horaInicio",
    to_char(horafin, 'HH24:MI')      AS "horaFin",
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
        sala,
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
    if (actualResult.rowCount === 0)
      return res.status(404).json({ error: "Cita no encontrada" });

    const actual = actualResult.rows[0];

    const empleadoFinal = empleadoId ?? actual.empleadoid;
    const pacienteFinal = pacienteId ?? actual.pacienteid;
    const fechaFinal = fecha ?? actual.fecha;
    const horaInicioFinal = horaInicio ?? actual.horainicio;
    const horaFinFinal = horaFin ?? actual.horafin;

    // 2) Comprobar solapamiento
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

    // 3) UPDATE dinámico solo con lo que venga en el body
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
    to_char(fecha, 'YYYY-MM-DD')     AS "fecha",
    to_char(horainicio, 'HH24:MI')   AS "horaInicio",
    to_char(horafin, 'HH24:MI')      AS "horaFin",
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
