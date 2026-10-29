"use client";

import React from "react";
import { usePathname } from "next/navigation";

export function SocialFloatingBar() {
  const pathname = usePathname();

  // Mostrar únicamente en el portal público (ocultar en dashboard, administración y login)
  if (
    !pathname ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login")
  ) {
    return null;
  }

  return (
    <aside
      aria-label="Redes Sociales Institucionales"
      className="fixed right-3 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col gap-2.5"
    >
      {/* Instagram */}
      <a
        href="https://www.instagram.com/fundaproal_ve"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram de FUNDAPROAL"
        className="p-2.5 bg-white/95 text-[#0c4078] hover:bg-[#e62020] hover:text-white rounded-full shadow-lg border border-slate-200/80 backdrop-blur-sm transition-all duration-300 hover:scale-110 flex items-center justify-center cursor-pointer group"
      >
        <svg
          className="w-[18px] h-[18px] fill-none stroke-current stroke-2 transition-transform group-hover:scale-105"
          viewBox="0 0 24 24"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      </a>

      {/* Facebook */}
      <a
        href="https://www.facebook.com/share/1SwDaeeMJ2/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook de FUNDAPROAL"
        className="p-2.5 bg-white/95 text-[#0c4078] hover:bg-[#1877f2] hover:text-white rounded-full shadow-lg border border-slate-200/80 backdrop-blur-sm transition-all duration-300 hover:scale-110 flex items-center justify-center cursor-pointer group"
      >
        <svg
          className="w-[18px] h-[18px] fill-current transition-transform group-hover:scale-105"
          viewBox="0 0 24 24"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </a>

      {/* Canal de WhatsApp */}
      <a
        href="https://whatsapp.com/channel/0029Vb7X6AsAO7RD73pED12W"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Canal oficial de WhatsApp de FUNDAPROAL"
        className="p-2.5 bg-white/95 text-[#0c4078] hover:bg-[#25d366] hover:text-white rounded-full shadow-lg border border-slate-200/80 backdrop-blur-sm transition-all duration-300 hover:scale-110 flex items-center justify-center cursor-pointer group"
      >
        <svg
          className="w-[18px] h-[18px] fill-current transition-transform group-hover:scale-105"
          viewBox="0 0 24 24"
        >
          <path d="M12.031 0C5.397 0 0 5.397 0 12.031c0 2.118.552 4.185 1.602 6.007L.069 24l6.13-1.609a11.968 11.968 0 0 0 5.832 1.503h.005c6.633 0 12.03-5.397 12.03-12.031 0-3.213-1.251-6.234-3.524-8.508C18.267 1.251 15.244 0 12.031 0zm0 22.029h-.004a9.98 9.98 0 0 1-5.088-1.39l-.365-.216-3.778.991 1.008-3.684-.237-.378a9.957 9.957 0 0 1-1.528-5.321c0-5.514 4.488-10.002 10.006-10.002 2.671 0 5.182 1.04 7.07 2.929a9.934 9.934 0 0 1 2.929 7.073c0 5.514-4.488 10.002-10.012 10.002zm5.485-7.514c-.301-.15-1.782-.879-2.058-.98-.276-.1-.476-.15-.677.15-.201.3-.777.98-.953 1.18-.175.201-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.501-1.786-1.677-2.087-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.201-.301.301-.501.1-.201.05-.376-.025-.527-.075-.15-.677-1.633-.928-2.236-.244-.588-.493-.508-.677-.518-.175-.009-.376-.011-.577-.011s-.527.075-.803.376c-.276.301-1.054 1.029-1.054 2.509s1.079 2.909 1.229 3.11c.15.201 2.123 3.242 5.143 4.547.719.311 1.28.497 1.718.636.722.23 1.378.198 1.898.12.579-.086 1.782-.728 2.033-1.431.251-.703.251-1.305.176-1.431-.076-.126-.276-.201-.577-.352z" />
        </svg>
      </a>

      {/* TikTok */}
      <a
        href="https://www.tiktok.com/@fundaproaloficialccs"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="TikTok de FUNDAPROAL"
        className="p-2.5 bg-white/95 text-[#0c4078] hover:bg-black hover:text-white rounded-full shadow-lg border border-slate-200/80 backdrop-blur-sm transition-all duration-300 hover:scale-110 flex items-center justify-center cursor-pointer group"
      >
        <svg
          className="w-[17px] h-[17px] fill-current transition-transform group-hover:scale-105"
          viewBox="0 0 24 24"
        >
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      </a>
    </aside>
  );
}

export default SocialFloatingBar;
