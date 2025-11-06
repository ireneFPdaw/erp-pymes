import { Router } from 'express';
import { listarPacientes } from '../controllers/pacientes.controller.js';

const router = Router();

// GET /api/pacientes
router.get('/', listarPacientes);

export default router;
