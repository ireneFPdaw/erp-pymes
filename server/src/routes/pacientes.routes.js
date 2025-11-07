import { Router } from "express";
import { listarPacientes, crearPaciente } from "../controllers/pacientes.controller.js";
const router = Router();

router.get("/", listarPacientes);
router.post("/", crearPaciente);

export default router;
