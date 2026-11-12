import React, { useEffect, useRef, useState } from 'react'
import { fromUrl } from 'geotiff'

interface CogPreviewProps {
  href: string
}

type Band = Uint8Array | Float32Array | Int16Array | Uint16Array | Float64Array | Int8Array

function linearStretch(band: Band, nodata: number): { min: number; range: number } {
  let min = Infinity
  let max = -Infinity
  for (let i = 0; i < band.length; i++) {
    const v = band[i]
    if (v !== nodata) {
      if (v < min) min = v
      if (v > max) max = v
    }
  }
  return { min, range: max - min || 1 }
}

function clamp(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v
}

export const CogPreview: React.FC<CogPreviewProps> = ({ href }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        const tiff = await fromUrl(href)
        const imageCount = await tiff.getImageCount()
        // Use smallest overview (last image) for fast preview
        const image = await tiff.getImage(imageCount - 1)
        const bands = (await image.readRasters({ interleave: false })) as unknown as Band[]

        if (cancelled || bands.length < 3) return

        const width = image.getWidth()
        const height = image.getHeight()
        const canvas = canvasRef.current
        if (!canvas || cancelled) return

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')!
        const imgData = ctx.createImageData(width, height)
        const [r, g, b] = bands

        // Stretch each band independently to full 0-255 range
        const nodata = 0
        const sr = linearStretch(r, nodata)
        const sg = linearStretch(g, nodata)
        const sb = linearStretch(b, nodata)

        for (let i = 0; i < width * height; i++) {
          const ri = r[i]
          const gi = g[i]
          const bi = b[i]
          const isNodata = ri === nodata && gi === nodata && bi === nodata
          imgData.data[i * 4]     = clamp(Math.round(((ri - sr.min) / sr.range) * 255))
          imgData.data[i * 4 + 1] = clamp(Math.round(((gi - sg.min) / sg.range) * 255))
          imgData.data[i * 4 + 2] = clamp(Math.round(((bi - sb.min) / sb.range) * 255))
          imgData.data[i * 4 + 3] = isNodata ? 0 : 255
        }

        // Find the bounding box of non-transparent (non-nodata) pixels
        let minX = width, maxX = 0, minY = height, maxY = 0
        for (let i = 0; i < width * height; i++) {
          if (imgData.data[i * 4 + 3] > 0) {
            const x = i % width
            const y = Math.floor(i / width)
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
        }

        if (minX <= maxX) {
          // Write to an offscreen canvas then copy only the data extent to the main canvas
          const offscreen = document.createElement('canvas')
          offscreen.width = width
          offscreen.height = height
          offscreen.getContext('2d')!.putImageData(imgData, 0, 0)
          const cropW = maxX - minX + 1
          const cropH = maxY - minY + 1
          canvas.width = cropW
          canvas.height = cropH
          canvas.getContext('2d')!.drawImage(offscreen, minX, minY, cropW, cropH, 0, 0, cropW, cropH)
        } else {
          ctx.putImageData(imgData, 0, 0)
        }

        if (!cancelled) setStatus('done')
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : String(err))
          setStatus('error')
        }
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [href])

  return (
    <div className="cog-preview">
      {status === 'loading' && <div className="cog-status">Loading preview…</div>}
      {status === 'error' && (
        <div className="cog-status cog-error">Could not render preview: {errorMsg}</div>
      )}
      <canvas
        ref={canvasRef}
        style={{ display: status === 'done' ? 'block' : 'none', width: '100%' }}
        title="COG overview preview (linear-stretched)"
      />
    </div>
  )
}
