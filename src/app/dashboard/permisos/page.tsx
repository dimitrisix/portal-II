import prisma from "@/lib/prisma";
import CreatePermissionModal from "./CreatePermissionModal";
import DeletePermissionButton from "./DeletePermissionButton";
import Link from "next/link";
import { verifyPageAuth } from "@/lib/auth-server";

export default async function PermissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  // ==========================================
  // SEGURIDAD: Solo Administradores o personal con permisos.manage
  // ==========================================
  await verifyPageAuth("permisos.manage");

  // ==========================================
  // LÓGICA DE PAGINACIÓN
  // ==========================================
  const params = await searchParams;
  const currentPage = Number(params?.page) || 1;
  const pageSize = 5; // Cantidad de permisos por página
  const skip = (currentPage - 1) * pageSize;

  // 1. Contamos el total de permisos y calculamos las páginas
  const totalPermissions = await prisma.permission.count();
  const totalPages = Math.ceil(totalPermissions / pageSize);

  // 2. Obtenemos solo los permisos de la página actual con su respectteo conteo de roles
  const permissions = await prisma.permission.findMany({
    include: {
      _count: { select: { roles: true } },
    },
    orderBy: { name: "asc" },
    skip: skip,
    take: pageSize,
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#5d596c]">
          Gestión de Permisos
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Crea nuevos controles de acceso para asignarlos a los roles.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="text-[#5d596c] font-medium text-lg">
            Catálogo de Permisos
          </div>
          <CreatePermissionModal />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-semibold">Clave (Nombre)</th>
                <th className="px-6 py-4 font-semibold">Descripción</th>
                <th className="px-6 py-4 font-semibold text-center">
                  Usado por (Roles)
                </th>
                <th className="px-6 py-4 font-semibold text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {permissions.map((perm) => (
                <tr
                  key={perm.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-indigo-50 text-[#7367f0] text-[13px] font-mono rounded border border-indigo-100">
                      {perm.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {perm.description}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-semibold text-xs">
                      {perm._count.roles}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <DeletePermissionButton id={perm.id} name={perm.name} />
                    </div>
                  </td>
                </tr>
              ))}

              {permissions.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No hay permisos registrados todavía.
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
                href={`/dashboard/permisos?page=${currentPage - 1}`}
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
                href={`/dashboard/permisos?page=${currentPage + 1}`}
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
