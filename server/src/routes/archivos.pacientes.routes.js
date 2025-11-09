// server/src/routes/archivos.pacientes.routes.js
import { Router } from "express";
import multer from "multer";
import {
  listarArchivos,
  subirArchivo,
  descargarArchivo,
  renombrarArchivo,
  eliminarArchivo,
} from "../controllers/archivos.pacientes.controller.js";

const router = Router();

// Multer en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ✅ todas las rutas bien formadas:
router.get("/:id/archivos", listarArchivos);
router.post("/:id/archivos", upload.single("file"), subirArchivo);
router.get("/:id/archivos/:fileId", descargarArchivo);
router.patch("/:id/archivos/:fileId", renombrarArchivo);
router.delete("/:id/archivos/:fileId", eliminarArchivo);

export default router;
