import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vórtex Media - Convertir y comprimir video/audio, sin límites",
  description:
    "Vórtex Media, de Vortex Company: convierte MP4 a WebM, extrae el audio a MP3 o AAC y comprime video H.264 con FFmpeg WebAssembly corriendo dentro de tu navegador. Tus archivos nunca salen de tu equipo. Gratis, sin anuncios y 100% local.",
  keywords: [
    "Vórtex Media",
    "convertir mp4 a webm",
    "extraer mp3 de video",
    "comprimir video online",
    "FFmpeg WebAssembly",
    "sin anuncios",
  ],
  authors: [{ name: "Vortex Company" }],
  icons: {
    icon:
      "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#161616"/><circle cx="24" cy="24" r="17" fill="none" stroke="#f472b6" stroke-width="3.5"/><path d="M20 17l10 7-10 7z" fill="#f9a8d4"/></svg>`
      ),
  },
  openGraph: {
    title: "Vórtex Media - Convertir y comprimir video/audio, sin límites",
    description:
      "Vórtex Media, de Vortex Company: convierte MP4 a WebM, extrae el audio a MP3 o AAC y comprime video H.264 con FFmpeg WebAssembly dentro de tu navegador. Gratis, sin anuncios y 100% local.",
    siteName: "Vórtex Media - Convertir y comprimir video/audio, sin límites",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0f10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-[#0f0f10] text-[#ececf1]">{children}</body>
    </html>
  );
}
