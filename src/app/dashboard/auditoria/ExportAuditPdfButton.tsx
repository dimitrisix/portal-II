// Ubicación: src/app/dashboard/auditoria/ExportAuditPdfButton.tsx
"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";

export interface AuditLogItem {
  id?: string | number;
  createdAt: string | Date;
  userName?: string | null;
  module: string;
  action: string;
  ipAddress?: string | null;
  details?: string | null;
}

export default function ExportAuditPdfButton({ logs }: { logs: AuditLogItem[] }) {
  const [isExporting, setIsExporting] = useState(false);

  const generatePDF = () => {
    if (logs.length === 0) {
      toast.error("No hay registros de auditoría para exportar.");
      return;
    }

    setIsExporting(true);

    try {
      const doc = new jsPDF();

      // 1. Encabezado del Documento
      doc.setFontSize(18);
      doc.setTextColor(93, 89, 108); // Color #5d596c
      doc.text("Reporte de Auditoría del Sistema", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generado el: ${new Date().toLocaleString("es-ES")}`, 14, 28);

      // 2. Mapeo de datos para la tabla del PDF
      const tableColumn = [
        "Fecha y Hora",
        "Usuario",
        "Módulo",
        "Acción",
        "IP",
        "Detalles",
      ];

      const tableRows = logs.map((log) => [
        new Date(log.createdAt).toLocaleString("es-ES"),
        log.userName || "Sistema",
        log.module,
        log.action,
        log.ipAddress || "N/A",
        log.details || "Sin detalles",
      ]);

      // 3. Generación de la tabla usando autoTable
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: "grid",
        headStyles: {
          fillColor: [115, 103, 240], // Color morado corporativo (#7367f0)
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [75, 70, 92],
        },
        columnStyles: {
          0: { cellWidth: 32 },
          1: { cellWidth: 25 },
          2: { cellWidth: 22 },
          3: { cellWidth: 25 },
          4: { cellWidth: 22 },
          5: { cellWidth: "auto" },
        },
      });

      // 4. Descargar el archivo PDF
      doc.save(
        `auditoria-sistema-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
      toast.success("Reporte PDF generado con éxito");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Ocurrió un error al generar el PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={isExporting}
      className="flex items-center gap-2 bg-[#7367f0] hover:bg-[#6355d8] text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm shadow-[#7367f0]/40 disabled:opacity-50"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      {isExporting ? "Generando..." : "Exportar PDF"}
    </button>
  );
}
