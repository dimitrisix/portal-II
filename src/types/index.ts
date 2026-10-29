export interface Noticia {
  id: string | number;
  titulo: string;
  slug?: string;
  resumen: string;
  fecha: string;
  imagenUrl: string;
  categoria?: string;
}

export interface EnlaceContacto {
  id: string | number;
  tipo: "DISCURSO" | "DOCUMENTO" | "TRIPTICO" | "REVISTA";
  titulo: string;
  url: string;
}

export interface UserSession {
  id: string;
  nombre: string;
  cedula?: string;
  rol: string;
}

export interface HeroSlideData {
  id: number;
  imagenUrl: string;
  lema?: string | null;
  titulo?: string | null;
  subtitulo?: string | null;
  orden: number;
  activo: boolean;
}

export interface ProgramaData {
  id: number;
  titulo: string;
  resumen: string;
  contenido?: string | null;
  fecha: string;
  imagenUrl: string;
  enlaceUrl?: string | null;
  orden?: number;
  activo?: boolean;
}

export interface PrensaVideoData {
  id: number;
  titulo: string;
  descripcion?: string | null;
  videoUrl: string;
  fecha: string;
  activo?: boolean;
  orden?: number;
}

export interface ContactoItemData {
  id: number;
  tipo: string;
  titulo: string;
  contenido: string;
  orden?: number;
  activo?: boolean;
  creadoAt?: string | Date;
  actualizadoAt?: string | Date;
}

export interface BannerLateralData {
  imagenUrl: string;
  altTexto?: string;
  enlaceUrl?: string | null;
  visible?: boolean;
}

export interface FooterConfigData {
  imagenUrl: string;
  altTexto?: string;
  direccion?: string;
  rif?: string;
  textoCopyright?: string;
  visible?: boolean;
}

export interface RevistaConfigData {
  id?: number;
  titulo: string;
  subtitulo?: string | null;
  descripcion?: string | null;
  fecha?: string | null;
  archivoUrl?: string | null;
  nombreArchivo?: string | null;
  tamanoArchivo?: string | null;
  portadaUrl?: string | null;
  orden?: number;
  habilitado: boolean;
  actualizadoAt?: string | Date;
  creadoAt?: string | Date;
}
