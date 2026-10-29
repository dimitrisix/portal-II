import prisma from "@/lib/prisma";
import CreateRoleModal from "./CreateRoleModal";
import EditRoleModal from "./EditRoleModal";
import DeleteRoleButton from "./DeleteRoleButton";
import Link from "next/link";
import { verifyPageAuth } from "@/lib/auth-server";

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  // ==========================================
  // 1. VALIDACIÓN DE PERMISOS (BARRERA DE SEGURIDAD CRIPTOGRÁFICA)
  // ==========================================
  await verifyPageAuth("roles.manage");

  // ==========================================
  // 2. AUTO-SEEDER: Si no hay permisos, los creamos
  // ==========================================
  let allPermissions = await prisma.permission.findMany();

  if (allPermissions.length === 0) {
    await prisma.permission.createMany({
      data: [
        { name: "users.read", description: "Ver lista de usuarios" },
        { name: "users.write", description: "Crear y editar usuarios" },
        { name: "users.delete", description: "Eliminar usuarios del sistema" },
        { name: "roles.manage", description: "Crear y asignar roles" },
        { name: "dashboard.view", description: "Ver gráficas iniciales" },
      ],
    });
    allPermissions = await prisma.permission.findMany();
  }

  // ==========================================
  // 3. LÓGICA DE PAGINACIÓN
  // ==========================================
  const params = await searchParams;
  const currentPage = Number(params?.page) || 1;
  const pageSize = 5; // Cantidad de roles por página
  const skip = (currentPage - 1) * pageSize;

  const totalRoles = await prisma.role.count();
  const totalPages = Math.ceil(totalRoles / pageSize);

  // Traemos los roles correspondientes a la página actual
  const roles = await prisma.role.findMany({
    include: {
      permissions: true,
      _count: { select: { users: true } },
    },
    orderBy: { id: "asc" },
    skip: skip,
    take: pageSize,
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#5d596c]">Roles y Permisos</h2>
        <p className="text-sm text-gray-500 mt-1">
          Define qué puede hacer cada tipo de usuario en el sistema.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="text-[#5d596c] font-medium text-lg">
            Lista de Roles
          </div>

          <CreateRoleModal permissions={allPermissions} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-semibold">Rol</th>
                <th className="px-6 py-4 font-semibold">Permisos Asignados</th>
                <th className="px-6 py-4 font-semibold text-center">
                  Usuarios
                </th>
                <th className="px-6 py-4 font-semibold text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roles.map((role) => (
                <tr
                  key={role.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-[#5d596c]">
                        {role.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {role.description}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-md">
                      {role.permissions.map((perm) => (
                        <span
                          key={perm.id}
                          className="px-2 py-1 bg-indigo-50 text-[#7367f0] text-[11px] font-medium rounded border border-indigo-100"
                        >
                          {perm.name}
                        </span>
                      ))}
                      {role.permissions.length === 0 && (
                        <span className="text-xs text-gray-400 italic">
                          Sin permisos asignados
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-semibold text-xs">
                      {role._count.users}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <EditRoleModal role={role} permissions={allPermissions} />
                      <DeleteRoleButton id={role.id} name={role.name} />
                    </div>
                  </td>
                </tr>
              ))}

              {roles.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No hay roles creados. Haz clic en &quot;Nuevo Rol&quot; para empezar.
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
                href={`/dashboard/roles?page=${currentPage - 1}`}
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
                href={`/dashboard/roles?page=${currentPage + 1}`}
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
