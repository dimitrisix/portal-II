import prisma from "@/lib/prisma";
import SearchInput from "./SearchInput";
import CreateUserModal from "./CreateUserModal";
import EditUserModal from "./EditUserModal";
import DeleteUserButton from "./DeleteUserButton";
import ResetPasswordModal from "./ResetPasswordModal";
import Link from "next/link";
import { verifyPageAuth } from "@/lib/auth-server";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  // ==========================================
  // SEGURIDAD: Solo Administradores o personal con permiso users.manage
  // ==========================================
  await verifyPageAuth("users.manage");

  const params = await searchParams;
  const search = params?.search || "";
  const currentPage = Number(params?.page) || 1;
  const pageSize = 5; // Registros por página
  const skip = (currentPage - 1) * pageSize;

  // 1. Filtro de búsqueda reutilizable
  const whereCondition = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { cedula: { contains: search, mode: "insensitive" as const } },
          { username: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  // 2. Obtenemos roles y el total de usuarios filtrados para calcular las páginas
  const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });
  const totalUsers = await prisma.user.count({ where: whereCondition });
  const totalPages = Math.ceil(totalUsers / pageSize);

  // 3. Obtenemos los usuarios con paginación (skip y take) y sus roles
  const users = await prisma.user.findMany({
    where: whereCondition,
    include: { role: true },
    orderBy: { id: "desc" },
    skip: skip,
    take: pageSize,
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#5d596c]">Lista de Usuarios</h2>
        <p className="text-sm text-gray-500 mt-1">
          Gestión de cuentas registradas en el sistema.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
          <div className="text-[#5d596c] font-medium text-lg">
            Usuarios Registrados
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <SearchInput />

            <a
              href="/api/export-users"
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors border border-gray-200"
              title="Exportar a Excel"
            >
              <svg
                className="w-5 h-5 text-gray-500"
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
              <span className="hidden sm:inline">Exportar</span>
            </a>

            <CreateUserModal roles={roles} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Usuario</th>
                <th className="px-6 py-4 font-semibold">Rol</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold text-center">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {users.map((user) => {
                const isOnline = user.lastActive
                  ? new Date().getTime() - new Date(user.lastActive).getTime() <
                    60000
                  : false;

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-500">
                      #{user.id}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-[#7367f0] flex items-center justify-center font-bold text-sm">
                            {user.name
                              ? user.name.charAt(0).toUpperCase()
                              : "U"}
                          </div>
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-gray-400"}`}
                          ></span>
                        </div>

                        <div className="flex flex-col">
                          <span className="font-medium text-[#5d596c]">
                            {user.name || "Sin nombre"}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-gray-400">
                            {user.cedula && (
                              <span className="font-mono text-gray-500">
                                C.I. {user.cedula}
                              </span>
                            )}
                            {user.username && (
                              <span>@{user.username}</span>
                            )}
                            <span
                              className={`font-medium ${isOnline ? "text-green-500" : "text-gray-400"}`}
                            >
                              • {isOnline ? "En línea" : "Desconectado"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {user.role ? (
                        <span className="px-2 py-1 bg-indigo-50 text-[#7367f0] text-xs font-medium rounded border border-indigo-100">
                          {user.role.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          Sin rol
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.email}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <EditUserModal user={user} roles={roles} />
                        <ResetPasswordModal
                          userId={user.id}
                          userName={user.name!}
                        />
                        <DeleteUserButton
                          userId={user.id}
                          userName={user.name!}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    {search ? (
                      <div className="flex flex-col items-center gap-2">
                        <svg
                          className="w-8 h-8 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p>
                          No se encontraron usuarios que coincidan con &quot;{search}&quot;.
                        </p>
                      </div>
                    ) : (
                      "No hay usuarios registrados todavía."
                    )}
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
                href={`/dashboard/users?page=${currentPage - 1}${search ? `&search=${search}` : ""}`}
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
                href={`/dashboard/users?page=${currentPage + 1}${search ? `&search=${search}` : ""}`}
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
