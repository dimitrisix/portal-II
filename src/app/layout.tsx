import { getPortalInitialData } from "@/lib/getPortalConfig";
import { ConfigProvider } from "@/context/ConfigContext";
import { SocialFloatingBar } from "@/components/SocialFloatingBar";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FUNDAPROAL - Institucional",
  description: "Garantizando la soberanía alimentaria del pueblo",
  icons: {
    icon: "/favicon.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialData = await getPortalInitialData();

  return (
    <html lang="es">
      <head>
        {/* Anti-Clickjacking / Anti-Cloning Framebuster en tiempo de ejecución */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(window.top!==window.self){window.top.location=window.self.location;}}catch(e){}`,
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-[#0c4078] selection:text-white">
        <ConfigProvider initialData={initialData}>
          {/* Botonera de redes sociales flotante en el lateral */}
          <SocialFloatingBar />

          {/* Contenido dinámico de las páginas (empuja el footer al fondo si hay poco contenido) */}
          <main className="flex-1 w-full">{children}</main>
        </ConfigProvider>
      </body>
    </html>
  );
}
