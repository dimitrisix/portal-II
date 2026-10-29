import React from "react";
import { ExternalLink } from "lucide-react";

/**
 * Sanitiza una URL para prevenir XSS (javascript:, vbscript:, data:)
 * y redirecciones abiertas maliciosas mediante URLs protocol-relative (//).
 */
function sanitizeHref(url: string): string | null {
  const trimmed = url.trim();

  // 1. Bloquear esquemas ejecutables o de inyección de código
  if (/^(javascript|vbscript|data|file):/i.test(trimmed)) {
    return null;
  }

  // 2. Neutralizar URLs protocol-relative (//attacker.com) forzando HTTPS
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  if (trimmed.startsWith("www.")) {
    return `https://${trimmed}`;
  }

  // 3. Permitir protocolos legítimos
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return trimmed;
  }

  // 4. Permitir rutas internas relativas (ej: /noticias, /contactos)
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  // Si no tiene esquema, asignar https://
  return `https://${trimmed}`;
}

/**
 * Parsea un texto y convierte automáticamente URLs directas
 * y enlaces en formato Markdown [texto](url) en etiquetas <a> interactivas seguras.
 */
export function renderTextWithLinks(text?: string | null): React.ReactNode {
  if (!text) return null;

  // Regex para detectar:
  // Grupo 1, 2, 3: Formato Markdown [texto](url)
  // Grupo 4: URLs directas que inicien con http://, https:// o www.
  const linkRegex =
    /(\[([^\]]+)\]\(([^\s\)]+)\))|((?:https?:\/\/|www\.)[^\s<]+)/gi;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    // Texto plano antes de la coincidencia
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Formato Markdown: [texto](url)
      const label = match[2];
      const rawHref = match[3];
      const safeHref = sanitizeHref(rawHref);

      if (safeHref) {
        elements.push(
          <a
            key={`md-${match.index}`}
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0c4078] hover:text-[#e62020] underline underline-offset-2 font-semibold transition-colors break-words inline-flex items-center gap-1 group"
          >
            <span>{label}</span>
            <ExternalLink
              size={12}
              className="inline shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
            />
          </a>,
        );
      } else {
        // Si el enlace era sospechoso (ej: javascript:), renderizar como texto inofensivo
        elements.push(label);
      }
    } else if (match[4]) {
      // URL directa: https://... o www....
      let rawUrl = match[4];
      let trailingPunctuation = "";

      // Limpiar signos de puntuación pegados al final de la URL en la redacción
      while (
        rawUrl.length > 0 &&
        [".", ",", ";", ")", "!", "?"].includes(rawUrl.slice(-1))
      ) {
        trailingPunctuation = rawUrl.slice(-1) + trailingPunctuation;
        rawUrl = rawUrl.slice(0, -1);
      }

      const safeHref = sanitizeHref(rawUrl);

      if (safeHref) {
        elements.push(
          <a
            key={`url-${match.index}`}
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0c4078] hover:text-[#e62020] underline underline-offset-2 font-semibold transition-colors break-all inline-flex items-center gap-1 group"
          >
            <span>{rawUrl}</span>
            <ExternalLink
              size={12}
              className="inline shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
            />
          </a>,
        );
      } else {
        elements.push(rawUrl);
      }

      if (trailingPunctuation) {
        elements.push(trailingPunctuation);
      }
    }

    lastIndex = linkRegex.lastIndex;
  }

  // Resto del texto posterior al último enlace
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
}

export default renderTextWithLinks;
