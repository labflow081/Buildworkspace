import { useRef, useState } from 'react'
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

export const ChangeCoverDialog = ({ open, onClose, projectId, currentCover, onSaved }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentCover)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleBrowse = () => fileRef.current?.click()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    try {
      const cropped = await cropTo6x5(file)
      setBlob(cropped)
      setPreview(URL.createObjectURL(cropped))
    } catch {
      setError("Impossibile elaborare l'immagine.")
      playSound('error')
    }
    e.target.value = ''
  }

  const handleOk = async () => {
    if (!blob) { onClose(); return }
    setLoading(true)
    setError('')
    try {
      const filename = `${projectId}-${Date.now()}.jpg`
      const { error: uploadErr } = await supabase.storage
        .from('covers')
        .upload(filename, blob, { contentType: 'image/jpeg', upsert: true })

      if (uploadErr) throw uploadErr

      const { data } = supabase.storage.from('covers').getPublicUrl(filename)
      onSaved(data.publicUrl)
      playSound('open')
      setBlob(null)
      onClose()
    } catch {
      setError("Errore durante l'upload.")
      playSound('error')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setBlob(null)
    setPreview(currentCover)
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
      leftAction={
        <XPButton onClick={handleBrowse} disabled={loading}>
          Sfoglia...
        </XPButton>
      }
    >
      {/* Preview cartella */}
      <div className="flex flex-col items-center gap-2">
        <div style={{
          width: 120,
          height: 106,
          position: 'relative',
          flexShrink: 0,
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: 40, height: 6,
            background: '#E8B947',
            borderRadius: '3px 3px 0 0',
          }} />
          <div style={{
            position: 'absolute', top: 6, left: 0, right: 0, bottom: 0,
            background: preview ? undefined : 'linear-gradient(135deg, #F5D77A 0%, #E8B947 50%, #C99428 100%)',
            borderRadius: '2px 8px 4px 4px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            {preview && <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '30%',
              background: 'rgba(255,255,255,0.25)',
            }} />
          </div>
        </div>
        <p style={{ fontSize: 11, color: '#666' }}>
          {preview ? 'Anteprima copertina (ritaglio 6:5 automatico)' : 'Nessuna copertina selezionata'}
        </p>
      </div>

      {error && <div style={{ fontSize: 11, color: '#CC0000' }}>{error}</div>}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </XPDialog>
  )
}
