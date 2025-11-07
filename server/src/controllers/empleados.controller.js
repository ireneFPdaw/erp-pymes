import { query } from '../db.js';

export async function listarEmpleados(_req, res, next) {
  try {
    const sql = `
      SELECT id, nombres, apellidos, dni, email, telefono, rol,
             fecha_nacimiento, fecha_contratacion, salario, activo,
             creada_en, actualizada_en
      FROM empleados
      ORDER BY apellidos, nombres;
    `;
    const { rows } = await query(sql, []);
    res.json(rows);
  } catch (err) { next(err); }
}

export async function crearEmpleado(req, res, next) {
  try {
    const {
      nombres, apellidos, dni, email,
      telefono = null, direccion = null,
      rol,
      fecha_nacimiento = null,
      fecha_contratacion = null,
      salario = null,
      activo = true,
      foto_base64 = null
    } = req.body || {};

    // Validación básica
    if (!nombres?.trim() || !apellidos?.trim() || !dni?.trim() || !email?.trim() || !rol) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: nombres, apellidos, dni, email, rol.' });
    }
    const rolesPermitidos = ['gerente', 'secretario', 'fisioterapeuta'];
    if (!rolesPermitidos.includes(rol)) {
      return res.status(400).json({ error: 'Rol no válido.' });
    }

    const foto = foto_base64 ? Buffer.from(foto_base64, 'base64') : null;

    const sql = `
      INSERT INTO empleados
        (nombres, apellidos, dni, email, telefono, direccion, rol,
         fecha_nacimiento, fecha_contratacion, salario, activo, foto)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9, CURRENT_DATE),$10,$11,$12)
      RETURNING id, nombres, apellidos, dni, email, telefono, rol,
                fecha_nacimiento, fecha_contratacion, salario, activo,
                creada_en, actualizada_en
    `;
    const params = [
      nombres.trim(), apellidos.trim(), dni.trim(), email.trim(),
      telefono, direccion, rol,
      fecha_nacimiento || null,
      fecha_contratacion || null,
      salario === '' || salario === null ? null : Number(salario),
      Boolean(activo),
      foto
    ];
    const { rows } = await query(sql, params);
    return res.status(201).json(rows[0]);
  } catch (err) {
    // Duplicados (dni/email)
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'DNI o email ya existe.' });
    }
    next(err);
  }
}