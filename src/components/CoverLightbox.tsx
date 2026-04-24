import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  coverUrl: string
  projectName: string
}

export const CoverLightbox = ({ open, onClose, coverUrl, projectName }: Props) => {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.90)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      {/* Tasto chiudi */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16,
          width: 36, height: 36,
          background: 'rgba(255,255,255,0.15)',
          border: '2px solid rgba(255,255,255,0.4)',
          borderRadius: 4,
          color: 'white', fontSize: 18, fontWeight: 700,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Tahoma',
        }}
        onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
        onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
        aria-label="Chiudi"
      >
        ✕
      </button>

      {/* Immagine — stopPropagation per non chiudere al click sull'immagine */}
      <img
        src={coverUrl}
        alt={projectName}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '80vw',
          maxHeight: '80vh',
          objectFit: 'contain',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      />

      {/* Nome progetto */}
      <p
        onClick={e => e.stopPropagation()}
        style={{
          marginTop: 16,
          color: 'rgba(255,255,255,0.8)',
          fontSize: 12,
          fontFamily: 'Tahoma',
          textAlign: 'center',
        }}
      >
        {projectName}
      </p>
    </div>
  )
}
