import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import { query } from '../db.js';

const UPLOAD_ROOT = path.resolve(process.cwd(), 'server', 'uploads', 'empleados');

async function ensureDir(p) { await fsp.mkdir(p, { recursive: true }); }

// Seguridad básica
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/zip',
]);
const MAX_BYTES = 10 * 1024 * 1024;

export async function listarArchivos(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT id, nombre, filename_orig, mime, bytes, created_at, updated_at
       FROM empleado_archivos WHERE empleado_id=$1 ORDER BY created_at DESC`,
      [id]
    );
    res.json(rows);
  } catch (e) { next(e); }
}

export async function subirArchivo(req, res, next) {
  try {
    const { id } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Falta el archivo (file)' });

    if (file.size > MAX_BYTES) return res.status(413).json({ error: 'Archivo > 10 MB' });
    if (!ALLOWED_MIME.has(file.mimetype)) return res.status(415).json({ error: 'Tipo no permitido' });

    const ext = mime.extension(file.mimetype) || 'bin';
    const uid = uuidv4();
    const storageFile = `${uid}.${ext}`;

    const dir = path.join(UPLOAD_ROOT, String(id));
    await ensureDir(dir);
    const absPath = path.join(dir, storageFile);

    await fsp.writeFile(absPath, file.buffer);

    const nombreVisible = file.originalname; // por defecto
    const { rows } = await query(
      `INSERT INTO empleado_archivos
        (id, empleado_id, nombre, filename_orig, storage_key, mime, bytes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, nombre, filename_orig, mime, bytes, created_at, updated_at`,
      [uid, id, nombreVisible, file.originalname, storageFile, file.mimetype, file.size]
    );

    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
}

export async function descargarArchivo(req, res, next) {
  try {
    const { id, fileId } = req.params;
    const { rows } = await query(
      `SELECT filename_orig, storage_key, mime FROM empleado_archivos WHERE id=$1 AND empleado_id=$2`,
      [fileId, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No existe' });

    const { filename_orig, storage_key, mime: contentType } = rows[0];
    const absPath = path.join(UPLOAD_ROOT, String(id), storage_key);

    if (!fs.existsSync(absPath)) return res.status(410).json({ error: 'Archivo faltante' });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename_orig)}"`);
    fs.createReadStream(absPath).pipe(res);
  } catch (e) { next(e); }
}

export async function renombrarArchivo(req, res, next) {
  try {
    const { id, fileId } = req.params;
    const { nombre } = req.body || {};
    if (!nombre?.trim()) return res.status(400).json({ error: 'Nombre requerido' });

    const { rows } = await query(
      `UPDATE empleado_archivos
         SET nombre=$1, updated_at=now()
       WHERE id=$2 AND empleado_id=$3
       RETURNING id, nombre, filename_orig, mime, bytes, created_at, updated_at`,
      [nombre.trim(), fileId, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No existe' });
    res.json(rows[0]);
  } catch (e) { next(e); }
}

export async function eliminarArchivo(req, res, next) {
  try {
    const { id, fileId } = req.params;

    const { rows } = await query(
      `DELETE FROM empleado_archivos
         WHERE id=$1 AND empleado_id=$2
       RETURNING storage_key`,
      [fileId, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No existe' });

    const absPath = path.join(UPLOAD_ROOT, String(id), rows[0].storage_key);
    // borra en segundo plano
    fsp.unlink(absPath).catch(() => {});
    res.status(204).end();
  } catch (e) { next(e); }
}
