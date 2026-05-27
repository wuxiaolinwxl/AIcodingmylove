import { defineStore } from 'pinia'
import { ref } from 'vue'
import { coupleApi } from '@/api'

export interface CoupleInfo {
  id: number
  spaceName: string
  anniversaryDate: string | null
  createdAt: string
  members: { id: number; username: string; nickname: string; avatarUrl: string | null }[]
}

export const useCoupleStore = defineStore('couple', () => {
  const info = ref<CoupleInfo | null>(null)
  const inviteCode = ref('')
  const inviteExpiresAt = ref('')

  async function fetchInfo() {
    info.value = await coupleApi.info()
    return info.value
  }

  async function createInvite() {
    const res = await coupleApi.invite()
    inviteCode.value = res.code
    inviteExpiresAt.value = res.expiresAt
    return res
  }

  async function accept(code: string) {
    const res = await coupleApi.accept(code)
    info.value = res
    return res
  }

  async function update(data: { spaceName?: string; anniversaryDate?: string }) {
    info.value = await coupleApi.update(data)
    return info.value
  }

  function clear() {
    info.value = null
    inviteCode.value = ''
    inviteExpiresAt.value = ''
  }

  return { info, inviteCode, inviteExpiresAt, fetchInfo, createInvite, accept, update, clear }
})
