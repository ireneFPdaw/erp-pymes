// server/src/routes/archivos.pacientes.routes.js
import { Router } from "express";
import multer from "multer";
import {
  listarArchivos,
  subirArchivo,
  descargarArchivo,
  eliminarArchivo,
  renombrarArchivo, // opcional si usas PATCH
} from "../controllers/archivos.pacientes.controller.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

router.get("/:id/archivos", listarArchivos);
router.post("/:id/archivos", upload.single("file"), subirArchivo);
router.get("/:id/archivos/:fileId", descargarArchivo);
router.delete("/:id/archivos/:fileId", eliminarArchivo);
router.patch("/:id/archivos/:fileId", renombrarArchivo); // opcional

export default router;
