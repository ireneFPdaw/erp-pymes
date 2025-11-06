import { Router } from 'express';
import { listarEmpleados } from '../controllers/empleados.controller.js';

const router = Router();

// GET /api/empleados
router.get('/', listarEmpleados);

export default router;
