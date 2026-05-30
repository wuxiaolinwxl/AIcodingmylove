import http from './http'

export const authApi = {
  register: (data: { username: string; password: string; email?: string; nickname?: string }) =>
    http.post('/auth/register', data).then((r) => r.data),
  login: (data: { username: string; password: string }) =>
    http.post('/auth/login', data).then((r) => r.data),
  me: () => http.get('/auth/me').then((r) => r.data),
}

export const userApi = {
  updateMe: (data: {
    nickname?: string
    solarBirthday?: string | null
    lunarBirthday?: string | null
    lunarIsLeap?: boolean
    avatarUrl?: string | null
  }) => http.patch('/user/me', data).then((r) => r.data),
}

export const coupleApi = {
  invite: () => http.post('/couple/invite').then((r) => r.data),
  accept: (code: string) => http.post('/couple/accept', { code }).then((r) => r.data),
  info: () => http.get('/couple/info').then((r) => r.data),
  update: (data: { spaceName?: string; anniversaryDate?: string }) =>
    http.patch('/couple/info', data).then((r) => r.data),
}

export const memoryApi = {
  create: (data: any) => http.post('/memories', data).then((r) => r.data),
  list: (params: any) => http.get('/memories', { params }).then((r) => r.data),
  months: () => http.get('/memories/months').then((r) => r.data),
  stats: () =>
    http.get<Record<string, number>>('/memories/stats').then((r) => r.data),
  remove: (id: number) => http.delete(`/memories/${id}`).then((r) => r.data),
}

export const chatApi = {
  history: (before?: number, limit = 30) =>
    http.get('/messages', { params: { before, limit } }).then((r) => r.data),
  search: (q: string, page = 1, pageSize = 20) =>
    http.get('/messages/search', { params: { q, page, pageSize } }).then((r) => r.data),
  unread: () =>
    http.get<{ count: number }>('/messages/unread').then((r) => r.data),
}

export const ossApi = {
  upload: (file: File, scope: string, type: string) => {
    const form = new FormData()
    form.append('file', file)
    return http.post(`/oss/upload?scope=${encodeURIComponent(scope)}&type=${encodeURIComponent(type)}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },
}

export const pushApi = {
  publicKey: () => http.get<{ publicKey: string }>('/push/vapid-public-key').then((r) => r.data),
  subscribe: (data: { endpoint: string; keys: { p256dh: string; auth: string }; userAgent?: string }) =>
    http.post('/push/subscribe', data).then((r) => r.data),
  unsubscribe: (endpoint: string) =>
    http.delete('/push/subscribe', { data: { endpoint } }).then((r) => r.data),
}

export const bucketApi = {
  list: () => http.get('/bucket').then((r) => r.data),
  dailyTask: () => http.get('/bucket/daily').then((r) => r.data),
  toggle: (id: number) => http.post(`/bucket/${id}/toggle`).then((r) => r.data),
  addCustom: (data: { title: string; category?: string }) =>
    http.post('/bucket/custom', data).then((r) => r.data),
  removeCustom: (id: number) => http.delete(`/bucket/custom/${id}`).then((r) => r.data),
}

export const anniversaryApi = {
  list: () => http.get('/anniversary').then((r) => r.data),
  create: (data: any) => http.post('/anniversary', data).then((r) => r.data),
  update: (id: number, data: any) => http.patch(`/anniversary/${id}`, data).then((r) => r.data),
  remove: (id: number) => http.delete(`/anniversary/${id}`).then((r) => r.data),
  notes: (id: number) => http.get(`/anniversary/${id}/notes`).then((r) => r.data),
  saveMyNote: (id: number, content: string) =>
    http.put(`/anniversary/${id}/notes/me`, { content }).then((r) => r.data),
  removeMyNote: (id: number) => http.delete(`/anniversary/${id}/notes/me`).then((r) => r.data),
}

export const gameApi = {
  list: () => http.get('/game').then((r) => r.data),
  recent: () => http.get('/game/recent').then((r) => r.data),
  play: (game: string, payload?: any) =>
    http.post(`/game/${game}/play`, payload || {}).then((r) => r.data),
}
