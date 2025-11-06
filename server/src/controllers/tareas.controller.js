import { query } from "../db.js";

function estadoDesdeCompletada(c) {
  return c ? "terminadas" : "por_hacer";
}
function completadaDesdeEstado(e) {
  return e === "terminadas";
}

export async function listarTareas(_req, res, next) {
  try {
    const result = await query(
      "SELECT id, titulo, descripcion, completada, estado, creada_en FROM public.tareas ORDER BY id ASC",
      []
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function obtenerTarea(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(
      "SELECT id, titulo, descripcion, completada, estado, creada_en FROM public.tareas WHERE id = $1",
      [Number(id)]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Tarea no encontrada" });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function crearTarea(req, res, next) {
  try {
    let { titulo, descripcion = null, completada, estado } = req.body;

    // Reglas de coherencia: estado manda; si no hay estado, derivamos por completada.
    if (estado === undefined) {
      estado =
        completada === undefined
          ? "por_hacer"
          : estadoDesdeCompletada(completada);
    }
    const completadaFinal = completadaDesdeEstado(estado);

    const result = await query(
      `INSERT INTO public.tareas (titulo, descripcion, completada, estado)
       VALUES ($1, $2, $3, $4)
       RETURNING id, titulo, descripcion, completada, estado, creada_en`,
      [titulo.trim(), descripcion, completadaFinal, estado]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function actualizarTarea(req, res, next) {
  try {
    const { id } = req.params;
    let { titulo, descripcion, completada, estado } = req.body;

    const campos = [];
    const valores = [];
    let idx = 1;

    if (titulo !== undefined) {
      campos.push(`titulo = $${idx++}`);
      valores.push(titulo.trim());
    }
    if (descripcion !== undefined) {
      campos.push(`descripcion = $${idx++}`);
      valores.push(descripcion);
    }

    // Si viene estado, sincronizamos completada con él.
    if (estado !== undefined) {
      campos.push(`estado = $${idx++}`);
      valores.push(estado);
      campos.push(`completada = $${idx++}`);
      valores.push(completadaDesdeEstado(estado));
    } else if (completada !== undefined) {
      // Si no vino estado pero sí completada, actualizamos ambos de forma coherente:
      campos.push(`completada = $${idx++}`);
      valores.push(completada);
      campos.push(`estado = $${idx++}`);
      valores.push(estadoDesdeCompletada(completada));
    }

    valores.push(Number(id));
    const sql = `UPDATE public.tareas SET ${campos.join(
      ", "
    )} WHERE id = $${idx} RETURNING id, titulo, descripcion, completada, estado, creada_en`;
    const result = await query(sql, valores);

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Tarea no encontrada" });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function eliminarTarea(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM public.tareas WHERE id = $1", [
      Number(id),
    ]);
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Tarea no encontrada" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
