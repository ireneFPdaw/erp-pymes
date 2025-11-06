import { query } from '../db.js';

export async function listarPacientes(_req, res, next) {
  try {
    const sql = `
      SELECT id, nombres, apellidos, dni, email, telefono, fecha_nacimiento,
             sexo, nss, alergias, patologias, activo, creada_en, actualizada_en
      FROM pacientes
      ORDER BY apellidos, nombres;
    `;
    const { rows } = await query(sql, []);
    res.json(rows);
  } catch (err) { next(err); }
}
