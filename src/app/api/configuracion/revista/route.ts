import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyApiAuth } from "@/lib/auth-server";
import { processAndSavePdf, processAndSaveImage, safeDeleteUploadedFile } from "@/lib/safe-upload";
import { logAction } from "@/app/dashboard/auditoria/logger";
import { notifyPortalChange } from "@/lib/portal-sync";
import { RevistaConfigData } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutos para permitir carga de archivos pesados (400MB+)

const DEFAULT_REVISTA: RevistaConfigData = {
  id: 1,
  titulo: "Revista Institucional",
  subtitulo: "Edición Digital",
  descripcion: "",
  fecha: "",
  archivoUrl: "",
  nombreArchivo: "",
  tamanoArchivo: "",
  portadaUrl: "",
  orden: 0,
  habilitado: false,
};

// 1. Método GET: Listar revistas (Público o Admin con ?all=true)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const all = searchParams.get("all") === "true";
    const format = searchParams.get("format");

    let revistas: RevistaConfigData[] = [];

    try {
      if (all) {
        revistas = await prisma.revistaConfig.findMany({
          orderBy: [{ orden: "asc" }, { id: "desc" }],
        });
      } else {
        revistas = await prisma.revistaConfig.findMany({
          where: { habilitado: true, archivoUrl: { not: null } },
          orderBy: [{ orden: "asc" }, { id: "desc" }],
        });
      }
    } catch {
      // Fallback a ConfiguracionPortal si la tabla no respondiera
      try {
        const portalConfig = await prisma.configuracionPortal.findUnique({
          where: { clave: "CONFIG_REVISTA" },
        });
        if (portalConfig?.valor) {
          const parsed = JSON.parse(portalConfig.valor);
          if (Array.isArray(parsed)) {
            revistas = parsed;
          } else if (parsed && typeof parsed === "object") {
            revistas = [parsed];
          }
        }
      } catch {}
    }

    if (format === "array") {
      return NextResponse.json(revistas, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    }

    const principal = revistas.length > 0 ? revistas[0] : DEFAULT_REVISTA;

    return NextResponse.json(
      {
        ...principal,
        revistas,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error("Error al obtener revistas:", error);
    return NextResponse.json(
      { error: "Error al leer las revistas" },
      { status: 500 },
    );
  }
}

// 2. Método POST: Crear o Editar revista (Protegido)
export async function POST(request: Request) {
  const auth = await verifyApiAuth(request, {
    permission: "revista.manage",
  });
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const idRaw = formData.get("id") as string | null;
      const idNum = idRaw ? parseInt(idRaw, 10) : null;
      const isEditing = idNum !== null && !isNaN(idNum) && idNum > 0;

      const titulo = (formData.get("titulo") as string)?.trim() || "Revista Institucional";
      const subtitulo = (formData.get("subtitulo") as string)?.trim() || null;
      const descripcion = (formData.get("descripcion") as string)?.trim() || null;
      const fecha = (formData.get("fecha") as string)?.trim() || null;
      const ordenRaw = formData.get("orden") as string | null;
      const orden = ordenRaw !== null ? parseInt(ordenRaw, 10) || 0 : 0;
      const habilitado = formData.get("habilitado") === "true";
      const eliminarArchivo = formData.get("eliminarArchivo") === "true";
      const eliminarPortada = formData.get("eliminarPortada") === "true";

      let prevRevista: RevistaConfigData | null = null;
      if (isEditing) {
        prevRevista = await prisma.revistaConfig.findUnique({ where: { id: idNum } });
      }

      let archivoUrl = prevRevista?.archivoUrl ?? null;
      let nombreArchivo = prevRevista?.nombreArchivo ?? null;
      let tamanoArchivo = prevRevista?.tamanoArchivo ?? null;
      let portadaUrl = prevRevista?.portadaUrl ?? null;

      // Eliminación manual de archivos
      if (eliminarArchivo && archivoUrl) {
        await safeDeleteUploadedFile(archivoUrl, "revista");
        archivoUrl = null;
        nombreArchivo = null;
        tamanoArchivo = null;
      }

      if (eliminarPortada && portadaUrl) {
        await safeDeleteUploadedFile(portadaUrl, "revista");
        portadaUrl = null;
      }

      // Procesar nuevo archivo PDF si se envió
      const pdfFile = formData.get("file") as File | null;
      if (pdfFile && pdfFile.size > 0) {
        const pdfResult = await processAndSavePdf(pdfFile, "revista");
        if (!pdfResult.success || !pdfResult.publicUrl) {
          return NextResponse.json(
            { error: pdfResult.error || "Error al procesar el archivo PDF" },
            { status: 400 },
          );
        }

        if (archivoUrl && archivoUrl !== pdfResult.publicUrl) {
          await safeDeleteUploadedFile(archivoUrl, "revista");
        }

        archivoUrl = pdfResult.publicUrl;
        nombreArchivo = pdfResult.originalName || pdfFile.name;
        tamanoArchivo = pdfResult.fileSizeFormatted || "";
      }

      // Procesar nueva portada si se envió
      const portadaFile = formData.get("portada") as File | null;
      if (portadaFile && portadaFile.size > 0) {
        const portadaResult = await processAndSaveImage(portadaFile, "revista");
        if (!portadaResult.success || !portadaResult.publicUrl) {
          return NextResponse.json(
            { error: portadaResult.error || "Error al procesar la imagen de portada" },
            { status: 400 },
          );
        }

        if (portadaUrl && portadaUrl !== portadaResult.publicUrl) {
          await safeDeleteUploadedFile(portadaUrl, "revista");
        }

        portadaUrl = portadaResult.publicUrl;
      }

      let revistaGuardada;

      if (isEditing) {
        try {
          revistaGuardada = await prisma.revistaConfig.update({
            where: { id: idNum },
            data: {
              titulo,
              subtitulo,
              descripcion,
              fecha,
              archivoUrl,
              nombreArchivo,
              tamanoArchivo,
              portadaUrl,
              orden,
              habilitado,
            },
          });
        } catch {
          revistaGuardada = await prisma.revistaConfig.update({
            where: { id: idNum },
            data: {
              titulo,
              subtitulo,
              descripcion,
              fecha,
              archivoUrl,
              nombreArchivo,
              tamanoArchivo,
              portadaUrl,
              habilitado,
            },
          });
          try {
            await prisma.$executeRawUnsafe(
              'UPDATE "public"."RevistaConfig" SET "orden" = $1 WHERE "id" = $2',
              orden,
              idNum,
            );
          } catch {}
        }

        await logAction({
          action: "UPDATE_REVISTA",
          module: "Revista Digital",
          details: `Edición "${titulo}" (ID: ${idNum}) actualizada por ${auth.user.name}. Estado: ${habilitado ? "HABILITADA" : "INHABILITADA"}.`,
          userId: auth.user.id,
          userName: auth.user.name,
        });
      } else {
        // Obtener siguiente ID único de la secuencia para evitar colisión con id: 1
        let nextId: number | undefined = undefined;
        try {
          const seqResult = await prisma.$queryRawUnsafe<{ next_id: number }[]>(
            'SELECT nextval(\'"public"."RevistaConfig_id_seq"\')::int AS next_id',
          );
          if (seqResult && seqResult[0]?.next_id) {
            nextId = Number(seqResult[0].next_id);
          }
        } catch {
          try {
            const maxRes = await prisma.$queryRawUnsafe<{ max_id: number }[]>(
              'SELECT COALESCE(MAX(id), 0) + 1 AS max_id FROM "public"."RevistaConfig"',
            );
            if (maxRes && maxRes[0]?.max_id) {
              nextId = Number(maxRes[0].max_id);
            }
          } catch {}
        }

        try {
          revistaGuardada = await prisma.revistaConfig.create({
            data: {
              ...(nextId ? { id: nextId } : {}),
              titulo,
              subtitulo,
              descripcion,
              fecha,
              archivoUrl,
              nombreArchivo,
              tamanoArchivo,
              portadaUrl,
              orden,
              habilitado,
            },
          });
        } catch {
          revistaGuardada = await prisma.revistaConfig.create({
            data: {
              ...(nextId ? { id: nextId } : {}),
              titulo,
              subtitulo,
              descripcion,
              fecha,
              archivoUrl,
              nombreArchivo,
              tamanoArchivo,
              portadaUrl,
              habilitado,
            },
          });
          try {
            await prisma.$executeRawUnsafe(
              'UPDATE "public"."RevistaConfig" SET "orden" = $1 WHERE "id" = $2',
              orden,
              revistaGuardada.id,
            );
          } catch {}
        }

        await logAction({
          action: "CREATE_REVISTA",
          module: "Revista Digital",
          details: `Nueva edición de revista "${titulo}" (ID: ${revistaGuardada.id}) creada por ${auth.user.name}.`,
          userId: auth.user.id,
          userName: auth.user.name,
        });
      }

      // Actualizar respaldo en ConfiguracionPortal
      try {
        const todas = await prisma.revistaConfig.findMany({
          orderBy: [{ orden: "asc" }, { id: "desc" }],
        });
        await prisma.configuracionPortal.upsert({
          where: { clave: "CONFIG_REVISTA" },
          update: { valor: JSON.stringify(todas) },
          create: { clave: "CONFIG_REVISTA", valor: JSON.stringify(todas) },
        });
      } catch {}

      revalidatePath("/");
      notifyPortalChange("revista");

      return NextResponse.json({
        success: true,
        revista: revistaGuardada,
      });
    } else {
      // Manejo rápido vía JSON (ej: toggle de habilitado o cambio de orden o reordenamiento múltiple)
      const body = await request.json();

      // Acción de reordenamiento masivo de posiciones (1ª, 2ª, 3ª...)
      if (body.action === "reorder" && Array.isArray(body.items)) {
        for (const item of body.items) {
          if (item.id && typeof item.orden === "number") {
            try {
              await prisma.revistaConfig.update({
                where: { id: item.id },
                data: { orden: item.orden },
              });
            } catch {
              try {
                await prisma.$executeRawUnsafe(
                  'UPDATE "public"."RevistaConfig" SET "orden" = $1 WHERE "id" = $2',
                  item.orden,
                  item.id,
                );
              } catch {}
            }
          }
        }

        const todas = await prisma.revistaConfig.findMany({
          orderBy: [{ orden: "asc" }, { id: "desc" }],
        });

        try {
          await prisma.configuracionPortal.upsert({
            where: { clave: "CONFIG_REVISTA" },
            update: { valor: JSON.stringify(todas) },
            create: { clave: "CONFIG_REVISTA", valor: JSON.stringify(todas) },
          });
        } catch {}

        await logAction({
          action: "UPDATE_REVISTA",
          module: "Revista Digital",
          details: `Orden de publicaciones actualizado por ${auth.user.name}.`,
          userId: auth.user.id,
          userName: auth.user.name,
        });

        revalidatePath("/");
        notifyPortalChange("revista");

        return NextResponse.json({
          success: true,
          revistas: todas,
        });
      }

      const id = body.id ? parseInt(body.id, 10) : null;

      if (!id) {
        return NextResponse.json({ error: "ID de revista requerido" }, { status: 400 });
      }

      const updateData: Partial<RevistaConfigData> = {};
      if (body.habilitado !== undefined) updateData.habilitado = Boolean(body.habilitado);
      if (body.orden !== undefined) updateData.orden = parseInt(body.orden, 10) || 0;
      if (body.titulo !== undefined) updateData.titulo = body.titulo.trim();
      if (body.subtitulo !== undefined) updateData.subtitulo = body.subtitulo?.trim() || null;
      if (body.descripcion !== undefined) updateData.descripcion = body.descripcion?.trim() || null;
      if (body.fecha !== undefined) updateData.fecha = body.fecha?.trim() || null;

      let revistaGuardada;
      try {
        revistaGuardada = await prisma.revistaConfig.update({
          where: { id },
          data: updateData,
        });
      } catch {
        const { orden: _ord, ...restData } = updateData;
        revistaGuardada = await prisma.revistaConfig.update({
          where: { id },
          data: restData,
        });
        if (_ord !== undefined) {
          try {
            await prisma.$executeRawUnsafe(
              'UPDATE "public"."RevistaConfig" SET "orden" = $1 WHERE "id" = $2',
              _ord,
              id,
            );
          } catch {}
        }
      }

      await logAction({
        action: "UPDATE_REVISTA",
        module: "Revista Digital",
        details: `Edición ID ${id} modificada por ${auth.user.name}.`,
        userId: auth.user.id,
        userName: auth.user.name,
      });

      revalidatePath("/");
      notifyPortalChange("revista");

      return NextResponse.json({
        success: true,
        revista: revistaGuardada,
      });
    }
  } catch (error) {
    console.error("Error al guardar revista:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno al guardar la revista" },
      { status: 500 },
    );
  }
}

// 3. Método DELETE: Eliminar una edición de revista (Protegido)
export async function DELETE(request: Request) {
  const auth = await verifyApiAuth(request, {
    permission: "revista.manage",
  });
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");
    const id = idParam ? parseInt(idParam, 10) : null;

    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "ID inválido para eliminar" }, { status: 400 });
    }

    const revista = await prisma.revistaConfig.findUnique({ where: { id } });
    if (!revista) {
      return NextResponse.json({ error: "La edición de revista no existe" }, { status: 404 });
    }

    // Limpieza de archivos físicos asociados
    if (revista.archivoUrl) {
      await safeDeleteUploadedFile(revista.archivoUrl, "revista");
    }
    if (revista.portadaUrl) {
      await safeDeleteUploadedFile(revista.portadaUrl, "revista");
    }

    await prisma.revistaConfig.delete({ where: { id } });

    await logAction({
      action: "DELETE_REVISTA",
      module: "Revista Digital",
      details: `Edición de revista "${revista.titulo}" (ID: ${id}) eliminada por ${auth.user.name}.`,
      userId: auth.user.id,
      userName: auth.user.name,
    });

    // Actualizar respaldo en ConfiguracionPortal
    try {
      const restantes = await prisma.revistaConfig.findMany({
        orderBy: [{ orden: "asc" }, { id: "desc" }],
      });
      await prisma.configuracionPortal.upsert({
        where: { clave: "CONFIG_REVISTA" },
        update: { valor: JSON.stringify(restantes) },
        create: { clave: "CONFIG_REVISTA", valor: JSON.stringify(restantes) },
      });
    } catch {}

    revalidatePath("/");
    notifyPortalChange("revista");

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    console.error("Error al eliminar revista:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al eliminar la revista" },
      { status: 500 },
    );
  }
}
