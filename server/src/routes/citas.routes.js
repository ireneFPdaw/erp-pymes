// server/src/routes/citas.routes.js
import { Router } from "express";
import {
  listarCitas,
  obtenerCita,
  crearCita,
  actualizarCita,
  eliminarCita,
} from "../controllers/citas.controller.js";

const router = Router();

router.get("/", listarCitas);
router.get("/:id", obtenerCita);
router.post("/", crearCita);
router.put("/:id", actualizarCita);
router.delete("/:id", eliminarCita);

export default router;
