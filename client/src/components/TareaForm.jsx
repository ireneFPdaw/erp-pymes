import React, { useEffect, useState } from 'react';

const initial = { titulo: '', descripcion: '', completada: false, estado: 'por_hacer' };

export default function TareaForm({ tareaSeleccionada, onCancel, onSubmit }) {
  const [form, setForm] = useState(initial);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (tareaSeleccionada) {
      setForm({
        titulo: tareaSeleccionada.titulo || '',
        descripcion: tareaSeleccionada.descripcion || '',
        completada: Boolean(tareaSeleccionada.completada),
        estado: tareaSeleccionada.estado || 'por_hacer'
      });
    } else {
      setForm(initial);
    }
    setMensaje('');
  }, [tareaSeleccionada]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMensaje('');
    if (!form.titulo.trim()) {
      setMensaje('El título es obligatorio');
      return;
    }
    if (form.titulo.length > 120) {
      setMensaje('El título no puede superar 120 caracteres');
      return;
    }
    // coherencia: si marcan completada => estado terminadas
    const payload = { ...form };
    if (payload.completada) payload.estado = 'terminadas';
    await onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} aria-describedby="form-hint">
      <p id="form-hint" className="muted">
        Completa los campos y pulsa <strong>Crear</strong> o <strong>Guardar</strong>.
      </p>

      <label htmlFor="titulo">Título *</label>
      <input
        id="titulo"
        name="titulo"
        type="text"
        placeholder="Ej. Comprar pan"
        value={form.titulo}
        onChange={handleChange}
        required
        maxLength={120}
      />

      <label htmlFor="descripcion">Descripción</label>
      <textarea
        id="descripcion"
        name="descripcion"
        placeholder="Detalles opcionales"
        value={form.descripcion}
        onChange={handleChange}
      />

      <label htmlFor="estado">Estado</label>
      <select id="estado" name="estado" value={form.estado} onChange={handleChange}>
        <option value="por_hacer">Por hacer</option>
        <option value="en_proceso">En proceso</option>
        <option value="bloqueadas">Bloqueadas</option>
        <option value="terminadas">Terminadas</option>
      </select>

      <div className="form-inline">
        <label className="switch" title="Marca si ya está terminada">
          <input
            type="checkbox"
            name="completada"
            checked={form.completada}
            onChange={handleChange}
          />
          <span>Completada</span>
        </label>

        <div className="actions" style={{ marginLeft: 'auto' }}>
          <button className="btn primary" type="submit">
            {tareaSeleccionada ? 'Guardar cambios' : 'Crear tarea'}
          </button>
          {tareaSeleccionada && (
            <button type="button" className="btn ghost" onClick={onCancel}>Cancelar</button>
          )}
        </div>
      </div>

      {mensaje && <p className="msg err" role="alert">{mensaje}</p>}
    </form>
  );
}
