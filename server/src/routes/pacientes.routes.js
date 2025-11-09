import { Router } from "express";
import {
  listarPacientes,
  obtenerPaciente,
  crearPaciente,
  actualizarPaciente,
  eliminarPaciente,
} from "../controllers/pacientes.controller.js";

const router = Router();

router.get("/", listarPacientes);
router.get("/:id", obtenerPaciente);
router.post("/", crearPaciente);
router.patch("/:id", actualizarPaciente);
router.delete("/:id", eliminarPaciente);

export default router;
