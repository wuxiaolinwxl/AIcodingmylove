import { pushApi } from '@/api'

const SW_PATH = '/sw.js'

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
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
  if (!isPushSupported()) return null
  const reg = await ensureServiceWorker()
  if (!reg) return null
  return await reg.pushManager.getSubscription()
}

export async function subscribePush(): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) return { ok: false, reason: '当前浏览器不支持推送' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, reason: '通知权限被拒绝' }

  const reg = await ensureServiceWorker()
  if (!reg) return { ok: false, reason: 'Service Worker 注册失败' }

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    const { publicKey } = await pushApi.publicKey()
    if (!publicKey) return { ok: false, reason: '服务器未配置 VAPID' }
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
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
  } catch (e) {}
  try {
    await pushApi.unsubscribe(endpoint)
  } catch (e) {}
  return { ok: true }
}
