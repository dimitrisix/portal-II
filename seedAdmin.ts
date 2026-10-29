import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

// 1. Configurar Pool y Adaptador de PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("\n=======================================================");
  console.log("🚀 INICIANDO SEEDER VINCULADO AL DASHBOARD CLIENTE");
  console.log("=======================================================\n");

  console.log("1. Limpiando tablas de la base de datos...");
  // Limpieza en orden de dependencias para respetar claves foráneas
  await prisma.auditLog.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.permission.deleteMany({});

  try {
    await prisma.$executeRawUnsafe(`
      ALTER SEQUENCE IF EXISTS "User_id_seq" RESTART WITH 1;
      ALTER SEQUENCE IF EXISTS "Role_id_seq" RESTART WITH 1;
      ALTER SEQUENCE IF EXISTS "Permission_id_seq" RESTART WITH 1;
      ALTER SEQUENCE IF EXISTS "AuditLog_id_seq" RESTART WITH 1;
    `);
  } catch {
    // Si la base de datos maneja nombres de secuencias diferentes, continuar normalmente
  }

  console.log("✔ Tablas limpiadas exitosamente.\n");

  // =========================================================================
  // 2. CATÁLOGO COMPLETO DE PERMISOS (Sincronizado 1 a 1 con DashboardClient)
  // =========================================================================
  console.log("2. Creando catálogo de permisos...");

  const permissionsList = [
    // --- MÓDULOS DE ADMINISTRACIÓN Y CONTENIDO (DashboardClient) ---
    {
      name: "logo.manage",
      description: "Actualizar logo institucional del menú",
    },
    {
      name: "hero.manage",
      description: "Administrar banner principal (Hero)",
    },
    {
      name: "programas.manage",
      description: "Administrar programas institucionales",
    },
    {
      name: "prensa.manage",
      description: "Administrar noticias y videos de prensa",
    },
    {
      name: "contactos.manage",
      description: "Administrar publicaciones y contactos",
    },
    {
      name: "revista.manage",
      description: "Administrar revista digital institucional",
    },
    {
      name: "mapa.manage",
      description: "Administrar sedes y mapa institucional",
    },
    {
      name: "banner_lateral.manage",
      description: "Administrar ilustración lateral",
    },
    {
      name: "pie_pagina.manage",
      description: "Actualizar pie de página institucional",
    },
    {
      name: "cintillo.manage",
      description: "Actualizar cintillo institucional",
    },
    {
      name: "users.manage",
      description: "Gestionar usuarios y cuentas registradas",
    },
    {
      name: "roles.manage",
      description: "Gestionar roles y permisos del sistema",
    },
    {
      name: "permisos.manage",
      description: "Gestionar catálogo de controles de acceso",
    },
    {
      name: "auditoria.view",
      description: "Visualizar registros y logs de auditoría",
    },
  ];

  for (const perm of permissionsList) {
    await prisma.permission.create({
      data: perm,
    });
  }

  console.log(`✔ ${permissionsList.length} permisos inyectados en la base de datos.\n`);

  // =========================================================================
  // 3. DEFINICIÓN DE PERMISOS POR ROL
  // =========================================================================
  console.log("3. Creando roles del sistema...");

  // Supervisor: solicitudes individuales y masivas, bono y auditoría
  const permisosSupervisor = ["logo.manage", "hero.manage", "programas.manage", "prensa.manage", "contactos.manage", "mapa.manage", "banner_lateral.manage", "pie_pagina.manage", "cintillo.manage"];

  // Administrador: posee todos los permisos del catálogo
  const permisosAdmin = permissionsList.map((p) => p.name);

  const adminRole = await prisma.role.create({
    data: {
      name: "ADMINISTRADOR",
      description: "Acceso total a todos los módulos y configuraciones",
      permissions: {
        connect: permisosAdmin.map((name) => ({ name })),
      },
    },
  });

  await prisma.role.create({
    data: {
      name: "SUPERVISOR",
      description: "Gestión de solicitudes del personal y bono de alimentación",
      permissions: {
        connect: permisosSupervisor.map((name) => ({ name })),
      },
    },
  });

  console.log("✔ Roles creados (ADMINISTRADOR, SUPERVISOR, EMPLEADO).\n");

  // =========================================================================
  // 4. CREACIÓN DE USUARIOS DE PRUEBA
  // =========================================================================
  console.log("4. Creando usuarios con contraseñas encriptadas...");

  const hashAdmin = await bcrypt.hash("*Sh4ng02027*", 10);

  // 1. Administrador Maestro
  await prisma.user.create({
    data: {
      cedula: "99280322",
      name: "Administrador Maestro",
      username: "amaestro",
      email: "oticfundaproal@gmail.com",
      password: hashAdmin,
      roleId: adminRole.id,
    },
  });

  console.log("✔ Usuarios creados exitosamente.\n");

  // =========================================================================
  // 5. CONFIGURACIONES BASE PARA EVITAR ERRORES EN EL DASHBOARD
  // =========================================================================
  console.log("5. Inicializando configuraciones base del portal...");

  // Configuración de Pie de Página (Footer)
  await prisma.footerConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      imagenUrl: "/images/cintillo-footer.png",
      altTexto: "Cintillo Institucional",
      direccion:
        "Av. Andrés Bello, Edificio Las Fundaciones, Caracas - Venezuela",
      rif: "G-20002451-8",
      textoCopyright:
        "Fundación Propatria 2000 / FUNDAPROAL. Todos los derechos reservados.",
      visible: true,
    },
  });

  // Configuración de Ilustración Lateral
  await prisma.bannerLateralConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      imagenUrl: "/images/silueta-madre.png",
      altTexto: "Ilustración Institucional",
      visible: true,
    },
  });

  console.log("✔ Configuraciones base de Footer y Banner Lateral listas.\n");

  // =========================================================================
  // RESUMEN INFORMATIVO
  // =========================================================================
  console.log("=======================================================");
  console.log("🎉 SEEDER COMPLETADO CON ÉXITO");
  console.log("=======================================================");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error("❌ Error durante la ejecución del seeder:", e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
