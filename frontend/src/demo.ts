const MOCK_USER = {
  id: 1,
  username: 'xiaoming',
  nickname: '小明',
  email: 'xiaoming@example.com',
  avatarUrl: null,
  coupleId: 1,
}

const MOCK_COUPLE = {
  id: 1,
  spaceName: '小明 & 小红',
  anniversaryDate: '2024-05-20',
  createdAt: '2024-05-20T10:00:00.000Z',
  members: [
    { id: 1, username: 'xiaoming', nickname: '小明', avatarUrl: null },
    { id: 2, username: 'xiaohong', nickname: '小红', avatarUrl: null },
  ],
}

const MOCK_MEMORIES = (() => {
  const items: any[] = []
  let id = 1

  // 7 photos on 2025-05-20 (triggers album aggregation)
  for (let i = 0; i < 7; i++) {
    items.push({
      id: id++,
      coupleId: 1,
      uploaderId: i % 2 === 0 ? 1 : 2,
      type: 'photo',
      title: `五月的回忆 ${i + 1}`,
      content: null,
      ossKey: `memory/1/photo/20250520/img${i}.jpg`,
      ossUrl: `https://picsum.photos/seed/${i + 10}/800/600`,
      coverUrl: null,
      fileSize: 1024000 + i * 100000,
      memoryDate: '2025-05-20T10:00:00.000Z',
      createdAt: '2025-05-20T10:00:00.000Z',
    })
  }

  // A few more varied items
  items.push({
    id: id++, coupleId: 1, uploaderId: 1, type: 'text',
    title: null, content: '今天阳光很好，我们在公园里散步，你笑起来的样子真好看。',
    ossKey: null, ossUrl: null, coverUrl: null, fileSize: 0,
    memoryDate: '2025-05-18T15:00:00.000Z', createdAt: '2025-05-18T15:00:00.000Z',
  })
  items.push({
    id: id++, coupleId: 1, uploaderId: 2, type: 'song',
    title: '晴天 - 周杰伦', content: '我们的歌',
    ossKey: 'memory/1/song/sunny.mp3', ossUrl: '', coverUrl: null, fileSize: 5120000,
    memoryDate: '2025-05-15T20:00:00.000Z', createdAt: '2025-05-15T20:00:00.000Z',
  })
  items.push({
    id: id++, coupleId: 1, uploaderId: 1, type: 'video',
    title: '海边日落', content: '第一次看海',
    ossKey: 'memory/1/video/sunset.mp4', ossUrl: '', coverUrl: 'https://picsum.photos/seed/sunset/800/450', fileSize: 20480000,
    memoryDate: '2025-04-28T18:30:00.000Z', createdAt: '2025-04-28T18:30:00.000Z',
  })
  items.push({
    id: id++, coupleId: 1, uploaderId: 2, type: 'photo',
    title: '樱花', content: null,
    ossKey: 'memory/1/photo/sakura.jpg', ossUrl: 'https://picsum.photos/seed/sakura/800/600', coverUrl: null, fileSize: 2048000,
    memoryDate: '2025-04-10T14:00:00.000Z', createdAt: '2025-04-10T14:00:00.000Z',
  })
  items.push({
    id: id++, coupleId: 1, uploaderId: 1, type: 'text',
    title: null, content: '认识你是我这辈子最幸运的事。',
    ossKey: null, ossUrl: null, coverUrl: null, fileSize: 0,
    memoryDate: '2025-03-14T09:00:00.000Z', createdAt: '2025-03-14T09:00:00.000Z',
  })
  // More photos in March
  for (let i = 0; i < 3; i++) {
    items.push({
      id: id++, coupleId: 1, uploaderId: 1, type: 'photo',
      title: `春日写真 ${i + 1}`, content: null,
      ossKey: `memory/1/photo/spring${i}.jpg`,
      ossUrl: `https://picsum.photos/seed/spring${i}/800/600`,
      coverUrl: null, fileSize: 1500000,
      memoryDate: '2025-03-08T11:00:00.000Z', createdAt: '2025-03-08T11:00:00.000Z',
    })
  }
  items.push({
    id: id++, coupleId: 1, uploaderId: 2, type: 'text',
    title: null, content: '山顶的风好大，但牵着你的手就不冷了。',
    ossKey: null, ossUrl: null, coverUrl: null, fileSize: 0,
    memoryDate: '2025-02-14T16:00:00.000Z', createdAt: '2025-02-14T16:00:00.000Z',
  })

  return items
})()

const MOCK_MESSAGES: any[] = [
  { id: 1, coupleId: 1, senderId: 1, msgType: 'text', content: '今天天气好好，想出去走走', ossKey: null, fileName: null, fileSize: 0, readAt: '2025-05-20T09:01:00.000Z', createdAt: '2025-05-20T09:00:00.000Z' },
  { id: 2, coupleId: 1, senderId: 2, msgType: 'text', content: '好呀！我们去海边吧', ossKey: null, fileName: null, fileSize: 0, readAt: '2025-05-20T09:02:00.000Z', createdAt: '2025-05-20T09:01:30.000Z' },
  { id: 3, coupleId: 1, senderId: 1, msgType: 'text', content: '上次旅行拍的照片你整理了吗？', ossKey: null, fileName: null, fileSize: 0, readAt: '2025-05-20T09:03:00.000Z', createdAt: '2025-05-20T09:03:00.000Z' },
  { id: 4, coupleId: 1, senderId: 2, msgType: 'text', content: '整理了一些，都放到时间轴里了', ossKey: null, fileName: null, fileSize: 0, readAt: '2025-05-20T09:04:00.000Z', createdAt: '2025-05-20T09:03:30.000Z' },
  { id: 5, coupleId: 1, senderId: 1, msgType: 'text', content: '你生日那天的照片特别好看', ossKey: null, fileName: null, fileSize: 0, readAt: '2025-05-20T09:05:00.000Z', createdAt: '2025-05-20T09:05:00.000Z' },
  { id: 6, coupleId: 1, senderId: 2, msgType: 'text', content: '哈哈谢谢！那天好开心', ossKey: null, fileName: null, fileSize: 0, readAt: '2025-05-20T09:06:00.000Z', createdAt: '2025-05-20T09:05:30.000Z' },
  { id: 7, coupleId: 1, senderId: 1, msgType: 'text', content: '下次面试加油哦，你一定可以的', ossKey: null, fileName: null, fileSize: 0, readAt: '2025-05-20T09:07:00.000Z', createdAt: '2025-05-20T09:07:00.000Z' },
  { id: 8, coupleId: 1, senderId: 2, msgType: 'text', content: '嗯嗯！面试完我们去吃晚饭', ossKey: null, fileName: null, fileSize: 0, readAt: '2025-05-20T09:08:00.000Z', createdAt: '2025-05-20T09:07:30.000Z' },
  { id: 9, coupleId: 1, senderId: 1, msgType: 'text', content: '好的，想吃什么？夜市那边的小吃还是正餐？', ossKey: null, fileName: null, fileSize: 0, readAt: '2025-05-20T09:09:00.000Z', createdAt: '2025-05-20T09:09:00.000Z' },
  { id: 10, coupleId: 1, senderId: 2, msgType: 'text', content: '去夜市吧！上次那个摊位的烤串超好吃', ossKey: null, fileName: null, fileSize: 0, readAt: '2025-05-20T09:10:00.000Z', createdAt: '2025-05-20T09:09:30.000Z' },
  { id: 11, coupleId: 1, senderId: 1, msgType: 'text', content: '还记得我们在山顶看日出吗', ossKey: null, fileName: null, fileSize: 0, readAt: '2025-05-20T09:11:00.000Z', createdAt: '2025-05-20T09:11:00.000Z' },
  { id: 12, coupleId: 1, senderId: 2, msgType: 'text', content: '当然记得！那天冷得要命但超值', ossKey: null, fileName: null, fileSize: 0, readAt: '2025-05-20T09:12:00.000Z', createdAt: '2025-05-20T09:11:30.000Z' },
  { id: 13, coupleId: 1, senderId: 1, msgType: 'text', content: '暑假我们去海边旅行吧', ossKey: null, fileName: null, fileSize: 0, readAt: '2025-05-20T09:13:00.000Z', createdAt: '2025-05-20T09:13:00.000Z' },
  { id: 14, coupleId: 1, senderId: 2, msgType: 'text', content: '太好了！可以拍很多照片', ossKey: null, fileName: null, fileSize: 0, readAt: '2025-05-20T09:14:00.000Z', createdAt: '2025-05-20T09:13:30.000Z' },
  { id: 15, coupleId: 1, senderId: 1, msgType: 'text', content: '晚安，做个好梦', ossKey: null, fileName: null, fileSize: 0, readAt: '2025-05-20T23:01:00.000Z', createdAt: '2025-05-20T23:00:00.000Z' },
  { id: 16, coupleId: 1, senderId: 2, msgType: 'text', content: '晚安呀，明天见', ossKey: null, fileName: null, fileSize: 0, readAt: null, createdAt: '2025-05-20T23:00:30.000Z' },
]

function matchPath(url: string, path: string) {
  const u = new URL(url, 'http://localhost')
  return u.pathname === path || u.pathname === `/api${path}`
}

function getQuery(url: string) {
  const u = new URL(url, 'http://localhost')
  return Object.fromEntries(u.searchParams.entries())
}

function handleMockRequest(method: string, url: string, body?: any): { status: number; data: any } | null {
  method = method.toUpperCase()

  // Auth
  if (method === 'POST' && (matchPath(url, '/auth/login') || matchPath(url, '/auth/register'))) {
    return { status: 200, data: { token: 'demo_token_123', user: MOCK_USER } }
  }
  if (method === 'GET' && matchPath(url, '/auth/me')) {
    return { status: 200, data: MOCK_USER }
  }

  // Couple
  if (method === 'POST' && matchPath(url, '/couple/invite')) {
    return { status: 200, data: { code: 'DEMO1234', expiresAt: new Date(Date.now() + 86400000).toISOString() } }
  }
  if (method === 'POST' && matchPath(url, '/couple/accept')) {
    return { status: 200, data: MOCK_COUPLE }
  }
  if (method === 'GET' && matchPath(url, '/couple/info')) {
    return { status: 200, data: MOCK_COUPLE }
  }
  if (method === 'PATCH' && matchPath(url, '/couple/info')) {
    return { status: 200, data: { ...MOCK_COUPLE, ...body } }
  }

  // Messages search (must be before /messages)
  if (method === 'GET' && matchPath(url, '/messages/search')) {
    const q = getQuery(url).q?.toLowerCase() || ''
    const filtered = MOCK_MESSAGES.filter(
      (m) => (m.content || '').toLowerCase().includes(q) || (m.fileName || '').toLowerCase().includes(q)
    )
    return { status: 200, data: { items: filtered, total: filtered.length, page: 1, pageSize: 50 } }
  }

  // Messages
  if (method === 'GET' && matchPath(url, '/messages')) {
    return { status: 200, data: MOCK_MESSAGES }
  }

  // Memories months
  if (method === 'GET' && matchPath(url, '/memories/months')) {
    const monthMap: Record<string, number> = {}
    for (const m of MOCK_MEMORIES) {
      const month = m.memoryDate.slice(0, 7)
      monthMap[month] = (monthMap[month] || 0) + 1
    }
    return { status: 200, data: Object.entries(monthMap).map(([month, count]) => ({ month, count })) }
  }

  // Memories
  if (method === 'GET' && matchPath(url, '/memories')) {
    const query = getQuery(url)
    let filtered = [...MOCK_MEMORIES]
    if (query.type) filtered = filtered.filter((m) => m.type === query.type)
    if (query.keyword) {
      const kw = query.keyword.toLowerCase()
      filtered = filtered.filter((m) => (m.title || '').toLowerCase().includes(kw) || (m.content || '').toLowerCase().includes(kw))
    }
    const page = parseInt(query.page || '1')
    const pageSize = parseInt(query.pageSize || '20')
    const start = (page - 1) * pageSize
    const items = filtered.slice(start, start + pageSize)
    return { status: 200, data: { items, total: filtered.length, page, pageSize, hasMore: start + pageSize < filtered.length } }
  }
  if (method === 'POST' && matchPath(url, '/memories')) {
    return { status: 201, data: { id: Date.now(), coupleId: 1, uploaderId: 1, ...body, createdAt: new Date().toISOString() } }
  }

  // OSS sign
  if (method === 'GET' && matchPath(url, '/oss/sign')) {
    return {
      status: 200,
      data: {
        accessId: 'demo_access_id',
        policy: btoa('{"expiration":"2099-01-01T00:00:00.000Z","conditions":[]}'),
        signature: 'demo_signature',
        host: location.origin,
        dir: 'demo/uploads/',
        key: 'demo/uploads/${filename}',
        expire: Math.floor(Date.now() / 1000) + 600,
      },
    }
  }

  return null
}

export function setupDemoMode() {
  // Intercept fetch
  const originalFetch = window.fetch
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
    const method = init?.method || 'GET'
    let body: any = undefined
    if (init?.body && typeof init.body === 'string') {
      try { body = JSON.parse(init.body) } catch {}
    }

    const mock = handleMockRequest(method, url, body)
    if (mock) {
      return new Response(JSON.stringify(mock.data), {
        status: mock.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return originalFetch(input, init)
  }

  // Intercept XMLHttpRequest
  const OriginalXHR = window.XMLHttpRequest
  const XHRProto = OriginalXHR.prototype

  const originalOpen = XHRProto.open
  const originalSend = XHRProto.send

  XHRProto.open = function (method: string, url: string | URL, ...args: any[]) {
    (this as any)._mockMethod = method;
    (this as any)._mockUrl = typeof url === 'string' ? url : url.href
    return originalOpen.apply(this, [method, url, ...args] as any)
  }

  XHRProto.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
    const method = (this as any)._mockMethod || 'GET'
    const url = (this as any)._mockUrl || ''
    let parsedBody: any = undefined
    if (body && typeof body === 'string') {
      try { parsedBody = JSON.parse(body) } catch {}
    }

    const mock = handleMockRequest(method, url, parsedBody)
    if (mock) {
      setTimeout(() => {
        Object.defineProperty(this, 'readyState', { value: 4, writable: true })
        Object.defineProperty(this, 'status', { value: mock.status, writable: true })
        Object.defineProperty(this, 'responseText', { value: JSON.stringify(mock.data), writable: true })
        Object.defineProperty(this, 'response', { value: JSON.stringify(mock.data), writable: true })
        this.dispatchEvent(new Event('readystatechange'))
        this.dispatchEvent(new Event('load'))
        this.dispatchEvent(new Event('loadend'))
      }, 100)
      return
    }
    return originalSend.call(this, body)
  }

  console.log('[Demo Mode] Mock API interceptors activated')
}
