# Vórtex Media

Vórtex Media, de Vortex Company: convierte MP4 a WebM, extrae el audio a MP3 o AAC y comprime video H.264 con CRF y resolución ajustables, usando FFmpeg WebAssembly que corre dentro de tu navegador (el motor se sirve desde la propia app). Tus archivos nunca salen de tu equipo. Gratis, sin anuncios y 100% local.

## Stack

- Next.js 16 + React 19 + Tailwind 4 + TypeScript
- FFmpeg.wasm servido desde `public/ffmpeg/` (motor local, cero CDN)
- 100% local en el navegador, sin backend y sin variables de entorno

## Desarrollo

```bash
bun install
bun run dev
```

## Producción

```bash
bun run build
```

Vórtex Media · Derechos Reservados © 2026 Vortex Company
