'use client'

// Vortex Media - Convertir, extraer audio y comprimir con FFmpeg local.
// El motor wasm se sirve desde la propia app: nada viaja por internet.

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Film,
  Music,
  Download,
  PackageOpen,
  PlayCircle,
  AlertTriangle,
  Terminal,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
} from 'lucide-react'
import {
  OPS,
  buildArgs,
  downloadBytes,
  ensureFFmpeg,
  fmtBytes,
  isAudio,
  isVideo,
  outName,
  setHandlers,
  type OpId,
} from '@/lib/media'

const SUPPORT_EMAIL = 'vortexmusic.soporte.app@gmail.com'
const ACCENT = '#f472b6'
const ACCENT2 = '#f9a8d4'

function VortexLogo({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="10" fill="#161616" />
      <circle cx="24" cy="24" r="17" fill="none" stroke={ACCENT} strokeWidth="3.5" />
      <path d="M24 10a14 14 0 1 1-9.9 4.1" fill="none" stroke={ACCENT2} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M24 17a7 7 0 1 0 7 7" fill="none" stroke={ACCENT2} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M20 18l8 6-8 6z" fill={ACCENT2} />
    </svg>
  )
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-[#2b2b31] bg-[#141416] px-6 py-4">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-1 text-center">
        <p className="text-[11px] text-[#9b9ba4]">
          Vórtex Media · Derechos Reservados © 2026 Vortex Company ·{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#f9a8d4] hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
        <p className="text-[11px] text-[#9b9ba4]">Gratis · Sin anuncios · 100% local en tu navegador</p>
      </div>
    </footer>
  )
}

const btn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#2b2b31] bg-[#1e1e22] px-3 py-2 text-xs font-medium text-[#ececf1] hover:bg-[#26262b] disabled:opacity-40 disabled:cursor-not-allowed transition-colors'

const btnAccent =
  'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#0f0f10] transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#f472b6] hover:bg-[#f9a8d4]'

export default function MediaApp() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [op, setOp] = useState<OpId>('compress')
  const [crf, setCrf] = useState(26)
  const [scale, setScale] = useState<0 | 480 | 720 | 1080>(720)
  const [audioQ, setAudioQ] = useState(3)
  const [webmQ, setWebmQ] = useState(10)
  const [webmKbps, setWebmKbps] = useState(1200)
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState('')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ name: string; size: number } | null>(null)
  const [error, setError] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setHandlers({
      log: (line) => setLogs((prev) => (prev.length > 300 ? [...prev.slice(-300), line] : [...prev, line])),
      progress: (r) => setProgress(r),
    })
  }, [])

  const pick = (f: File | null) => {
    if (!f) return
    if (!isVideo(f) && !isAudio(f)) {
      setError('Ese archivo no parece video ni audio.')
      return
    }
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setResult(null)
    setError('')
    setProgress(0)
    if (!isVideo(f)) setOp('mp3')
    setLogs([])
  }

  const clear = () => {
    setFile(null)
    setPreviewUrl('')
    setResult(null)
    setError('')
    setProgress(0)
    setLogs([])
  }

  const run = useCallback(async () => {
    if (!file) return
    setBusy(true)
    setError('')
    setResult(null)
    setProgress(0)
    setPhase('Cargando motor FFmpeg local…')
    try {
      const ff = await ensureFFmpeg()
      setPhase('Leyendo tu archivo…')
      const input = 'in' + (file.name.match(/\.[^.]+$/)?.[0] || '.mp4')
      await ff.writeFile(input, new Uint8Array(await file.arrayBuffer()))
      const output = 'out.' + (OPS.find((o) => o.id === op)?.ext ?? 'bin')
      await ff.deleteFile(output).catch(() => undefined)
      setPhase('Procesando…')
      const meta = OPS.find((o) => o.id === op)!
      const args = buildArgs(input, output, op, { crf, scale, audioQ, webmBitrate: { q: webmQ, kbps: webmKbps } })
      await ff.exec(args)
      const data = await ff.readFile(output)
      setPhase('')
      downloadBytes(data, outName(file.name, op), meta.mime)
      setResult({ name: outName(file.name, op), size: data.length })
      await ff.deleteFile(input).catch(() => undefined)
      await ff.deleteFile(output).catch(() => undefined)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'La operación falló. Prueba otra configuración.')
    } finally {
      setBusy(false)
      setProgress(0)
    }
  }, [file, op, crf, scale, audioQ, webmQ, webmKbps])

  const meta = OPS.find((o) => o.id === op)!

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[#2b2b31] bg-[#141416] px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <VortexLogo className="w-9 h-9" />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight">
              Vórtex Media <span className="font-normal text-[#9b9ba4]">· Video y audio, sin límites</span>
            </h1>
            <p className="text-[11px] text-[#9b9ba4]">Convierte, extrae audio y comprime con FFmpeg dentro de tu navegador</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-6">
        {/* 1. carga */}
        <div className="rounded-2xl border border-[#2b2b31] bg-[#17171a] p-5">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#9b9ba4]">
            <Film className="h-3.5 w-3.5" /> 1 · Carga tu video o audio
          </p>
          <input ref={fileRef} type="file" accept="video/*,audio/*" hidden onChange={(e) => { pick(e.target.files?.[0] ?? null); e.currentTarget.value = '' }} />
          {!file ? (
            <button className={btnAccent} onClick={() => fileRef.current?.click()}>
              <PackageOpen className="h-3.5 w-3.5" /> Elegir archivo
            </button>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="w-full max-w-[280px] shrink-0 overflow-hidden rounded-xl border border-[#2b2b31] bg-[#0f0f10]">
                {isVideo(file) ? (
                  <video src={previewUrl} controls className="h-auto w-full" />
                ) : (
                  <div className="flex h-28 items-center justify-center text-[#f9a8d4]">
                    <Music className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" title={file.name}>{file.name}</p>
                <p className="mt-1 text-xs text-[#9b9ba4]">{fmtBytes(file.size)} · {file.type || 'tipo desconocido'}</p>
                <button className={`${btn} mt-3`} onClick={clear}>
                  <X className="h-3.5 w-3.5" /> Quitar archivo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. operación */}
        {file && (
          <div className="rounded-2xl border border-[#2b2b31] bg-[#17171a] p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#9b9ba4]">
              <PlayCircle className="h-3.5 w-3.5" /> 2 · Elige qué hacer
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {OPS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setOp(o.id)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    op === o.id
                      ? 'border-[#f472b6] bg-[#26141d]'
                      : 'border-[#2b2b31] bg-[#0f0f10] hover:bg-[#1e1e22]'
                  }`}
                >
                  <span className="block text-sm font-semibold">{o.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-[#9b9ba4]">{o.desc}</span>
                </button>
              ))}
            </div>

            {/* opciones según operación */}
            <div className="mt-4 space-y-3">
              {op === 'compress' && (
                <>
                  <label className="block text-xs text-[#9b9ba4]">
                    Calidad CRF (menor = mejor calidad, más peso): <span className="font-mono text-[#ececf1]">{crf}</span>
                    <input type="range" min={18} max={34} value={crf} onChange={(e) => setCrf(parseInt(e.target.value, 10))} className="mt-1.5 w-full" />
                  </label>
                  <label className="block text-xs text-[#9b9ba4]">
                    Resolución máxima
                    <select
                      value={scale}
                      onChange={(e) => setScale(parseInt(e.target.value, 10) as 0 | 480 | 720 | 1080)}
                      className="mt-1.5 w-full rounded-lg border border-[#2b2b31] bg-[#0f0f10] px-3 py-2 text-sm text-[#ececf1] outline-none focus:border-[#f472b6]"
                    >
                      <option value={0}>Original</option>
                      <option value={1080}>1080p</option>
                      <option value={720}>720p</option>
                      <option value={480}>480p</option>
                    </select>
                  </label>
                </>
              )}
              {op === 'webm' && (
                <>
                  <label className="block text-xs text-[#9b9ba4]">
                    Calidad VP8 (CRF): <span className="font-mono text-[#ececf1]">{webmQ}</span>
                    <input type="range" min={4} max={31} value={webmQ} onChange={(e) => setWebmQ(parseInt(e.target.value, 10))} className="mt-1.5 w-full" />
                  </label>
                  <label className="block text-xs text-[#9b9ba4]">
                    Bitrate objetivo: <span className="font-mono text-[#ececf1]">{webmKbps} kbps</span>
                    <input type="range" min={300} max={4000} step={100} value={webmKbps} onChange={(e) => setWebmKbps(parseInt(e.target.value, 10))} className="mt-1.5 w-full" />
                  </label>
                </>
              )}
              {(op === 'mp3' || op === 'webm') && (
                <label className="block text-xs text-[#9b9ba4]">
                  Calidad de audio Vorbis/MP3 (0 = máxima, 9 = mínima): <span className="font-mono text-[#ececf1]">{audioQ}</span>
                  <input type="range" min={0} max={9} value={audioQ} onChange={(e) => setAudioQ(parseInt(e.target.value, 10))} className="mt-1.5 w-full" />
                </label>
              )}
              {op === 'm4a' && (
                <p className="text-[11px] text-[#9b9ba4]">El audio se recodifica a AAC 192 kbps para que siempre reproduzca en cualquier reproductor.</p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button className={btnAccent} onClick={run} disabled={busy}>
                {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                {busy ? phase || 'Procesando…' : `Generar ${outName(file.name, op)}`}
              </button>
            </div>

            {busy && (
              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#0f0f10]">
                  <div className="h-full rounded-full bg-[#f472b6] transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-[#9b9ba4]">{Math.round(progress * 100)}% · el motor corre en WebAssembly dentro de esta pestaña</p>
              </div>
            )}

            {result && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#2b2b31] bg-[#0f0f10] px-3 py-2.5 text-xs">
                <Download className="h-4 w-4 text-[#22c55e]" />
                <span className="text-[#ececf1]">{result.name}</span>
                <span className="text-[#9b9ba4]">{fmtBytes(result.size)} · descargado</span>
              </div>
            )}
            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#7f1d1d] bg-[#1a1214] px-3 py-2.5 text-xs text-[#f87171]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}
          </div>
        )}

        {/* notas */}
        <div className="rounded-2xl border border-[#2b2b31] bg-[#17171a] p-5">
          <button className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-[#9b9ba4]" onClick={() => setShowLogs((v) => !v)}>
            <span className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5" /> Registro del motor ({logs.length})
            </span>
            {showLogs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showLogs && (
            <pre className="mt-3 max-h-40 overflow-y-auto rounded-xl border border-[#2b2b31] bg-[#0f0f10] p-3 font-mono text-[10px] leading-relaxed text-[#9b9ba4]">
              {logs.length ? logs.join('\n') : 'El registro se llena al procesar un archivo.'}
            </pre>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-[#9b9ba4]">
            El motor FFmpeg WebAssembly corre en tu máquina: es más lento que un programa de escritorio, pero tus
            archivos jamás salen del navegador. Para vídeos largos deja la pestaña abierta hasta que termine.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
