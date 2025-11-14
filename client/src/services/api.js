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

export async function getEmpleadoArchivos(id) {
  const r = await fetch(`${API}/api/empleados/${id}/archivos`);
  if (!r.ok) throw new Error("No se pudieron cargar los archivos");
  return r.json();
}

export async function uploadEmpleadoArchivo(id, file) {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch(`${API}/api/empleados/${id}/archivos`, {
    method: "POST",
    body: fd,
  });
  if (!r.ok) throw new Error("No se pudo subir el archivo");
  return r.json();
}

export async function deleteEmpleadoArchivo(id, fileId) {
  const r = await fetch(`${API}/api/empleados/${id}/archivos/${fileId}`, {
    method: "DELETE",
  });
  if (!r.ok) throw new Error("No se pudo eliminar el archivo");
}

export function urlVerEmpleadoArchivo(id, fileId) {
  return `${API}/api/empleados/${id}/archivos/${fileId}`;
}

export async function createPaciente(data) {
  return http("/pacientes", { method: "POST", body: JSON.stringify(data) });
}

export async function getPaciente(id) {
  const r = await fetch(`${API}/api/pacientes/${id}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
// Archivos de PACIENTES
export async function getPacienteArchivos(id) {
  const r = await fetch(`${API}/api/pacientes/${id}/archivos`);
  if (!r.ok) throw new Error("No se pudieron cargar los archivos");
  return r.json();
}
export async function uploadPacienteArchivo(id, file) {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch(`${API}/api/pacientes/${id}/archivos`, {
    method: "POST",
    body: fd,
  });
  if (!r.ok) throw new Error("No se pudo subir el archivo");
  return r.json();
}
export async function deletePacienteArchivo(id, fileId) {
  const r = await fetch(`${API}/api/pacientes/${id}/archivos/${fileId}`, {
    method: "DELETE",
  });
  if (!r.ok) throw new Error("No se pudo eliminar el archivo");
}
export function urlVerPacienteArchivo(id, fileId) {
  return `${API}/api/pacientes/${id}/archivos/${fileId}`;
}

export async function updatePaciente(id, payload) {
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const res = await fetch(`${API}/api/pacientes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Error actualizando paciente");
  }
  return res.json();
}

// ---- CITAS ----

export function getCitas(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const path = `/citas${qs ? `?${qs}` : ""}`;
  return http(path, { method: "GET" });
}

export function getCita(id) {
  return http(`/citas/${id}`, { method: "GET" });
}

export function createCita(payload) {
  return http("/citas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCita(id, payload) {
  return http(`/citas/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteCita(id) {
  return http(`/citas/${id}`, { method: "DELETE" });
}
export async function getDisponibilidadEmpleado(empleadoId) {
  return http(`/empleados/${empleadoId}/disponibilidad`, { method: "GET" });
}

export async function saveDisponibilidadEmpleado(empleadoId, bloques) {
  return http(`/empleados/${empleadoId}/disponibilidad`, {
    method: "PUT",
    body: JSON.stringify({ bloques }),
  });
}
export async function getDisponibilidadExcepciones(empleadoId, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const path = `/empleados/${empleadoId}/disponibilidad-excepciones${
    qs ? `?${qs}` : ""
  }`;
  return http(path, { method: "GET" });
}

export async function saveDisponibilidadExcepciones(empleadoId, payload) {
  return http(`/empleados/${empleadoId}/disponibilidad-excepciones`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
