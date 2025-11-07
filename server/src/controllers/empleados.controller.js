// server/src/controllers/empleados.controller.js
import { query } from "../db.js";

/** Util: limpia "data:image/...;base64,xxx" → "xxx"  */
function stripDataUrlPrefix(b64) {
  if (!b64) return "";
  const i = b64.indexOf(",");
  return i !== -1 ? b64.slice(i + 1) : b64;
}

/** Util: estima bytes reales a partir de la longitud base64 */
function approxBytesFromBase64(b64) {
  // cada 4 chars base64 ≈ 3 bytes
  const len = b64.length;
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.floor((len * 3) / 4) - padding;
}

export async function listarEmpleados(_req, res, next) {
  try {
    const sql = `
      SELECT id, nombres, apellidos, dni, email, telefono, rol,
             fecha_nacimiento, fecha_contratacion, salario, activo,
             creada_en, actualizada_en, (foto IS NOT NULL) AS tiene_foto
      FROM empleados
      ORDER BY apellidos, nombres;
    `;
    const { rows } = await query(sql, []);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function crearEmpleado(req, res, next) {
  try {
    const {
      nombres,
      apellidos,
      dni,
      email,
      telefono = null,
      direccion = null,
      rol,
      fecha_nacimiento = null,
      fecha_contratacion = null,
      salario = null,
      activo = true,
      foto_base64 = null,
    } = req.body || {};

    // Validación básica
    if (
      !nombres?.trim() ||
      !apellidos?.trim() ||
      !dni?.trim() ||
      !email?.trim() ||
      !rol
    ) {
      return res.status(400).json({
        error:
          "Faltan campos obligatorios: nombres, apellidos, DNI, email y rol.",
      });
    }
    const rolesPermitidos = ["gerente", "secretario", "fisioterapeuta"];
    if (!rolesPermitidos.includes(rol)) {
      return res.status(400).json({ error: "Rol no válido." });
    }

    // --- FOTO (opcional): limpiar prefijo y limitar tamaño ---
    let foto = null;
    if (foto_base64) {
      const b64 = stripDataUrlPrefix(foto_base64);

      // Límite 2MB (ajusta si quieres)
      const bytes = approxBytesFromBase64(b64);
      const MAX = 2 * 1024 * 1024;
      if (bytes > MAX) {
        return res
          .status(413)
          .json({ error: "La imagen supera el límite permitido (2 MB)." });
      }

      try {
        foto = Buffer.from(b64, "base64");
      } catch {
        return res.status(400).json({ error: "Imagen inválida." });
      }
    }

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
      nombres.trim(),
      apellidos.trim(),
      dni.trim(),
      email.trim(),
      telefono || null,
      direccion || null,
      rol,
      fecha_nacimiento || null,
      fecha_contratacion || null,
      salario === "" || salario === null ? null : Number(salario),
      Boolean(activo),
      foto,
    ];

    const { rows } = await query(sql, params);
    return res.status(201).json(rows[0]);
  } catch (err) {
    if (err?.code === "23505") {
      // unique_violation
      return res.status(409).json({ error: "DNI o email ya existe." });
    }
    next(err);
  }
}

/** (Opcional) Servir la foto del empleado */
export async function obtenerFotoEmpleado(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await query("SELECT foto FROM empleados WHERE id = $1", [
      id,
    ]);
    if (!rows.length || !rows[0].foto) return res.status(404).send("Sin foto");
    // Podrías detectar el mime; si no, usa genérico
    res.setHeader("Content-Type", "image/jpeg");
    res.send(rows[0].foto);
  } catch (err) {
    next(err);
  }
}
