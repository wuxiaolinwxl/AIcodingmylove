export function compressImage(
  file: File,
  maxSize = 512,
  quality = 0.85,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width <= maxSize && height <= maxSize && file.size <= 256 * 1024) {
        resolve(file)
        return
      }
      if (width > height) {
        if (width > maxSize) {
          height = Math.round(height * (maxSize / width))
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = Math.round(width * (maxSize / height))
          height = maxSize
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('压缩失败'))
            return
          }
          const name = file.name.replace(/\.[^.]+$/, '.jpg')
          const compressed = new File([blob], name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          resolve(compressed)
        },
        'image/jpeg',
        quality,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片读取失败'))
    }
    img.src = url
  })
}
