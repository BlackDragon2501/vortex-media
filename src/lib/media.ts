// Vortex Media - Convertir MP4 a WebM, extraer MP3 y comprimir video
// con FFmpeg.wasm corriendo 100% dentro de tu navegador (motor en public/ffmpeg).

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export type OpId = 'webm' | 'mp3' | 'm4a' | 'compress'

export interface OpMeta {
  id: OpId
  label: string
  desc: string
  ext: string
  mime: string
}

export const OPS: OpMeta[] = [
  { id: 'webm', label: 'MP4 → WebM', desc: 'Reencodifica a WebM (VP8 + Vorbis), ideal para webs ligeras.', ext: 'webm', mime: 'video/webm' },
  { id: 'mp3', label: 'Extraer MP3', desc: 'Saca la pista de audio a MP3 con calidad ajustable.', ext: 'mp3', mime: 'audio/mpeg' },
  { id: 'm4a', label: 'Extraer AAC/M4A', desc: 'Copia el audio original sin recodificar (rápido).', ext: 'm4a', mime: 'audio/mp4' },
  { id: 'compress', label: 'Comprimir MP4', desc: 'Reencodifica a H.264 con CRF y resolución a tu gusto.', ext: 'mp4', mime: 'video/mp4' },
]

/** nombre de salida conservando la base original */
export function outName(original: string, op: OpId): string {
  const base = original.replace(/\.[^.]+$/, '') || 'media'
  const ext = OPS.find((o) => o.id === op)?.ext ?? 'bin'
  return `${base}-vortex.${ext}`
}

/** arma los argumentos de FFmpeg para la operación elegida */
export function buildArgs(
  input: string,
  output: string,
  op: OpId,
  opts: { crf: number; scale: 0 | 480 | 720 | 1080; audioQ: number; webmBitrate: number }
): string[] {
  switch (op) {
    case 'webm':
      return [
        '-i', input,
        '-c:v', 'libvpx', '-crf', String(opts.webmBitrate.q), '-b:v', `${opts.webmBitrate.kbps}k`,
        '-deadline', 'realtime', '-cpu-used', '5',
        '-c:a', 'libvorbis', '-q:a', String(opts.audioQ),
        output,
      ]
    case 'mp3':
      return ['-i', input, '-vn', '-c:a', 'libmp3lame', '-q:a', String(opts.audioQ), output]
    case 'm4a':
      return ['-i', input, '-vn', '-c:a', 'aac', '-b:a', '192k', output]
    case 'compress': {
      const vf = opts.scale > 0 ? ['-vf', `scale=-2:${opts.scale}`] : []
      return ['-i', input, '-c:v', 'libx264', '-preset', 'fast', '-crf', String(opts.crf), ...vf, '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', output]
    }
  }
}

// ---------- FFmpeg (UMD en public/ffmpeg, mismo motor de la suite) ----------

export interface FfmpegLike {
  load(opts: { coreURL: string; wasmURL: string }): Promise<boolean>
  exec(args: string[]): Promise<number>
  terminate(): Promise<void>
  on(event: 'progress', cb: (e: { progress: number; time: number }) => void): void
  on(event: 'log', cb: (e: { type: string; message: string }) => void): void
  writeFile(name: string, data: Uint8Array): Promise<boolean>
  readFile(name: string): Promise<Uint8Array>
  deleteFile(name: string): Promise<boolean>
}

declare global {
  interface Window {
    FFmpegWASM?: { FFmpeg: new () => FfmpegLike }
  }
}

interface Handlers {
  log?: (line: string) => void
  progress?: (ratio: number) => void
}

const handlers: Handlers = {}

/** registra callbacks de log/progreso para la instancia singleton */
export function setHandlers(h: Handlers) {
  Object.assign(handlers, h)
}

let scriptLoaded = false
let instance: FfmpegLike | null = null

/** carga (una única vez) el motor FFmpeg servido por la propia app */
export async function ensureFFmpeg(): Promise<FfmpegLike> {
  if (instance) return instance
  if (!scriptLoaded) {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = '/ffmpeg/ffmpeg.js'
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('No pude cargar el motor FFmpeg local'))
      document.head.appendChild(s)
    })
    scriptLoaded = true
  }
  const FF = new window.FFmpegWASM!.FFmpeg()
  FF.on('log', (e) => handlers.log?.(e.message))
  FF.on('progress', (e) => handlers.progress?.(Math.max(0, Math.min(1, e.progress))))
  await FF.load({
    coreURL: '/ffmpeg/ffmpeg-core.js',
    wasmURL: '/ffmpeg/ffmpeg-core.wasm',
  })
  instance = FF
  return FF
}

export function downloadBytes(data: Uint8Array, name: string, mime: string) {
  const blob = new Blob([data.slice().buffer as ArrayBuffer], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function isVideo(file: File): boolean {
  return /^video\//.test(file.type) || /\.(mp4|webm|mov|m4v|mkv|avi)$/i.test(file.name)
}

export function isAudio(file: File): boolean {
  return /^audio\//.test(file.type) || /\.(mp3|m4a|wav|aac|ogg|flac|opus)$/i.test(file.name)
}
