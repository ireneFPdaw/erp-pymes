const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function http(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
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
  return http("/tareas", { method: "GET" });
}

export function getTarea(id) {
  return http(`/tareas/${id}`, { method: "GET" });
}

export function createTarea(payload) {
  return http("/tareas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTarea(id, payload) {
  return http(`/tareas/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteTarea(id) {
  return http(`/tareas/${id}`, { method: "DELETE" });
}

export async function getEmpleados() {
  return http("/empleados");
}
export async function getPacientes() {
  return http("/pacientes");
}

export async function createEmpleado(data) {
  return http("/empleados", { method: "POST", body: JSON.stringify(data) });
}

export async function getEmpleado(id) {
  const res = await fetch(`${API}/api/empleados/${id}`);
  if (!res.ok) throw new Error("No se pudo obtener el empleado");
  return res.json();
}

export async function updateEmpleado(id, data) {
  const res = await fetch(`${API}/api/empleados/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error((await res.json()).error || "No se pudo actualizar");
  return res.json();
}

export async function listArchivos(empleadoId) {
  const r = await fetch(`${API}/api/empleados/${empleadoId}/archivos`);
  if (!r.ok) throw new Error('No se pudieron cargar los archivos');
  return r.json();
}

export async function uploadArchivo(empleadoId, file) {
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetch(`${API}/api/empleados/${empleadoId}/archivos`, {
    method: 'POST',
    body: fd,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export function downloadArchivoUrl(empleadoId, fileId) {
  return `${API}/api/empleados/${empleadoId}/archivos/${fileId}`;
}

export async function renameArchivo(empleadoId, fileId, nombre) {
  const r = await fetch(`${API}/api/empleados/${empleadoId}/archivos/${fileId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function deleteArchivo(empleadoId, fileId) {
  const r = await fetch(`${API}/api/empleados/${empleadoId}/archivos/${fileId}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(await r.text());
}