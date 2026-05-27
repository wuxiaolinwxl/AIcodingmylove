import http from './http'

export async function uploadToOss(file: File, scope: string, type: string) {
  const form = new FormData()
  form.append('file', file)

  const res = await http.post(`/oss/upload?scope=${encodeURIComponent(scope)}&type=${encodeURIComponent(type)}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return res.data as { key: string; url: string; size: number; name: string }
}
