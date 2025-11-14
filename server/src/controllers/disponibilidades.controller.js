import { query } from "../db.js";

export async function listarDisponibilidadEmpleado(req, res, next) {
  try {
    const { empleadoId } = req.params;
    const result = await query(
      `
      SELECT
        id,
        empleado_id  AS "empleadoId",
        dia_semana   AS "diaSemana",
        to_char(hora_inicio, 'HH24:MI') AS "horaInicio",
        to_char(hora_fin, 'HH24:MI')    AS "horaFin",
        activo
      FROM disponibilidades
      WHERE empleado_id = $1
      ORDER BY dia_semana, hora_inicio
      `,
      [Number(empleadoId)]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// versión simple: reemplaza toda la semana de un profesional
export async function guardarDisponibilidadEmpleado(req, res, next) {
  try {
    const { empleadoId } = req.params;
    const bloques = req.body.bloques || [];
    const t = await query("BEGIN");

    await query("DELETE FROM disponibilidades WHERE empleado_id = $1", [
      Number(empleadoId),
    ]);

    for (const b of bloques) {
      await query(
        `
        INSERT INTO disponibilidades
          (empleado_id, dia_semana, hora_inicio, hora_fin, activo)
        VALUES ($1, $2, $3, $4, true)
        `,
        [
          Number(empleadoId),
          Number(b.diaSemana),
          b.horaInicio,
          b.horaFin,
        ]
      );
    }

    await query("COMMIT");
    res.status(200).json({ ok: true });
  } catch (err) {
    await query("ROLLBACK").catch(() => {});
    next(err);
  }
}
