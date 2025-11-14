// server/src/controllers/disponibilidadExcepciones.controller.js
import { query } from "../db.js";

// GET /api/empleados/:empleadoId/disponibilidad-excepciones?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function listarExcepcionesDisponibilidad(req, res, next) {
  try {
    const { empleadoId } = req.params;
    const { from, to } = req.query;

    if (!from || !to) {
      return res
        .status(400)
        .json({ error: "Parámetros 'from' y 'to' son obligatorios" });
    }

    const result = await query(
      `
      SELECT
        id,
        empleado_id AS "empleadoId",
        to_char(fecha, 'YYYY-MM-DD') AS "fecha",
        cerrado,
        to_char(hora_inicio, 'HH24:MI') AS "horaInicio",
        to_char(hora_fin,   'HH24:MI') AS "horaFin"
      FROM disponibilidades_excepciones
      WHERE empleado_id = $1
        AND fecha BETWEEN $2 AND $3
      ORDER BY fecha ASC, cerrado DESC, hora_inicio ASC
      `,
      [Number(empleadoId), from, to]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// PUT /api/empleados/:empleadoId/disponibilidad-excepciones
// body: { from, to, excepciones: [{ fecha, cerrado, bloques: [{horaInicio, horaFin}] }] }
export async function guardarExcepcionesDisponibilidad(req, res, next) {
  const client = { query };
  try {
    const { empleadoId } = req.params;
    const { from, to, excepciones = [] } = req.body || {};

    if (!from || !to) {
      return res
        .status(400)
        .json({ error: "from y to son obligatorios en el cuerpo" });
    }

    await client.query("BEGIN");

    // Eliminamos las excepciones del rango indicado para ese profesional
    await client.query(
      `
      DELETE FROM disponibilidades_excepciones
      WHERE empleado_id = $1
        AND fecha BETWEEN $2 AND $3
      `,
      [Number(empleadoId), from, to]
    );

    // Insertamos las nuevas
    for (const ex of excepciones) {
      const fecha = ex.fecha;
      const cerrado = !!ex.cerrado;

      if (!fecha) continue;

      if (cerrado) {
        // Día totalmente cerrado
        await client.query(
          `
          INSERT INTO disponibilidades_excepciones
            (empleado_id, fecha, cerrado, hora_inicio, hora_fin)
          VALUES ($1, $2, true, NULL, NULL)
          `,
          [Number(empleadoId), fecha]
        );
      } else {
        const bloques = ex.bloques || [];
        for (const b of bloques) {
          await client.query(
            `
            INSERT INTO disponibilidades_excepciones
              (empleado_id, fecha, cerrado, hora_inicio, hora_fin)
            VALUES ($1, $2, false, $3, $4)
            `,
            [Number(empleadoId), fecha, b.horaInicio, b.horaFin]
          );
        }
      }
    }

    await client.query("COMMIT");

    // Devolvemos el estado final del rango
    const result = await query(
      `
      SELECT
        id,
        empleado_id AS "empleadoId",
        to_char(fecha, 'YYYY-MM-DD') AS "fecha",
        cerrado,
        to_char(hora_inicio, 'HH24:MI') AS "horaInicio",
        to_char(hora_fin,   'HH24:MI') AS "horaFin"
      FROM disponibilidades_excepciones
      WHERE empleado_id = $1
        AND fecha BETWEEN $2 AND $3
      ORDER BY fecha ASC, cerrado DESC, hora_inicio ASC
      `,
      [Number(empleadoId), from, to]
    );

    res.json(result.rows);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    next(err);
  }
}
