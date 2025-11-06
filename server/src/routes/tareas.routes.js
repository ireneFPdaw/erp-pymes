import { Router } from 'express';
import {
  listarTareas,
  obtenerTarea,
  crearTarea,
  actualizarTarea,
  eliminarTarea
} from '../controllers/tareas.controller.js';
import {
  validarIdParam,
  validarCrearTarea,
  validarActualizarTarea
} from '../middlewares/validateTarea.js';

const router = Router();

router.get('/', listarTareas);
router.get('/:id', validarIdParam, obtenerTarea);
router.post('/', validarCrearTarea, crearTarea);
router.put('/:id', validarIdParam, validarActualizarTarea, actualizarTarea);
router.delete('/:id', validarIdParam, eliminarTarea);

export default router;
