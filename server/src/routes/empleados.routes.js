import { Router } from 'express';
import { listarEmpleados, crearEmpleado, obtenerFotoEmpleado, actualizarEmpleado,obtenerEmpleado } from '../controllers/empleados.controller.js';

const router = Router();

router.get('/', listarEmpleados);
router.post('/', crearEmpleado);
router.get('/:id', obtenerEmpleado);
router.put('/:id', actualizarEmpleado);
router.get('/:id/foto', obtenerFotoEmpleado);
export default router;
