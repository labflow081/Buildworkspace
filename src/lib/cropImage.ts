// Ritaglia un'immagine al rapporto 6:5 centrando il soggetto
export const cropTo6x5 = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const targetRatio = 6 / 5
      const imgRatio = img.width / img.height

      let sx: number, sy: number, sw: number, sh: number

      if (imgRatio > targetRatio) {
        sh = img.height
        sw = sh * targetRatio
        sx = (img.width - sw) / 2
        sy = 0
      } else {
        sw = img.width
        sh = sw / targetRatio
        sx = 0
        sy = (img.height - sh) / 2
      }

      const canvas = document.createElement('canvas')
      const OUTPUT_W = 480
      const OUTPUT_H = 400
      canvas.width = OUTPUT_W
      canvas.height = OUTPUT_H

      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUTPUT_W, OUTPUT_H)
      URL.revokeObjectURL(url)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Canvas toBlob fallito'))
        },
        'image/jpeg',
        0.88
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Impossibile caricare immagine'))
    }

    img.src = url
  })
}
