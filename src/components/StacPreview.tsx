import React, { useState } from 'react'

const SIMPLE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
const SIMPLE_IMAGE_EXT = /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i
const ANY_IMAGE_EXT = /\.(tif|tiff|png|jpg|jpeg|webp|gif)(\?.*)?$/i

function isImageAsset(asset: unknown): boolean {
  if (!asset || typeof asset !== 'object') return false
  const a = asset as Record<string, unknown>
  const type = typeof a.type === 'string' ? a.type.toLowerCase() : ''
  const roles = Array.isArray(a.roles) ? (a.roles as string[]) : []
  const href = typeof a.href === 'string' ? a.href : ''

  if (type.startsWith('image/')) return true
  if (roles.some((r) => ['visual', 'overview', 'thumbnail'].includes(r))) return true
  if (ANY_IMAGE_EXT.test(href)) return true

  return false
}

function isSimpleImage(a: Record<string, unknown>): boolean {
  const type = typeof a.type === 'string' ? a.type.toLowerCase() : ''
  const href = typeof a.href === 'string' ? a.href : ''
  return SIMPLE_IMAGE_TYPES.some((t) => type.startsWith(t)) || SIMPLE_IMAGE_EXT.test(href)
}

function getSourceCoopUrl(href: string): string | null {
  if (/^https?:\/\/data\.source\.coop\//.test(href)) {
    return href.replace(/^https?:\/\/data\.source\.coop\//, 'https://source.coop/')
  }
  if (/^https?:\/\/source\.coop\//.test(href)) {
    return href
  }
  return null
}

export function hasPreviewableAssets(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const assets = (data as Record<string, unknown>).assets
  if (!assets || typeof assets !== 'object') return false
  return Object.values(assets as Record<string, unknown>).some(isImageAsset)
}

function AssetImage({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false)
  if (errored) {
    return <div className="asset-image-error">Image could not be loaded.</div>
  }
  return <img src={src} alt={alt} onError={() => setErrored(true)} />
}

interface StacPreviewProps {
  data: unknown
}

export const StacPreview: React.FC<StacPreviewProps> = ({ data }) => {
  if (!data || typeof data !== 'object') return null

  const assets = (data as Record<string, unknown>).assets as
    | Record<string, unknown>
    | undefined

  if (!assets) {
    return <div className="preview-empty">No assets found in this STAC item.</div>
  }

  const imageAssets = Object.entries(assets).filter(([, v]) => isImageAsset(v))

  if (imageAssets.length === 0) {
    return <div className="preview-empty">No image assets found in this STAC item.</div>
  }

  return (
    <div className="stac-preview">
      {imageAssets.map(([key, asset]) => {
        const a = asset as Record<string, unknown>
        const href = typeof a.href === 'string' ? a.href : ''
        const title = typeof a.title === 'string' ? a.title : key
        const type = typeof a.type === 'string' ? a.type : ''
        const roles = Array.isArray(a.roles) ? (a.roles as string[]) : []
        const sourceCoopUrl = getSourceCoopUrl(href)
        const simple = isSimpleImage(a)

        return (
          <div key={key} className="asset-card">
            <div className="asset-header">
              <span className="asset-name">{title}</span>
              {roles.length > 0 && (
                <span className="asset-roles">{roles.join(', ')}</span>
              )}
              {type && <span className="asset-type">{type}</span>}
            </div>

            {simple && href && (
              <div className="asset-image-preview">
                <AssetImage src={href} alt={title} />
              </div>
            )}

            <div className="asset-actions">
              {sourceCoopUrl ? (
                <a
                  href={sourceCoopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="asset-btn"
                >
                  View on Source Cooperative ↗
                </a>
              ) : href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="asset-btn"
                >
                  Open asset ↗
                </a>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
