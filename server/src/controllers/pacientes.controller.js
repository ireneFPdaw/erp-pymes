import { query } from "../db.js";

// GET /api/pacientes
export async function listarPacientes(_req, res, next) {
  try {
    const { rows } = await query(
      `SELECT id, nombres, apellidos, dni, email, telefono, direccion,
              sexo, patologias, fecha_nacimiento, activo,
              creada_en, actualizada_en
       FROM pacientes
       ORDER BY id ASC`
    );
    res.json(rows);
  } catch (e) { next(e); }
}

// GET /api/pacientes/:id
export async function obtenerPaciente(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT id, nombres, apellidos, dni, email, telefono, direccion,
              sexo, patologias, fecha_nacimiento, activo,
              creada_en, actualizada_en
       FROM pacientes
       WHERE id = $1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "Recurso no encontrado" });
    res.json(rows[0]);
  } catch (e) { next(e); }
}

// POST /api/pacientes
export async function crearPaciente(req, res, next) {
  try {
    const {
      nombres, apellidos, dni, email,
      telefono = null, direccion = null,
      sexo = null, patologias = null,
      fecha_nacimiento = null,
      activo = true,
    } = req.body || {};

    if (!nombres?.trim() || !apellidos?.trim() || !dni?.trim() || !email?.trim()) {
      return res.status(400).json({ error: "Faltan campos obligatorios." });
    }

    const { rows } = await query(
      `INSERT INTO pacientes
       (nombres, apellidos, dni, email, telefono, direccion, sexo, patologias, fecha_nacimiento, activo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, nombres, apellidos, dni, email, telefono, direccion,
                 sexo, patologias, fecha_nacimiento, activo, creada_en, actualizada_en`,
      [
        nombres.trim(), apellidos.trim(), dni.trim(), email.trim(),
        telefono, direccion, sexo, patologias,
        fecha_nacimiento === "" ? null : fecha_nacimiento,
        Boolean(activo),
      ]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    if (e?.code === "23505") return res.status(409).json({ error: "DNI o email ya existe." });
    next(e);
  }
}

// PATCH /api/pacientes/:id
export async function actualizarPaciente(req, res, next) {
  try {
    const { id } = req.params;
    const {
      nombres, apellidos, dni, email,
      telefono = null, direccion = null,
      sexo = null, patologias = null,
      fecha_nacimiento = null,
      activo = true,
    } = req.body || {};

    if (!nombres?.trim() || !apellidos?.trim() || !dni?.trim() || !email?.trim()) {
      return res.status(400).json({ error: "Faltan campos obligatorios." });
    }

    const params = [
      nombres.trim(), apellidos.trim(), dni.trim(), email.trim(),
      telefono, direccion, sexo, patologias,
      fecha_nacimiento === "" ? null : fecha_nacimiento,
      Boolean(activo),
      id,
    ];

    const { rows } = await query(
      `UPDATE pacientes
       SET nombres=$1, apellidos=$2, dni=$3, email=$4,
           telefono=$5, direccion=$6, sexo=$7, patologias=$8,
           fecha_nacimiento=$9, activo=$10, actualizada_en=now()
       WHERE id=$11
       RETURNING id, nombres, apellidos, dni, email, telefono, direccion,
                 sexo, patologias, fecha_nacimiento, activo, creada_en, actualizada_en`,
      params
    );

    if (!rows.length) return res.status(404).json({ error: "Recurso no encontrado" });
    res.json(rows[0]);
  } catch (e) {
    if (e?.code === "23505") return res.status(409).json({ error: "DNI o email ya existe." });
    next(e);
  }
}
export async function eliminarPaciente(req, res, next) {
  try {
    const { id } = req.params;

    // HARD DELETE (borra el registro)
    const { rowCount } = await query(
      `DELETE FROM pacientes WHERE id = $1`,
      [id]
    );

    if (!rowCount) return res.status(404).json({ error: "Recurso no encontrado" });
    return res.status(204).end(); // sin contenido
  } catch (e) {
    next(e);
  }
}