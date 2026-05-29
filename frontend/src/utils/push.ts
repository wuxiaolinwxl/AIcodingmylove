import { pushApi } from '@/api'

const SW_PATH = '/sw.js'

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const isAppleMobile = /iPad|iPhone|iPod/.test(ua)
  // iPadOS 13+ reports as Macintosh but has touch
  const isIPadOS = ua.includes('Macintosh') && navigator.maxTouchPoints > 1
  return isAppleMobile || isIPadOS
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  if (nav.standalone === true) return true
  return window.matchMedia?.('(display-mode: standalone)').matches === true
}

function iosVersion(): number | null {
  if (typeof navigator === 'undefined') return null
  const m = navigator.userAgent.match(/OS (\d+)_(\d+)/)
  if (!m) return null
  return parseFloat(`${m[1]}.${m[2]}`)
}

export function isIOSReadyForPush(): boolean {
  if (!isIOS()) return true
  const v = iosVersion()
  if (v !== null && v < 16.4) return false
  return isStandalone()
}

export function isPushSupported() {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    return false
  }
  return isIOSReadyForPush()
}

export function notificationPermission(): NotificationPermission {
  if (typeof Notification === 'undefined') return 'denied'
  return Notification.permission
}

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    const existing = await navigator.serviceWorker.getRegistration(SW_PATH)
    if (existing) return existing
    return await navigator.serviceWorker.register(SW_PATH)
  } catch (e) {
    console.warn('SW register failed', e)
    return null
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i)
  return out
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null
  const reg = await ensureServiceWorker()
  if (!reg) return null
  return await reg.pushManager.getSubscription()
}

export async function subscribePush(): Promise<{ ok: boolean; reason?: string }> {
  if (typeof window === 'undefined' || !('PushManager' in window) || !('Notification' in window)) {
    return { ok: false, reason: '当前浏览器不支持推送' }
  }
  if (isIOS() && !isIOSReadyForPush()) {
    const v = iosVersion()
    if (v !== null && v < 16.4) {
      return { ok: false, reason: '需要 iOS 16.4 或更新版本' }
    }
    return {
      ok: false,
      reason: '请先把网页"添加到主屏幕"，再从主屏幕图标打开后开启提醒',
    }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, reason: '通知权限被拒绝' }

  const reg = await ensureServiceWorker()
  if (!reg) return { ok: false, reason: 'Service Worker 注册失败' }

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    const { publicKey } = await pushApi.publicKey()
    if (!publicKey) return { ok: false, reason: '服务器未配置 VAPID' }
    try {
      const key = urlBase64ToUint8Array(publicKey)
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key.buffer as ArrayBuffer,
      })
    } catch (e: any) {
      return { ok: false, reason: e?.message || '订阅失败' }
    }
  }

  const json = sub.toJSON() as any
  await pushApi.subscribe({
    endpoint: json.endpoint,
    keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
    userAgent: navigator.userAgent,
  })
  return { ok: true }
}

export async function unsubscribePush(): Promise<{ ok: boolean }> {
  const sub = await getCurrentPushSubscription()
  if (!sub) return { ok: true }
  const endpoint = sub.endpoint
  try {
    await sub.unsubscribe()
  } catch (e) {
    console.warn('unsubscribe failed', e)
  }
  try {
    await pushApi.unsubscribe(endpoint)
  } catch (e) {
    console.warn('server unsubscribe failed', e)
  }
  return { ok: true }
}
