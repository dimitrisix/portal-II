-- AlterTable
ALTER TABLE "public"."RevistaConfig" ADD COLUMN IF NOT EXISTS "orden" INTEGER NOT NULL DEFAULT 0;

-- CreateSequence
CREATE SEQUENCE IF NOT EXISTS "public"."RevistaConfig_id_seq";

-- AlterColumnDefault
ALTER TABLE "public"."RevistaConfig" ALTER COLUMN "id" SET DEFAULT nextval('"public"."RevistaConfig_id_seq"');
ALTER SEQUENCE "public"."RevistaConfig_id_seq" OWNED BY "public"."RevistaConfig"."id";

-- SyncSequence
SELECT setval('"public"."RevistaConfig_id_seq"', COALESCE((SELECT MAX(id) FROM "public"."RevistaConfig"), 1));

