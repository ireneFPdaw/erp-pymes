import { query } from "../db.js";

export async function listarPacientes(_req, res, next) {
  try {
    const { rows } = await query(
      `SELECT id, nombres, apellidos, dni, email, telefono, sexo, patologias, activo
       FROM pacientes ORDER BY id DESC`
    );
    res.json(rows);
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
      sexo = null,
      patologias = null,
      activo = true,
    } = req.body || {};
    if (
      !nombres?.trim() ||
      !apellidos?.trim() ||
      !dni?.trim() ||
      !email?.trim()
    )
      return res.status(400).json({ error: "Faltan campos obligatorios" });

    const { rows } = await query(
      `INSERT INTO pacientes (nombres, apellidos, dni, email, telefono, sexo, patologias, activo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, nombres, apellidos, dni, email, telefono, sexo, patologias, activo`,
      [
        nombres.trim(),
        apellidos.trim(),
        dni.trim(),
        email.trim(),
        telefono,
        sexo,
        patologias,
        Boolean(activo),
      ]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e?.code === "23505")
      return res.status(409).json({ error: "DNI o email ya existe." });
    next(e);
  }
}
