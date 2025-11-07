import { Router } from 'express';
import { listarEmpleados, crearEmpleado } from '../controllers/empleados.controller.js';

const router = Router();

router.get('/', listarEmpleados);
router.post('/', crearEmpleado);

export default router;
