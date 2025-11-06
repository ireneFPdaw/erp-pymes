import { query } from '../db.js';

export async function listarEmpleados(_req, res, next) {
  try {
    const sql = `
      SELECT id, nombres, apellidos, dni, email, telefono, rol,
             fecha_nacimiento, fecha_contratacion, salario, activo, creada_en, actualizada_en
      FROM empleados
      ORDER BY apellidos, nombres;
    `;
    const { rows } = await query(sql, []);
    res.json(rows);
  } catch (err) { next(err); }
}
