const compressImage = (file: File, maxWidth = 750, quality = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width <= maxWidth) return resolve(file)
      height = Math.round((maxWidth / width) * height)
      width = maxWidth
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas 不可用'))
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('压缩失败')), 'image/jpeg', quality)
    }
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = URL.createObjectURL(file)
  })
}

export { compressImage }