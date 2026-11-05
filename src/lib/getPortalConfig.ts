import prisma from "@/lib/prisma";

export async function getPortalInitialData() {
  try {
    const [
      configs,
      slides,
      programas,
      videosPrensa,
      contactosItems,
      bannerLateral,
      footerConfig,
      revistaConfig,
    ] = await Promise.all([
      prisma.configuracionPortal.findMany().catch(() => []),
      prisma.heroSlide
        .findMany({ where: { activo: true }, orderBy: { orden: "asc" } })
        .catch(() => []),
      prisma.programa
        .findMany({ where: { activo: true }, orderBy: { orden: "asc" } })
        .catch(() => []),
      prisma.prensaVideo
        .findMany({ where: { activo: true }, orderBy: { orden: "asc" } })
        .catch(() => []),
      prisma.contactoItem
        .findMany({ where: { activo: true }, orderBy: { orden: "asc" } })
        .catch(() => []),
      prisma.bannerLateralConfig
        .findUnique({ where: { id: 1 } })
        .catch(() => null),
      prisma.footerConfig.findUnique({ where: { id: 1 } }).catch(() => null),
      prisma.revistaConfig
        .findMany({
          where: { habilitado: true, archivoUrl: { not: null } },
          orderBy: [{ orden: "asc" }, { id: "desc" }],
        })
        .catch(() => []),
    ]);

    // Convertir el arreglo de ConfiguracionPortal en un objeto clave-valor para fácil acceso
    const configMap = configs.reduce((acc: Record<string, string>, curr: (typeof configs)[number]) => {
      acc[curr.clave] = curr.valor;
      return acc;
    }, {});

    // Resolver configuración de revistas con fallback resiliente
    let revistasList = revistaConfig;
    if ((!revistasList || revistasList.length === 0) && configMap["CONFIG_REVISTA"]) {
      try {
        const parsed = JSON.parse(configMap["CONFIG_REVISTA"]);
        if (Array.isArray(parsed)) {
          revistasList = parsed.filter((r) => r.habilitado && r.archivoUrl);
        } else if (parsed && parsed.habilitado && parsed.archivoUrl) {
          revistasList = [parsed];
        }
      } catch {
        // Ignorar JSON corrupto
      }
    }

    const defaultRevista = {
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

    const revistaPrincipal = revistasList && revistasList.length > 0 ? revistasList[0] : defaultRevista;

    // Sanitizar logotipo: eliminar muestras por defecto
    const rawLogoUrl = (configMap["LOGO_PORTAL_URL"] || configMap["logoUrl"] || "").trim();
    const isSampleLogo =
      !rawLogoUrl ||
      rawLogoUrl === "/logo.png" ||
      rawLogoUrl === "/images/logo-fundaproal.png" ||
      rawLogoUrl === "/fundaproal-corazon.png" ||
      rawLogoUrl === "/fundaproal.png";

    // Sanitizar banner lateral: eliminar muestra de silueta
    const rawBannerUrl = bannerLateral?.imagenUrl?.trim() || "";
    const isSampleBanner =
      !rawBannerUrl ||
      rawBannerUrl === "/images/silueta-madre.png";

    const resolvedBannerLateral =
      bannerLateral && !isSampleBanner && bannerLateral.visible !== false
        ? bannerLateral
        : {
            imagenUrl: "",
            altTexto: "Ilustración Institucional",
            visible: false,
          };

    // Sanitizar footer: eliminar muestra de cintillo
    const rawFooterUrl = footerConfig?.imagenUrl?.trim() || "";
    const isSampleFooter =
      !rawFooterUrl ||
      rawFooterUrl === "/images/cintillo-footer.png" ||
      rawFooterUrl === "/cintillo.png" ||
      rawFooterUrl === "/cintillo-fp.jpg" ||
      rawFooterUrl === "/pie-pagina.png";

    const resolvedFooter = {
      imagenUrl: isSampleFooter ? "" : rawFooterUrl,
      altTexto: footerConfig?.altTexto || "Cintillo Institucional",
      direccion:
        footerConfig?.direccion ||
        "Av. Andrés Bello, Edificio Las Fundaciones, Caracas - Venezuela",
      rif: footerConfig?.rif || "G-20002451-8",
      textoCopyright:
        footerConfig?.textoCopyright ||
        "Fundación Propatria 2000 / FUNDAPROAL. Todos los derechos reservados.",
      visible: footerConfig ? footerConfig.visible !== false : true,
    };

    return {
      logo: {
        url: isSampleLogo ? "" : rawLogoUrl,
      },
      slides: slides || [],
      programas: programas || [],
      videosPrensa: videosPrensa || [],
      contactosItems: contactosItems || [],
      bannerLateral: resolvedBannerLateral,
      footerConfig: resolvedFooter,
      revista: revistaPrincipal,
      revistas: revistasList || [],
    };
  } catch (error) {
    console.error("Error al obtener configuración inicial:", error);
    return null;
  }
}
