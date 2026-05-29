import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import { io, Socket } from 'socket.io-client'
import { chatApi } from '@/api'

export const useChatStore = defineStore('chat', () => {
  const unread = ref(0)
  const socket = shallowRef<Socket | null>(null)
  const onlineUserIds = ref<number[]>([])

  async function fetchUnread() {
    try {
      const res = await chatApi.unread()
      unread.value = res.count || 0
    } catch {
      // ignore
    }
    return unread.value
  }

  function increment(n = 1) {
    unread.value = Math.max(0, unread.value + n)
  }

  function clear() {
    unread.value = 0
  }

  function connect(token: string): Socket {
    if (socket.value && socket.value.connected) return socket.value
    if (socket.value) {
      socket.value.connect()
      return socket.value
    }
    const s = io(`${location.protocol}//${location.host}/chat`, {
      transports: ['websocket', 'polling'],
      auth: { token },
      path: '/socket.io',
    })
    s.on('connected', (payload: { userId: number; coupleId: number; online: number[] }) => {
      onlineUserIds.value = Array.isArray(payload.online) ? [...payload.online] : []
    })
    s.on('presence', (payload: { userId: number; online: boolean }) => {
      const list = onlineUserIds.value
      if (payload.online) {
        if (!list.includes(payload.userId)) onlineUserIds.value = [...list, payload.userId]
      } else {
        onlineUserIds.value = list.filter((id) => id !== payload.userId)
      }
    })
    s.on('disconnect', () => {
      onlineUserIds.value = []
    })
    socket.value = s
    return s
  }

  function disconnect() {
    socket.value?.disconnect()
    socket.value = null
    onlineUserIds.value = []
  }

  return {
    unread,
    socket,
    onlineUserIds,
    fetchUnread,
    increment,
    clear,
    connect,
    disconnect,
  }
})
