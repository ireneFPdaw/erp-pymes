// server/src/routes/disponibilidades.routes.js
import { Router } from "express";
import {
  listarDisponibilidadEmpleado,
  guardarDisponibilidadEmpleado,
} from "../controllers/disponibilidades.controller.js";

const router = Router();

router.get("/empleados/:empleadoId/disponibilidad", listarDisponibilidadEmpleado);
router.put("/empleados/:empleadoId/disponibilidad", guardarDisponibilidadEmpleado);

export default router;
