import { query } from "../db.js";

// GET /api/pacientes
export async function listarPacientes(_req, res, next) {
  try {
    const { rows } = await query(
      `SELECT id, nombres, apellidos, dni, email, telefono, direccion,
              sexo, patologias, fecha_nacimiento, activo,alergias,
              creada_en, actualizada_en
       FROM pacientes
       ORDER BY id ASC`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

// GET /api/pacientes/:id
export async function obtenerPaciente(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT id, nombres, apellidos, dni, email, telefono, direccion,
          sexo, patologias, historia_clinica, fecha_nacimiento,alergias,
          activo, creada_en, actualizada_en
     FROM pacientes
    WHERE id = $1`,
      [id]
    );
    if (!rows.length)
      return res.status(404).json({ error: "Recurso no encontrado" });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
}

export async function crearPaciente(req, res, next) {
  try {
    const {
      nombres,
      apellidos,
      dni,
      email,
      telefono = null,
      direccion = null,
      sexo = null,
      patologias = null,
      alergias = null,             // ← NUEVO
      historia_clinica = null,
      fecha_nacimiento = null,
      activo = true,
    } = req.body || {};

    if (
      !nombres?.trim() ||
      !apellidos?.trim() ||
      !dni?.trim() ||
      !email?.trim()
    ) {
      return res.status(400).json({ error: "Faltan campos obligatorios." });
    }

    const { rows } = await query(
      `INSERT INTO pacientes
         (nombres, apellidos, dni, email, telefono, direccion, sexo,
          patologias, alergias, historia_clinica, fecha_nacimiento, activo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id, nombres, apellidos, dni, email, telefono, direccion,
                 sexo, patologias, alergias, historia_clinica,
                 fecha_nacimiento, activo, creada_en, actualizada_en`,
      [
        nombres.trim(),                                      // $1
        apellidos.trim(),                                    // $2
        dni.trim(),                                           // $3
        email.trim(),                                         // $4
        telefono,                                             // $5
        direccion,                                            // $6
        sexo,                                                 // $7
        patologias,                                           // $8
        alergias,                                             // $9 ← NUEVO
        historia_clinica,                                     // $10
        fecha_nacimiento === "" ? null : fecha_nacimiento,    // $11
        Boolean(activo),                                      // $12
      ]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    if (e?.code === "23505")
      return res.status(409).json({ error: "DNI o email ya existe." });
    next(e);
  }
}


// PATCH /api/pacientes/:id
export async function actualizarPaciente(req, res, next) {
  try {
    const { id } = req.params;
    const {
      nombres,
      apellidos,
      dni,
      email,
      telefono = null,
      direccion = null,
      sexo = null,
      patologias = null,
      alergias = null, // ← NUEVO
      historia_clinica = null,
      fecha_nacimiento = null,
      activo = true,
    } = req.body || {};

    if (
      !nombres?.trim() ||
      !apellidos?.trim() ||
      !dni?.trim() ||
      !email?.trim()
    ) {
      return res.status(400).json({ error: "Faltan campos obligatorios." });
    }

    const params = [
      nombres.trim(), // $1
      apellidos.trim(), // $2
      dni.trim(), // $3
      email.trim(), // $4
      telefono, // $5
      direccion, // $6
      sexo, // $7
      patologias, // $8
      alergias, // $9 ← NUEVO
      historia_clinica, // $10
      fecha_nacimiento === "" ? null : fecha_nacimiento, // $11
      Boolean(activo), // $12
      id, // $13
    ];

    const { rows } = await query(
      `UPDATE pacientes
         SET nombres=$1, apellidos=$2, dni=$3, email=$4,
             telefono=$5, direccion=$6, sexo=$7, patologias=$8,
             alergias=$9,
             historia_clinica=$10,
             fecha_nacimiento=$11, activo=$12, actualizada_en=now()
       WHERE id=$13
       RETURNING id, nombres, apellidos, dni, email, telefono, direccion,
                 sexo, patologias, alergias, historia_clinica,
                 fecha_nacimiento, activo, creada_en, actualizada_en`,
      params
    );

    if (!rows.length)
      return res.status(404).json({ error: "Recurso no encontrado" });

    res.json(rows[0]);
  } catch (e) {
    if (e?.code === "23505")
      return res.status(409).json({ error: "DNI o email ya existe." });
    next(e);
  }
}

export async function eliminarPaciente(req, res, next) {
  try {
    const { id } = req.params;

    // HARD DELETE (borra el registro)
    const { rowCount } = await query(`DELETE FROM pacientes WHERE id = $1`, [
      id,
    ]);

    if (!rowCount)
      return res.status(404).json({ error: "Recurso no encontrado" });
    return res.status(204).end(); // sin contenido
  } catch (e) {
    next(e);
  }
}
