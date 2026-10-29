// Ubicación: src/lib/videoUtils.ts

/**
 * Intenta extraer el ID de YouTube o detectar si es un video de Instagram.
 * Devuelve un string con el formato "YT_ID" (11 caracteres) o "IG_CODE".
 */
export function extraerYouTubeId(url: string): string | null {
  if (!url) return null;

  const trimmed = url.trim();

  // 1. Detección completa de YouTube (watch, shorts, youtu.be, embed, v)
  const ytRegex =
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i;
  const ytMatch = trimmed.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return ytMatch[1];
  }

  // 2. Detección completa de Instagram (Reels, publicaciones, IGTV, enlaces compartidos desde móvil)
  if (trimmed.includes("instagram.com")) {
    const igRegex =
      /instagram\.com\/(?:(?:share\/)?(?:reel|reels|p|tv))\/([A-Za-z0-9_-]+)/i;
    const igMatch = trimmed.match(igRegex);
    if (igMatch && igMatch[1]) {
      return `IG_${igMatch[1]}`;
    }
  }

  return null;
}

/**
 * Determina si la URL corresponde a una publicación o reel de Instagram
 */
export function esInstagram(url: string): boolean {
  if (!url) return false;
  return url.toLowerCase().includes("instagram.com");
}

/**
 * Determina si la URL corresponde a un video o Short de YouTube
 */
export function esYouTube(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes("youtube.com") || lower.includes("youtu.be");
}

/**
 * Obtiene la URL de Embed final para el iframe
 */
export function obtenerEmbedUrl(url: string): string {
  const detectado = extraerYouTubeId(url);

  // Si no se detectó un ID seguro de YouTube o Instagram, nunca inyectar la URL cruda en un iframe
  if (!detectado) return "";

  if (detectado.startsWith("IG_")) {
    const igCode = detectado.replace("IG_", "");
    // Formato embed oficial de Instagram
    return `https://www.instagram.com/reel/${igCode}/embed`;
  }

  // Formato embed oficial de YouTube (funciona idéntico para Shorts y videos normales)
  return `https://www.youtube.com/embed/${detectado}`;
}

/**
 * Obtiene la imagen de miniatura.
 * YouTube provee miniaturas públicas con el ID.
 * Instagram requiere tokens de autenticación para su CDN de imágenes,
 * por lo que se provee un fondo institucional / logo oficial.
 */
export function obtenerThumbnailUrl(url: string): string {
  const detectado = extraerYouTubeId(url);

  if (!detectado) return "";

  if (detectado.startsWith("IG_")) {
    return "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/800px-Instagram_logo_2016.svg.png";
  }

  return `https://img.youtube.com/vi/${detectado}/maxresdefault.jpg`;
}
