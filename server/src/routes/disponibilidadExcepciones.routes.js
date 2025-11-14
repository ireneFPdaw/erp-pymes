// server/src/routes/disponibilidadExcepciones.routes.js
import { Router } from "express";
import {
  listarExcepcionesDisponibilidad,
  guardarExcepcionesDisponibilidad,
} from "../controllers/disponibilidadExcepciones.controller.js";

const router = Router();

router.get(
  "/empleados/:empleadoId/disponibilidad-excepciones",
  listarExcepcionesDisponibilidad
);

router.put(
  "/empleados/:empleadoId/disponibilidad-excepciones",
  guardarExcepcionesDisponibilidad
);

export default router;
