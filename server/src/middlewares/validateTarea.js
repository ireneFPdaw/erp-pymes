const ESTADOS = ['por_hacer', 'en_proceso', 'bloqueadas', 'terminadas'];

export function validarIdParam(req, res, next) {
  const { id } = req.params;
  if (!/^\d+$/.test(String(id))) {
    return res.status(400).json({ error: 'El id debe ser numérico entero' });
  }
  next();
}

export function validarCrearTarea(req, res, next) {
  const { titulo, descripcion, completada, estado } = req.body;

  if (typeof titulo !== 'string' || titulo.trim().length === 0) {
    return res.status(400).json({ error: 'titulo es requerido' });
  }
  if (titulo.length > 120) {
    return res.status(400).json({ error: 'titulo no puede superar 120 caracteres' });
  }
  if (descripcion !== undefined && typeof descripcion !== 'string') {
    return res.status(400).json({ error: 'descripcion debe ser texto' });
  }
  if (completada !== undefined && typeof completada !== 'boolean') {
    return res.status(400).json({ error: 'completada debe ser boolean' });
  }
  if (estado !== undefined && !ESTADOS.includes(estado)) {
    return res.status(400).json({ error: `estado inválido. Usa: ${ESTADOS.join(', ')}` });
  }
  next();
}

export function validarActualizarTarea(req, res, next) {
  const { titulo, descripcion, completada, estado } = req.body;

  if (titulo !== undefined) {
    if (typeof titulo !== 'string' || titulo.trim().length === 0) {
      return res.status(400).json({ error: 'titulo (si se envía) debe ser texto no vacío' });
    }
    if (titulo.length > 120) {
      return res.status(400).json({ error: 'titulo no puede superar 120 caracteres' });
    }
  }
  if (descripcion !== undefined && typeof descripcion !== 'string') {
    return res.status(400).json({ error: 'descripcion (si se envía) debe ser texto' });
  }
  if (completada !== undefined && typeof completada !== 'boolean') {
    return res.status(400).json({ error: 'completada (si se envía) debe ser boolean' });
  }
  if (estado !== undefined && !['por_hacer','en_proceso','bloqueadas','terminadas'].includes(estado)) {
    return res.status(400).json({ error: 'estado inválido' });
  }
  if (titulo === undefined && descripcion === undefined && completada === undefined && estado === undefined) {
    return res.status(400).json({ error: 'Envía al menos un campo para actualizar' });
  }
  next();
}
