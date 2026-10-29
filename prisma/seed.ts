// Ubicación: prisma/seed.ts
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import * as xlsx from "xlsx";
import * as path from "path";

// 🔥 Definimos exactamente qué forma tiene una fila del Excel para complacer a TypeScript
type FilaExcel = Record<string, string | number | undefined>;

async function main() {
  console.log("🚀 Iniciando la carga de datos masiva...");

  const { default: prisma } = await import("../src/lib/prisma");

  const excelPath = path.resolve(
    process.cwd(),
    "CONSOLIDADO OCT01 - copia_2.xlsx",
  );

  try {
    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const records = xlsx.utils.sheet_to_json(sheet);
    console.log(
      `📄 Se encontraron ${records.length} registros en el Excel. Procesando...`,
    );

    let insertados = 0;
    let omitidos = 0;

    // 🔥 Usamos nuestro tipo estricto en lugar de "any"
    for (const row of records as FilaExcel[]) {
      const getVal = (key: string): string => {
        const foundKey = Object.keys(row).find(
          (k) => k.trim().toUpperCase() === key.toUpperCase(),
        );
        // Nos aseguramos de devolver siempre un texto (String) para evitar errores de tipeo
        return foundKey && row[foundKey] !== undefined
          ? String(row[foundKey])
          : "";
      };

      const nombreOriginal = getVal("NOMBRE DE LA SEDE") || "Sede FUNDAPROAL";
      const estado = getVal("ESTADO");
      const municipio = getVal("MUNICIPIO");
      const parroquia = getVal("PARROQUIA");
      const direccionBase = getVal("DIRECCION");

      const latRaw = getVal("LATITUD") || getVal("LALITUD");
      const lngRaw = getVal("LONGITUD");

      const lat = parseFloat(latRaw);
      const lng = parseFloat(lngRaw);

      if (isNaN(lat) || isNaN(lng)) {
        omitidos++;
        continue;
      }

      const direccionCompleta = `${direccionBase}, Parroquia ${parroquia}, Municipio ${municipio}, Estado ${estado}`;
      const nombreSede = `${nombreOriginal} - ${municipio} (${estado})`;

      await prisma.sedeMapa.create({
        data: {
          nombre: nombreSede,
          direccion: direccionCompleta,
          lat: lat,
          lng: lng,
          activo: true,
        },
      });

      insertados++;
    }

    console.log("\n✅ ¡CARGA MASIVA COMPLETADA CON ÉXITO!");
    console.log(`📊 Sedes guardadas en el mapa: ${insertados}`);
    if (omitidos > 0)
      console.log(`⚠️ Sedes omitidas (sin coordenadas válidas): ${omitidos}`);

    if (prisma.$disconnect) {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error("❌ Error durante la ejecución del seeder:", error);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
