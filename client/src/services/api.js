const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function http(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (res.status === 204) return null;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = (data && data.error) || `Error HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
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

export async function getEmpleados() {
  return http('/empleados');
}
export async function getPacientes() {
  return http('/pacientes');
}

export async function createEmpleado(data) {
  return http('/empleados', { method: 'POST', body: JSON.stringify(data) });
}
