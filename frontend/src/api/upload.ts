import http from './http'

export async function uploadToOss(
  file: File,
  scope: string,
  type: string,
  onProgress?: (percent: number) => void,
) {
  const form = new FormData()
  form.append('file', file)

  const res = await http.post(`/oss/upload?scope=${encodeURIComponent(scope)}&type=${encodeURIComponent(type)}`, form, {
    timeout: 300000,
    onUploadProgress(e) {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    },
  })

  onProgress?.(100)
  return res.data as { key: string; url: string; size: number; name: string }
}
