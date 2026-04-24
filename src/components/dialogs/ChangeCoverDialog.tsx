import { useRef, useState, useCallback } from 'react'
import { XPDialog } from '@/components/xp/XPDialog'
import { XPButton } from '@/components/xp/XPButton'
import { supabase } from '@/lib/supabase'
import { cropTo6x5 } from '@/lib/cropImage'
import { playSound } from '@/lib/sounds'

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
  currentCover: string | null
  onSaved: (url: string) => void
}

// Dimensioni preview (6:5)
const PW = 240
const PH = 200

export const ChangeCoverDialog = ({ open, onClose, projectId, currentCover, onSaved }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [rawFile, setRawFile] = useState<File | null>(null)
  const [rawUrl, setRawUrl] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(currentCover)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Posizione crop: 0-100 (corrisponde a object-position %)
  const [pos, setPos] = useState({ x: 50, y: 50 })

  const drag = useRef({ active: false, startX: 0, startY: 0, startPosX: 0, startPosY: 0 })

  const startDrag = useCallback((clientX: number, clientY: number) => {
    drag.current = { active: true, startX: clientX, startY: clientY, startPosX: pos.x, startPosY: pos.y }
  }, [pos])

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    if (!drag.current.active || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dx = (clientX - drag.current.startX) / rect.width * 100
    const dy = (clientY - drag.current.startY) / rect.height * 100
    setPos({
      x: Math.max(0, Math.min(100, drag.current.startPosX - dx)),
      y: Math.max(0, Math.min(100, drag.current.startPosY - dy)),
    })
  }, [])

  const stopDrag = useCallback(() => { drag.current.active = false }, [])

  const handleBrowse = () => fileRef.current?.click()

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    if (rawUrl) URL.revokeObjectURL(rawUrl)
    const url = URL.createObjectURL(file)
    setRawFile(file)
    setRawUrl(url)
    setPos({ x: 50, y: 50 })
    e.target.value = ''
  }

  const handleOk = async () => {
    if (!rawFile) { onClose(); return }
    setLoading(true)
    setError('')
    try {
      const blob = await cropTo6x5(rawFile, pos.x / 100, pos.y / 100)
      const filename = `${projectId}-${Date.now()}.jpg`
      const { error: uploadErr } = await supabase.storage
        .from('covers')
        .upload(filename, blob, { contentType: 'image/jpeg', upsert: true })
      if (uploadErr) throw uploadErr
      const { data } = supabase.storage.from('covers').getPublicUrl(filename)
      onSaved(data.publicUrl)
      playSound('open')
      handleClose()
    } catch {
      setError("Errore durante l'upload.")
      playSound('error')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (rawUrl) URL.revokeObjectURL(rawUrl)
    setRawFile(null)
    setRawUrl(null)
    setPreview(currentCover)
    setPos({ x: 50, y: 50 })
    setError('')
    onClose()
  }

  return (
    <XPDialog
      title="Cambia copertina"
      open={open}
      onClose={handleClose}
      onOk={handleOk}
      okDisabled={loading}
      leftAction={<XPButton onClick={handleBrowse} disabled={loading}>Sfoglia...</XPButton>}
    >
      <div className="flex flex-col items-center gap-2 select-none">

        {/* Preview interattivo */}
        <div
          ref={containerRef}
          style={{
            width: PW, height: PH,
            overflow: 'hidden',
            borderRadius: 4,
            border: '1px solid #7F9DB9',
            cursor: rawUrl ? 'grab' : 'default',
            position: 'relative',
            background: 'linear-gradient(135deg, #F5D77A 0%, #E8B947 50%, #C99428 100%)',
            flexShrink: 0,
          }}
          onMouseDown={e => { if (rawUrl) { e.preventDefault(); startDrag(e.clientX, e.clientY) } }}
          onMouseMove={e => moveDrag(e.clientX, e.clientY)}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onTouchStart={e => { if (rawUrl) startDrag(e.touches[0].clientX, e.touches[0].clientY) }}
          onTouchMove={e => { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY) }}
          onTouchEnd={stopDrag}
        >
          {/* Immagine grezza (prima della conferma) */}
          {rawUrl && (
            <img
              src={rawUrl}
              draggable={false}
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover',
                objectPosition: `${pos.x}% ${pos.y}%`,
                pointerEvents: 'none',
              }}
            />
          )}
          {/* Copertina attuale (se nessun rawUrl) */}
          {!rawUrl && preview && (
            <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {/* Lucentezza stile cartella */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '30%',
            background: 'rgba(255,255,255,0.18)', pointerEvents: 'none',
          }} />
          {/* Reticolo guida al centro */}
          {rawUrl && (
            <div style={{
              position: 'absolute', inset: 0,
              border: '1px solid rgba(255,255,255,0.3)',
              pointerEvents: 'none',
            }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.25)' }} />
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.25)' }} />
            </div>
          )}
        </div>

        <p style={{ fontSize: 10, color: '#666', textAlign: 'center', margin: 0 }}>
          {rawUrl
            ? '✋ Trascina per riposizionare il ritaglio 6:5'
            : preview
              ? 'Copertina attuale — clicca "Sfoglia..." per cambiarla'
              : 'Nessuna copertina — clicca "Sfoglia..." per aggiungerne una'}
        </p>
      </div>

      {error && <div style={{ fontSize: 11, color: '#CC0000' }}>{error}</div>}

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </XPDialog>
  )
}
