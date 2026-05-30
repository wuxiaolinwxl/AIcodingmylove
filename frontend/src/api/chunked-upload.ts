import http from './http'

const CHUNK_SIZE = 2 * 1024 * 1024

export async function uploadChunked(
  file: File,
  scope: string,
  type: string,
  onProgress?: (percent: number) => void,
): Promise<{ key: string; url: string; size: number; name: string }> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

  const { data: initRes } = await http.post('/oss/chunk/init', {
    fileName: file.name,
    fileSize: file.size,
    totalChunks,
    scope,
    type,
  })
  const uploadId: string = initRes.uploadId

  const sessionKey = `chunk_${file.name}_${file.size}`
  const completedSet = new Set<number>(
    JSON.parse(sessionStorage.getItem(sessionKey) || '[]'),
  )

  for (let i = 0; i < totalChunks; i++) {
    if (completedSet.has(i)) {
      onProgress?.(Math.round(((i + 1) / totalChunks) * 100))
      continue
    }
    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const blob = file.slice(start, end)

    const form = new FormData()
    form.append('file', blob, `chunk_${i}`)

    await http.post(`/oss/chunk/upload?uploadId=${uploadId}&chunkIndex=${i}`, form)

    completedSet.add(i)
    sessionStorage.setItem(sessionKey, JSON.stringify([...completedSet]))
    onProgress?.(Math.round(((i + 1) / totalChunks) * 100))
  }

  const { data: mergeRes } = await http.post('/oss/chunk/merge', { uploadId })
  sessionStorage.removeItem(sessionKey)
  return mergeRes
}
