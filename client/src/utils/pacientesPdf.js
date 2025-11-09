// client/src/utils/pacientesPdf.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const safe = (v) => (v == null || v === "" ? "—" : String(v));
const formatFecha = (val) => {
  if (!val) return "—";
  const [y, m, d] = String(val).split("T")[0].split("-");
  return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y.slice(-2)}`;
};
export function exportFichaPacientePDF(paciente, opts = {}) {
  const {
    titulo = "Ficha de paciente",
    autor = "Centro Fisioterapia",
    archivo = `paciente_${(paciente?.apellidos || "sin_apellidos")
      .toString()
      .toLowerCase()
      .replace(/\s+/g, "_")}.pdf`,
  } = opts;

  const doc = new jsPDF({ unit: "pt", format: "A4" });
  doc.setProperties({ title: titulo, author: autor });

  const nombreCompleto = `${safe(paciente.nombres)} ${safe(
    paciente.apellidos
  )}`;

  doc.setFontSize(16);
  doc.text(`Ficha de paciente – ${nombreCompleto}`, 40, 40);

  const info = [
    ["Nombre", `${safe(paciente.apellidos)}, ${safe(paciente.nombres)}`],
    ["DNI", safe(paciente.dni)],
    ["Email", safe(paciente.email)],
    ["Teléfono", safe(paciente.telefono)],
    ["Sexo", safe(paciente.sexo)],
    ["Dirección", safe(paciente.direccion)],
    ["Alergias", safe(paciente.alergias)],
    ["Patologías", safe(paciente.patologias)],
    ["Activo", paciente.activo ? "Sí" : "No"],
    ["Fecha nacimiento", formatFecha(paciente.fecha_nacimiento)],
  ];

  autoTable(doc, {
    head: [["Campo", "Valor"]],
    body: info,
    startY: 82,
    margin: { left: 40, right: 40 },
    styles: { fontSize: 11, cellPadding: 6, valign: "middle" },
    headStyles: { fillColor: [39, 76, 153], textColor: 255 },
    columnStyles: { 0: { cellWidth: 160 } },
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(9);
  doc.text(`Página 1`, pageW - 70, pageH - 16);

  doc.save(archivo);
}
