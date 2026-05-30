import http from './http'
import { uploadChunked } from './chunked-upload'

const CHUNK_THRESHOLD = 5 * 1024 * 1024

export async function uploadToOss(
  file: File,
  scope: string,
  type: string,
  onProgress?: (percent: number) => void,
) {
  if (file.size > CHUNK_THRESHOLD) {
    return uploadChunked(file, scope, type, onProgress)
  }

  const form = new FormData()
  form.append('file', file)

  const res = await http.post(`/oss/upload?scope=${encodeURIComponent(scope)}&type=${encodeURIComponent(type)}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  onProgress?.(100)
  return res.data as { key: string; url: string; size: number; name: string }
}
