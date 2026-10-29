import { LogoAdminModal } from "@/components/admin/LogoAdminModal";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";

export default async function AdminLogoPage() {
  // ==========================================
  // BARRERA DE SEGURIDAD ESTRICTA
  // ==========================================
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) redirect("/login");

  if (!process.env.JWT_SECRET) redirect("/login");

  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(session, secretKey);
    const userRole = ((payload.roleName as string) || "EMPLEADO").toUpperCase().trim();
    const permissions = (payload.permissions as string[]) || [];

    const isAdmin = userRole === "ADMINISTRADOR" || userRole === "ADMIN";
    if (!isAdmin && !permissions.includes("logo.manage")) {
      redirect("/dashboard");
    }
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#0c4078] transition"
          >
            <ArrowLeft size={16} /> Volver a la página principal
          </Link>
          <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded">
            Panel de Administración
          </span>
        </div>

        <div className="flex justify-center">
          <LogoAdminModal />
        </div>
      </main>
    </div>
  );
}
