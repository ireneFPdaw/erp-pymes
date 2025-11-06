import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tareasRouter from './routes/tareas.routes.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);

// Middlewares globales
app.use(express.json());

// CORS abierto en dev (o restringido por FRONTEND_ORIGIN)
const corsOptions = {
  origin: process.env.FRONTEND_ORIGIN || true,
};
app.use(cors(corsOptions));

// Ruta base de salud
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'API funcionando' });
});

// Rutas de tareas
app.use('/api/tareas', tareasRouter);

// Middleware de 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Recurso no encontrado' });
});

// Middleware centralizado de errores
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('💥 Error:', err.message);
  // Si viene de Postgres con detalle específico
  if (err.code) {
    return res.status(500).json({ error: 'Error de base de datos', detail: err.message });
  }
  res.status(500).json({ error: 'Error interno', detail: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
