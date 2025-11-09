// server/src/app.js
import "dotenv/config.js";
import express from "express";
import cors from "cors";

// 🔹 Importa routers
import tareasRouter from "./routes/tareas.routes.js";
import empleadosRouter from "./routes/empleados.routes.js";
import archivosEmpleadosRoutes from "./routes/archivos.routes.js"; // Archivos de empleados
import pacientesRoutes from "./routes/pacientes.routes.js"; // CRUD de pacientes
import archivosPacientesRoutes from "./routes/archivos.pacientes.routes.js"; // Archivos de pacientes

const app = express();

// 🔹 Origen permitido (tu Vite)
const ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

// 🔹 Configuración CORS — Incluye PATCH y preflight
app.use(
  cors({
    origin: ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // ✅ Incluye PATCH
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 🔹 Parsers de JSON y formularios
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 🔹 Endpoint de salud
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ------------------------------------------------------------------
// 🧩 RUTAS PRINCIPALES
// ------------------------------------------------------------------

// 🔸 Tareas
app.use("/api/tareas", tareasRouter);

// 🔸 Empleados
app.use("/api/empleados", empleadosRouter);
app.use("/api/empleados", archivosEmpleadosRoutes); // rutas de archivos de empleados

// 🔸 Pacientes
app.use("/api/pacientes", pacientesRoutes);
app.use("/api/pacientes", archivosPacientesRoutes); // rutas de archivos de pacientes

// ------------------------------------------------------------------
// 🧱 RUTAS NO ENCONTRADAS (404)
// ------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: "Recurso no encontrado" });
});

// ------------------------------------------------------------------
// ⚠️ MANEJADOR DE ERRORES
// ------------------------------------------------------------------
app.use((err, _req, res, _next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      error: "La imagen o el cuerpo supera el límite (máx. 10 MB).",
    });
  }

  console.error("❌ Error interno:", err);
  res.status(500).json({ error: "Error interno" });
});

// ------------------------------------------------------------------
// 🚀 INICIAR SERVIDOR
// ------------------------------------------------------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ API en http://localhost:${PORT}`);
});
