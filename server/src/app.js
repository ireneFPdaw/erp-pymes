import "dotenv/config.js";
import express from "express";
import cors from "cors";

import tareasRouter from "./routes/tareas.routes.js";
import empleadosRouter from "./routes/empleados.routes.js";
import pacientesRouter from "./routes/pacientes.routes.js";
import archivosRouter from './routes/archivos.routes.js';
const app = express();
const ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// app.options('*', cors({ origin: ORIGIN }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/tareas", tareasRouter);
app.use("/api/empleados", empleadosRouter);
app.use("/api/pacientes", pacientesRouter);

// 404
app.use((req, res) => res.status(404).json({ error: "Recurso no encontrado" }));

// Manejo de "payload demasiado grande"
app.use((err, _req, res, _next) => {
  if (err?.type === "entity.too.large") {
    return res
      .status(413)
      .json({ error: "La imagen o el cuerpo supera el límite (máx. 10 MB)." });
  }
  console.error(err);
  res.status(500).json({ error: "Error interno" });
});

app.use("api/empleados", archivosRouter);


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API en http://localhost:${PORT}`));
