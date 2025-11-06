const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function http(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    // 204 sin contenido
    if (res.status === 204) return null;

    const data = await res.json();
    if (!res.ok) {
      const msg = data?.error || 'Error de red';
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    // Para mostrar mensajes manejables en UI
    throw new Error(err.message || 'Error desconocido');
  }
}

export function getTareas() {
  return http('/tareas', { method: 'GET' });
}

export function getTarea(id) {
  return http(`/tareas/${id}`, { method: 'GET' });
}

export function createTarea(payload) {
  return http('/tareas', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateTarea(id, payload) {
  return http(`/tareas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export function deleteTarea(id) {
  return http(`/tareas/${id}`, { method: 'DELETE' });
}
