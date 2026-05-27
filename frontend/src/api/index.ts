import http from './http'

export const authApi = {
  register: (data: { username: string; password: string; email?: string; nickname?: string }) =>
    http.post('/auth/register', data).then((r) => r.data),
  login: (data: { username: string; password: string }) =>
    http.post('/auth/login', data).then((r) => r.data),
  me: () => http.get('/auth/me').then((r) => r.data),
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
