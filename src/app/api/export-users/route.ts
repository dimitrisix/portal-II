// Ubicación: src/app/api/export-users/route.ts
import prisma from "@/lib/prisma";
import { NextResponse, type NextRequest } from "next/server";
import { verifyApiAuth } from "@/lib/auth-server";
import { logAction } from "@/app/dashboard/auditoria/logger";

/**
 * Escapa valores para mitigar ataques de inyección de fórmulas CSV (CWE-1236).
 * Si un valor inicia con =, +, -, @, \t, o \r, se le antepone una comilla simple.
 */
function sanitizeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  let str = String(value).trim();

  // Si comienza con caracteres peligrosos que ejecutan fórmulas en hojas de cálculo
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escapar comillas dobles internas duplicándolas
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  // 1. Barrera de Seguridad Criptográfica y Roles
  const auth = await verifyApiAuth(request, { permission: "users.manage" });
  if (!auth.ok) {
    return auth.response;
  }

  try {
    // 2. Consulta de usuarios
    const users = await prisma.user.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        cedula: true,
        email: true,
        lastActive: true,
        role: { select: { name: true } },
      },
    });

    // 3. Encabezados CSV
    const headers = [
      "ID",
      "Nombre",
      "Cédula",
      "Rol",
      "Email",
      "Última Actividad",
    ];

    // 4. Mapeo seguro con sanitización anti-fórmulas
    const csvRows = [
      headers.join(","),
      ...users.map((user) => {
        const lastActive = user.lastActive
          ? new Date(user.lastActive).toLocaleString("es-ES")
          : "Nunca";

        return [
          user.id,
          sanitizeCsvCell(user.name || "Sin nombre"),
          sanitizeCsvCell(user.cedula || "N/A"),
          sanitizeCsvCell(user.role?.name || "Sin rol"),
          sanitizeCsvCell(user.email || "N/A"),
          sanitizeCsvCell(lastActive),
        ].join(",");
      }),
    ];

    const csvString = csvRows.join("\r\n");

    await logAction({
      action: "EXPORT_USERS_CSV",
      module: "Usuarios",
      details: `Exportación de ${users.length} usuarios a CSV descargada por ${auth.user.name}.`,
      userId: auth.user.id,
      userName: auth.user.name,
    });

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="Reporte_Usuarios_${new Date().toISOString().split("T")[0]}.csv"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error al exportar usuarios:", error);
    return NextResponse.json(
      { error: "Error interno al generar el reporte de usuarios" },
      { status: 500 },
    );
  }
}
