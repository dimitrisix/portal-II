-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."RevistaConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "titulo" TEXT NOT NULL DEFAULT 'Revista Institucional',
    "subtitulo" TEXT DEFAULT 'Edición Digital',
    "descripcion" TEXT,
    "fecha" TEXT,
    "archivoUrl" TEXT,
    "nombreArchivo" TEXT,
    "tamanoArchivo" TEXT,
    "portadaUrl" TEXT,
    "habilitado" BOOLEAN NOT NULL DEFAULT false,
    "actualizadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevistaConfig_pkey" PRIMARY KEY ("id")
);

