import prisma from "@/lib/prisma";
import Link from "next/link";
import ExportAuditPdfButton from "./ExportAuditPdfButton";
import { verifyPageAuth } from "@/lib/auth-server";

function parseBrowser(userAgent: string | null) {
  if (!userAgent) return "Desconocido";
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg"))
    return "Google Chrome";
  if (userAgent.includes("Firefox")) return "Mozilla Firefox";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
    return "Apple Safari";
  if (userAgent.includes("Edg")) return "Microsoft Edge";
  return "Otro";
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  // ==========================================
  // SEGURIDAD: Solo Administradores o personal con auditoria.view
  // ==========================================
  await verifyPageAuth("auditoria.view");

  // ==========================================
  // LÓGICA DE PAGINACIÓN
  // ==========================================
  const params = await searchParams;
  const currentPage = Number(params?.page) || 1;
  const pageSize = 5; // Cantidad de registros por página
  const skip = (currentPage - 1) * pageSize;

  // 1. Contamos el total de registros en la BD
  const totalLogs = await prisma.auditLog.count();
  const totalPages = Math.ceil(totalLogs / pageSize);

  // 2. Obtenemos solo los registros correspondientes a la página actual
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    skip: skip,
    take: pageSize,
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#5d596c]">
          Auditoría del Sistema
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Registro detallado de actividades, IPs y navegadores utilizados en la
          plataforma.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* TOOLBAR */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
          <div className="text-[#5d596c] font-medium text-lg">
            Historial de Trazas y Conexiones
          </div>
          {/* Le pasamos todos los logs al botón de PDF si deseas que exporte todo, o puedes ajustarlo */}
          <ExportAuditPdfButton logs={logs} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-semibold">Fecha y Hora</th>
                <th className="px-6 py-4 font-semibold">Usuario</th>
                <th className="px-6 py-4 font-semibold">Módulo / Acción</th>
                <th className="px-6 py-4 font-semibold">IP & Navegador</th>
                <th className="px-6 py-4 font-semibold">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap text-xs">
                    {new Date(log.createdAt).toLocaleString("es-ES", {
                      dateStyle: "short",
                      timeStyle: "medium",
                    })}
                  </td>
                  <td className="px-6 py-4 font-medium text-[#5d596c] whitespace-nowrap">
                    {log.userName || "Sistema"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-gray-700">
                        {log.module}
                      </span>
                      <span
                        className={`w-fit px-2 py-0.5 text-[10px] font-semibold rounded ${
                          log.action.includes("DELETE")
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : log.action.includes("CREATE")
                              ? "bg-green-50 text-green-600 border border-green-100"
                              : "bg-indigo-50 text-[#7367f0] border border-indigo-100"
                        }`}
                      >
                        {log.action}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-xs">
                      <span className="font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded w-fit mb-1">
                        {log.ipAddress || "IP Oculta"}
                      </span>
                      <span
                        className="text-gray-500 truncate max-w-[200px]"
                        title={log.userAgent || ""}
                      >
                        {parseBrowser(log.userAgent)}
                      </span>
                    </div>
                  </td>
                  <td
                    className="px-6 py-4 text-gray-600 text-xs max-w-xs truncate"
                    title={log.details || ""}
                  >
                    {log.details || "Sin detalles adicionales"}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No hay registros de auditoría todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ========================================== */}
        {/* PIE DE TABLA: CONTROLES DE PAGINACIÓN      */}
        {/* ========================================== */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white text-sm text-gray-500">
          <div>
            Mostrando página{" "}
            <span className="font-semibold text-gray-700">{currentPage}</span>{" "}
            de{" "}
            <span className="font-semibold text-gray-700">
              {totalPages || 1}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón Anterior */}
            {currentPage > 1 ? (
              <Link
                href={`/dashboard/auditoria?page=${currentPage - 1}`}
                className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors"
              >
                Anterior
              </Link>
            ) : (
              <span className="px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed">
                Anterior
              </span>
            )}

            {/* Botón Siguiente */}
            {currentPage < totalPages ? (
              <Link
                href={`/dashboard/auditoria?page=${currentPage + 1}`}
                className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors"
              >
                Siguiente
              </Link>
            ) : (
              <span className="px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed">
                Siguiente
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
