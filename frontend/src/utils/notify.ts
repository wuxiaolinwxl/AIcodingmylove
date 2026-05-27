let originalTitle = ''
let flashTimer: ReturnType<typeof setInterval> | null = null
let audioCtx: AudioContext | null = null
let lastBeepAt = 0

function ensureAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (audioCtx) return audioCtx
  const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext
  if (!Ctor) return null
  try {
    audioCtx = new Ctor()
    return audioCtx
  } catch {
    return null
  }
}

export function primeAudioOnGesture() {
  const handler = () => {
    const ctx = ensureAudioCtx()
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {})
    window.removeEventListener('pointerdown', handler)
    window.removeEventListener('keydown', handler)
  }
  window.addEventListener('pointerdown', handler, { once: true })
  window.addEventListener('keydown', handler, { once: true })
}

function beep() {
  const ctx = ensureAudioCtx()
  if (!ctx) return
  const now = Date.now()
  if (now - lastBeepAt < 800) return
  lastBeepAt = now

  if (ctx.state === 'suspended') ctx.resume().catch(() => {})

  const t0 = ctx.currentTime
  const tones = [
    { freq: 880, start: 0, dur: 0.16 },
    { freq: 660, start: 0.18, dur: 0.22 },
  ]
  for (const { freq, start, dur } of tones) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, t0 + start)
    gain.gain.exponentialRampToValueAtTime(0.18, t0 + start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t0 + start)
    osc.stop(t0 + start + dur + 0.02)
  }
}

function vibrate() {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate([180, 90, 180]) } catch { /* ignore */ }
  }
}

function startTitleFlash(text: string) {
  if (typeof document === 'undefined') return
  if (!originalTitle) originalTitle = document.title
  if (flashTimer) return
  let toggle = false
  flashTimer = setInterval(() => {
    document.title = toggle ? originalTitle : text
    toggle = !toggle
  }, 1000)
}

export function stopTitleFlash() {
  if (flashTimer) {
    clearInterval(flashTimer)
    flashTimer = null
  }
  if (typeof document !== 'undefined' && originalTitle) {
    document.title = originalTitle
  }
}

export function notifyNewMessage(opts: { preview?: string; bypassFocusCheck?: boolean } = {}) {
  if (typeof document === 'undefined') return
  const focused = document.visibilityState === 'visible' && document.hasFocus()
  const shouldHaptic = opts.bypassFocusCheck || !focused
  const shouldFlash = !focused

  beep()
  if (shouldHaptic) vibrate()
  if (shouldFlash) startTitleFlash('💬 新消息 · ' + (opts.preview || '悄悄话'))
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') stopTitleFlash()
  })
  window.addEventListener('focus', () => stopTitleFlash())
}
