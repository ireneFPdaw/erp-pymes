import { Router } from 'express';
import multer from 'multer';
import {
  listarArchivos,
  subirArchivo,
  descargarArchivo,
  renombrarArchivo,
  eliminarArchivo,
} from '../controllers/archivos.controller.js';

const router = Router();

// Multer en memoria (más seguro para validar antes de guardar)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// GET /api/empleados/:id/archivos
router.get('/:id/archivos', listarArchivos);

// POST /api/empleados/:id/archivos  (campo form-data: file)
router.post('/:id/archivos', upload.single('file'), subirArchivo);

// GET /api/empleados/:id/archivos/:fileId  (descarga/previa)
router.get('/:id/archivos/:fileId', descargarArchivo);

// PATCH /api/empleados/:id/archivos/:fileId  (renombrar {nombre})
router.patch('/:id/archivos/:fileId', renombrarArchivo);

// DELETE /api/empleados/:id/archivos/:fileId
router.delete('/:id/archivos/:fileId', eliminarArchivo);

export default router;
